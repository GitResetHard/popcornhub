import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { userActivities, watchedEpisodes, watchlistItems, type WatchlistItem } from '@/db/schema';
import { cacheForget } from '@/lib/cache';
import type { MediaType, WatchlistStatus } from '@/lib/enums';
import { watchlistStatusColor, watchlistStatusLabel } from '@/lib/enums';
import { checkAndGrantAchievements, grantXp, recordDailyStreak } from './gamification';
import { fetchMetadataSafely } from './tmdb-enricher';

/**
 * Watchlist. The table uses soft deletes, so every read filters on `deleted_at IS NULL` and
 * re-adding a removed title restores its row rather than inserting a duplicate the unique key
 * would reject.
 */

type WatchlistMediaType = Extract<MediaType, 'movie' | 'tv'>;

const notDeleted = isNull(watchlistItems.deletedAt);

export function clearStatsCache(userId: number): Promise<void> {
    return cacheForget(`user.${userId}.profile_stats`);
}

export async function findByUserAndTmdb(userId: number, tmdbId: number, mediaType: WatchlistMediaType): Promise<WatchlistItem | null> {
    const [item] = await db
        .select()
        .from(watchlistItems)
        .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.tmdbId, tmdbId), eq(watchlistItems.mediaType, mediaType), notDeleted))
        .limit(1);

    return item ?? null;
}

export async function getUserWatchlist(userId: number, status?: WatchlistStatus): Promise<WatchlistItem[]> {
    return db
        .select()
        .from(watchlistItems)
        .where(and(eq(watchlistItems.userId, userId), notDeleted, status ? eq(watchlistItems.status, status) : undefined))
        .orderBy(desc(watchlistItems.updatedAt));
}

export type PaginatedWatchlist = {
    data: WatchlistItem[];
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
};

export async function getUserWatchlistPaginated(
    userId: number,
    status?: WatchlistStatus,
    page = 1,
    perPage = 20,
): Promise<PaginatedWatchlist> {
    const where = and(eq(watchlistItems.userId, userId), notDeleted, status ? eq(watchlistItems.status, status) : undefined);

    const [data, [totals]] = await Promise.all([
        db.select().from(watchlistItems).where(where).orderBy(desc(watchlistItems.updatedAt)).limit(perPage).offset((page - 1) * perPage),
        db.select({ value: count() }).from(watchlistItems).where(where),
    ]);

    const total = totals?.value ?? 0;

    return { data, total, page, perPage, lastPage: Math.max(1, Math.ceil(total / perPage)) };
}

export type WatchlistStats = {
    total: number;
    by_status: Record<WatchlistStatus, number>;
    by_media_type: { movie: number; tv: number };
};

export async function getUserStats(userId: number): Promise<WatchlistStats> {
    const rows = await db
        .select({ mediaType: watchlistItems.mediaType, status: watchlistItems.status, value: count() })
        .from(watchlistItems)
        .where(and(eq(watchlistItems.userId, userId), notDeleted))
        .groupBy(watchlistItems.mediaType, watchlistItems.status);

    const byStatus: Record<WatchlistStatus, number> = { plan_to_watch: 0, watching: 0, completed: 0, dropped: 0, on_hold: 0 };
    const byMediaType = { movie: 0, tv: 0 };
    let total = 0;

    for (const row of rows) {
        total += row.value;
        byStatus[row.status] += row.value;
        byMediaType[row.mediaType] += row.value;
    }

    return { total, by_status: byStatus, by_media_type: byMediaType };
}

export async function findByUserAndTmdbIds(userId: number, mediaType: WatchlistMediaType, tmdbIds: number[]): Promise<WatchlistItem[]> {
    if (tmdbIds.length === 0) {
        return [];
    }

    return db
        .select()
        .from(watchlistItems)
        .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.mediaType, mediaType), inArray(watchlistItems.tmdbId, tmdbIds), notDeleted));
}

export type WatchlistStatusEntry = {
    status: WatchlistStatus;
    status_label: string;
    status_color: string;
    is_completed: boolean;
};

export async function getStatusMap(
    userId: number,
    mediaType: WatchlistMediaType,
    tmdbIds: number[],
): Promise<Record<number, WatchlistStatusEntry>> {
    const items = await findByUserAndTmdbIds(userId, mediaType, tmdbIds);

    return Object.fromEntries(
        items.map((item) => [
            item.tmdbId,
            {
                status: item.status,
                status_label: watchlistStatusLabel(item.status),
                status_color: watchlistStatusColor(item.status),
                is_completed: item.status === 'completed',
            },
        ]),
    );
}

