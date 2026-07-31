import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { favorites, watchlistItems, type Favorite } from '@/db/schema';
/** Favorites only ever hold these three kinds. */
export type FavoriteMediaType = 'movie' | 'tv' | 'person';
import { grantXp, recordDailyStreak } from './gamification';
import { fetchMetadataSafely } from './tmdb-enricher';
import { clearStatsCache } from './watchlist';

/** Favorites. Adding grants XP and records the daily streak; removing does not revoke it. */

export async function findByUserAndTmdb(userId: number, tmdbId: number, mediaType: FavoriteMediaType): Promise<Favorite | null> {
    const [row] = await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.tmdbId, tmdbId), eq(favorites.mediaType, mediaType)))
        .limit(1);

    return row ?? null;
}

export async function getUserFavorites(userId: number, mediaType?: FavoriteMediaType): Promise<Favorite[]> {
    return db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, userId), mediaType ? eq(favorites.mediaType, mediaType) : undefined))
        .orderBy(desc(favorites.createdAt));
}

export async function countUserFavorites(userId: number): Promise<number> {
    const [row] = await db.select({ value: count() }).from(favorites).where(eq(favorites.userId, userId));

    return row?.value ?? 0;
}

export async function getFavoriteIdSet(userId: number, mediaType: FavoriteMediaType, tmdbIds: number[]): Promise<Set<number>> {
    if (tmdbIds.length === 0) {
        return new Set();
    }

    const rows = await db
        .select({ tmdbId: favorites.tmdbId })
        .from(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.mediaType, mediaType), inArray(favorites.tmdbId, tmdbIds)));

    return new Set(rows.map((row) => row.tmdbId));
}

async function findWatchlistMetadata(userId: number, tmdbId: number, mediaType: FavoriteMediaType) {
    if (mediaType !== 'movie' && mediaType !== 'tv') {
        return null;
    }

    const [row] = await db
        .select({
            title: watchlistItems.title,
            posterPath: watchlistItems.posterPath,
            releaseDate: watchlistItems.releaseDate,
            voteAverage: watchlistItems.voteAverage,
            overview: watchlistItems.overview,
        })
        .from(watchlistItems)
        .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.tmdbId, tmdbId), eq(watchlistItems.mediaType, mediaType)))
        .limit(1);

    return row ?? null;
}

export type ToggleFavoriteResult = { favorited: boolean };

export async function toggleFavorite(userId: number, tmdbId: number, mediaType: FavoriteMediaType): Promise<ToggleFavoriteResult> {
    const existing = await findByUserAndTmdb(userId, tmdbId, mediaType);

    if (existing) {
        await db.delete(favorites).where(eq(favorites.id, existing.id));
        await clearStatsCache(userId);

        return { favorited: false };
    }

    const metadata = mediaType === 'movie' || mediaType === 'tv' ? await fetchMetadataSafely(tmdbId, mediaType, true) : null;

    // Without metadata the row would render as a bare tmdb id, so fall back to the copy the
    // user's own watchlist already holds for this title.
    const fallback = metadata ? null : await findWatchlistMetadata(userId, tmdbId, mediaType);
    const now = new Date();

    await db.insert(favorites).values({
        userId,
        tmdbId,
        mediaType,
        title: metadata?.title ?? fallback?.title ?? null,
        posterPath: metadata?.poster_path ?? fallback?.posterPath ?? null,
        releaseDate: metadata?.release_date ?? fallback?.releaseDate ?? null,
        voteAverage: metadata?.vote_average ?? fallback?.voteAverage ?? null,
        overview: metadata?.overview ?? fallback?.overview ?? null,
        createdAt: now,
        updatedAt: now,
    });

    await grantXp(userId, 'favorite_title');
    await recordDailyStreak(userId);
    await clearStatsCache(userId);

    return { favorited: true };
}
