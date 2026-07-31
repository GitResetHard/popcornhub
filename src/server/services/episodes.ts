import { and, count, eq } from 'drizzle-orm';
import { db } from '@/db';
import { watchedEpisodes } from '@/db/schema';
import { checkAndGrantAchievements, grantXp, recordDailyStreak } from './gamification';
import { clearStatsCache } from './watchlist';

/** Episode tracking. */

export async function getWatchedEpisodeCountsBySeason(userId: number, tmdbId: number): Promise<Map<number, number>> {
    const rows = await db
        .select({ seasonNumber: watchedEpisodes.seasonNumber, value: count() })
        .from(watchedEpisodes)
        .where(and(eq(watchedEpisodes.userId, userId), eq(watchedEpisodes.tmdbId, tmdbId)))
        .groupBy(watchedEpisodes.seasonNumber);

    return new Map(rows.map((row) => [row.seasonNumber, row.value]));
}

export async function getWatchedEpisodeNumbers(userId: number, tmdbId: number, seasonNumber: number): Promise<Set<number>> {
    const rows = await db
        .select({ episodeNumber: watchedEpisodes.episodeNumber })
        .from(watchedEpisodes)
        .where(
            and(
                eq(watchedEpisodes.userId, userId),
                eq(watchedEpisodes.tmdbId, tmdbId),
                eq(watchedEpisodes.seasonNumber, seasonNumber),
            ),
        );

    return new Set(rows.map((row) => row.episodeNumber));
}

export async function isEpisodeWatched(userId: number, tmdbId: number, seasonNumber: number, episodeNumber: number): Promise<boolean> {
    const [row] = await db
        .select({ id: watchedEpisodes.id })
        .from(watchedEpisodes)
        .where(
            and(
                eq(watchedEpisodes.userId, userId),
                eq(watchedEpisodes.tmdbId, tmdbId),
                eq(watchedEpisodes.seasonNumber, seasonNumber),
                eq(watchedEpisodes.episodeNumber, episodeNumber),
            ),
        )
        .limit(1);

    return Boolean(row);
}

export async function toggleEpisode(
    userId: number,
    tmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
): Promise<{ watched: boolean }> {
    const alreadyWatched = await isEpisodeWatched(userId, tmdbId, seasonNumber, episodeNumber);

    if (alreadyWatched) {
        await db
            .delete(watchedEpisodes)
            .where(
                and(
                    eq(watchedEpisodes.userId, userId),
                    eq(watchedEpisodes.tmdbId, tmdbId),
                    eq(watchedEpisodes.seasonNumber, seasonNumber),
                    eq(watchedEpisodes.episodeNumber, episodeNumber),
                ),
            );

        await clearStatsCache(userId);

        return { watched: false };
    }

    const now = new Date();

    await db.insert(watchedEpisodes).values({
        userId,
        tmdbId,
        seasonNumber,
        episodeNumber,
        watchedAt: now,
        createdAt: now,
    });

    await grantXp(userId, 'watch_episode');
    await recordDailyStreak(userId);
    await clearStatsCache(userId);

    return { watched: true };
}

/** Marks a whole season watched, or clears it when already complete. */
export async function toggleSeason(
    userId: number,
    tmdbId: number,
    seasonNumber: number,
    episodeNumbers: number[],
): Promise<{ watched: boolean }> {
    const watched = await getWatchedEpisodeNumbers(userId, tmdbId, seasonNumber);
    const isComplete = episodeNumbers.length > 0 && episodeNumbers.every((episode) => watched.has(episode));

    if (isComplete) {
        await db
            .delete(watchedEpisodes)
            .where(
                and(
                    eq(watchedEpisodes.userId, userId),
                    eq(watchedEpisodes.tmdbId, tmdbId),
                    eq(watchedEpisodes.seasonNumber, seasonNumber),
                ),
            );

        await clearStatsCache(userId);

        return { watched: false };
    }

    const missing = episodeNumbers.filter((episode) => !watched.has(episode));

    if (missing.length > 0) {
        const now = new Date();

        await db.insert(watchedEpisodes).values(
            missing.map((episodeNumber) => ({
                userId,
                tmdbId,
                seasonNumber,
                episodeNumber,
                watchedAt: now,
                createdAt: now,
            })),
        );

        await grantXp(userId, 'watch_season');
        await checkAndGrantAchievements(userId, 'watch_season');
        await recordDailyStreak(userId);
    }

    await clearStatsCache(userId);

    return { watched: true };
}