export async function addToWatchlist(
    userId: number,
    tmdbId: number,
    mediaType: WatchlistMediaType,
    status: WatchlistStatus = 'plan_to_watch',
): Promise<WatchlistItem> {
    const [existing] = await db
        .select()
        .from(watchlistItems)
        .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.tmdbId, tmdbId), eq(watchlistItems.mediaType, mediaType)))
        .limit(1);

    const now = new Date();

    if (existing) {
        await db.update(watchlistItems).set({ status, deletedAt: null, updatedAt: now }).where(eq(watchlistItems.id, existing.id));

        await db.insert(userActivities).values({
            userId,
            activityType: 'updated_status',
            tmdbId,
            mediaType,
            metadata: { status },
            createdAt: now,
        });

        await clearStatsCache(userId);

        return (await findByUserAndTmdb(userId, tmdbId, mediaType)) ?? existing;
    }

    const metadata = await fetchMetadataSafely(tmdbId, mediaType, false);

    const [inserted] = await db.insert(watchlistItems).values({
        userId,
        tmdbId,
        mediaType,
        status,
        title: metadata?.title ?? null,
        posterPath: metadata?.poster_path ?? null,
        releaseDate: metadata?.release_date ?? null,
        voteAverage: metadata?.vote_average ?? null,
        totalSeasons: metadata?.total_seasons ?? null,
        createdAt: now,
        updatedAt: now,
    });

    await db.insert(userActivities).values({
        userId,
        activityType: 'added_to_watchlist',
        tmdbId,
        mediaType,
        metadata: { status },
        createdAt: now,
    });

    await grantXp(userId, 'add_to_watchlist');
    await checkAndGrantAchievements(userId, 'add_to_watchlist');
    await recordDailyStreak(userId);

    if (status === 'completed') {
        const action = mediaType === 'movie' ? 'complete_movie' : 'complete_tv_show';
        await grantXp(userId, action);
        await checkAndGrantAchievements(userId, action);
    }

    await clearStatsCache(userId);

    const [item] = await db.select().from(watchlistItems).where(eq(watchlistItems.id, inserted.insertId)).limit(1);

    if (!item) {
        throw new Error('Failed to load the watchlist item that was just created');
    }

    return item;
}

export async function updateStatus(item: WatchlistItem, status: WatchlistStatus): Promise<WatchlistItem> {
    const now = new Date();
    const updates: Partial<typeof watchlistItems.$inferInsert> = { status, updatedAt: now };

    if (status === 'watching' && !item.startedAt) {
        updates.startedAt = now;

        await db.insert(userActivities).values({
            userId: item.userId,
            activityType: 'started_watching',
            tmdbId: item.tmdbId,
            mediaType: item.mediaType,
            createdAt: now,
        });

        await grantXp(item.userId, 'start_watching');
    }

    if (status === 'completed' && !item.completedAt) {
        updates.completedAt = now;

        await db.insert(userActivities).values({
            userId: item.userId,
            activityType: 'completed',
            tmdbId: item.tmdbId,
            mediaType: item.mediaType,
            createdAt: now,
        });

        const action = item.mediaType === 'movie' ? 'complete_movie' : 'complete_tv_show';
        await grantXp(item.userId, action);
        await checkAndGrantAchievements(item.userId, action);
        await recordDailyStreak(item.userId);
    }

    await db.update(watchlistItems).set(updates).where(eq(watchlistItems.id, item.id));
    await clearStatsCache(item.userId);

    const [fresh] = await db.select().from(watchlistItems).where(eq(watchlistItems.id, item.id)).limit(1);

    return fresh ?? { ...item, ...updates };
}

export async function removeFromWatchlist(item: WatchlistItem): Promise<void> {
    await db.update(watchlistItems).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(watchlistItems.id, item.id));

    await clearStatsCache(item.userId);
}

export async function updateNotes(item: WatchlistItem, notes: string | null): Promise<void> {
    await db.update(watchlistItems).set({ notes, updatedAt: new Date() }).where(eq(watchlistItems.id, item.id));

    await clearStatsCache(item.userId);
}

export async function getTotalWatchedEpisodeCount(userId: number): Promise<number> {
    const [row] = await db.select({ value: count() }).from(watchedEpisodes).where(eq(watchedEpisodes.userId, userId));

    return row?.value ?? 0;
}
