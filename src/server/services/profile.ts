import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { userActivities, users, watchlistItems } from '@/db/schema';
import { remember, TTL } from '@/lib/cache';
import { countUserFavorites } from './favorites';
import { getTotalWatchedEpisodeCount, getUserStats, getUserWatchlist } from './watchlist';

/** Profile statistics and timeline, including the 5-minute stats cache. */

export type ProfileStats = {
    total_items: number;
    completed: number;
    watching: number;
    plan_to_watch: number;
    on_hold: number;
    dropped: number;
    favorites: number;
    episodes_watched: number;
    hours_watched: number;
    completion_rate: number;
    movies_count: number;
    tv_count: number;
    member_since: string | null;
};

/** Approximates viewing time: 45 minutes per episode, 120 minutes per movie. */
async function calculateHoursWatched(userId: number, episodesWatched: number): Promise<number> {
    const completed = await getUserWatchlist(userId, 'completed');
    const moviesCompleted = completed.filter((item) => item.mediaType === 'movie').length;

    return Math.round((episodesWatched * 45 + moviesCompleted * 120) / 60);
}

export function getProfileStats(userId: number): Promise<ProfileStats> {
    return remember(`user.${userId}.profile_stats`, TTL.minutes(5), async () => {
        const [user] = await db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, userId)).limit(1);

        if (!user) {
            throw new Error(`User ${userId} not found`);
        }

        const [watchlistStats, episodesWatched, favoritesCount] = await Promise.all([
            getUserStats(userId),
            getTotalWatchedEpisodeCount(userId),
            countUserFavorites(userId),
        ]);

        const hoursWatched = await calculateHoursWatched(userId, episodesWatched);
        const completed = watchlistStats.by_status.completed;
        const total = watchlistStats.total;

        return {
            total_items: total,
            completed,
            watching: watchlistStats.by_status.watching,
            plan_to_watch: watchlistStats.by_status.plan_to_watch,
            on_hold: watchlistStats.by_status.on_hold,
            dropped: watchlistStats.by_status.dropped,
            favorites: favoritesCount,
            episodes_watched: episodesWatched,
            hours_watched: hoursWatched,
            completion_rate: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
            movies_count: watchlistStats.by_media_type.movie,
            tv_count: watchlistStats.by_media_type.tv,
            member_since: user.createdAt ? user.createdAt.toISOString() : null,
        };
    });
}

export type RecentActivity = {
    id: number;
    type: string;
    tmdb_id: number;
    media_type: string;
    metadata: Record<string, unknown>;
    created_at: string;
};

/** Recent activity; titles missing from metadata are filled from the watchlist in one query. */
export async function getRecentActivity(userId: number, limit = 20): Promise<RecentActivity[]> {
    const activities = await db
        .select()
        .from(userActivities)
        .where(eq(userActivities.userId, userId))
        .orderBy(desc(userActivities.createdAt))
        .limit(limit);

    const missingTitles = activities.filter((activity) => !activity.metadata?.title && activity.tmdbId);
    const titleMap = new Map<string, string>();

    if (missingTitles.length > 0) {
        const items = await db
            .select({ tmdbId: watchlistItems.tmdbId, mediaType: watchlistItems.mediaType, title: watchlistItems.title })
            .from(watchlistItems)
            .where(eq(watchlistItems.userId, userId));

        for (const item of items) {
            if (item.title) {
                titleMap.set(`${item.tmdbId}_${item.mediaType}`, item.title);
            }
        }
    }

    return activities.map((activity) => {
        const metadata = { ...(activity.metadata ?? {}) };

        if (!metadata.title) {
            const title = titleMap.get(`${activity.tmdbId}_${activity.mediaType}`);

            if (title) {
                metadata.title = title;
            }
        }

        return {
            id: activity.id,
            type: activity.activityType,
            tmdb_id: activity.tmdbId,
            media_type: activity.mediaType,
            metadata,
            created_at: activity.createdAt.toISOString(),
        };
    });
}

export type ContinueWatchingItem = {
    type: 'movie' | 'tv';
    tmdb_id: number;
    title: string | null;
    poster_path: string | null;
};

export async function getContinueWatching(userId: number): Promise<ContinueWatchingItem[]> {
    const watching = await getUserWatchlist(userId, 'watching');

    return watching.map((item) => ({ type: item.mediaType, tmdb_id: item.tmdbId, title: item.title, poster_path: item.posterPath }));
}
