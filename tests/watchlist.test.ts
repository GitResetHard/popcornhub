import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getUserFavorites, toggleFavorite } from '@/server/services/favorites';
import { getLevelInfo, getStreakInfo } from '@/server/services/gamification';
import { getProfileStats, getRecentActivity } from '@/server/services/profile';
import {
    addToWatchlist,
    findByUserAndTmdb,
    getStatusMap,
    getUserStats,
    getUserWatchlist,
    getUserWatchlistPaginated,
    removeFromWatchlist,
    updateStatus,
} from '@/server/services/watchlist';
import {
    achievementUser,
    closeDatabase,
    createTestUser,
    db,
    resetDatabase,
    seedGamificationData,
    userActivities,
    userExperience,
    watchlistItems,
} from './helpers/db';

/**
 * Integration tests against a real MySQL database, since the behaviour under test is the
 * interaction between queries, soft deletes, and unique keys. TMDB is stubbed so the suite
 * makes no network calls; tests/tmdb.test.ts covers the enricher and the cache keys.
 */
vi.mock('@/server/services/tmdb-enricher', () => ({
    fetchMetadataSafely: vi.fn(async (tmdbId: number, mediaType: string) => ({
        title: mediaType === 'tv' ? `Show ${tmdbId}` : `Movie ${tmdbId}`,
        poster_path: `/poster-${tmdbId}.jpg`,
        release_date: '2001-02-03',
        vote_average: 8.4,
        overview: `Overview for ${tmdbId}`,
        total_seasons: mediaType === 'tv' ? 3 : null,
    })),
}));

let userId: number;

beforeAll(async () => {
    await resetDatabase();
    await seedGamificationData();
});

afterAll(async () => {
    await closeDatabase();
});

beforeEach(async () => {
    userId = await createTestUser();
});

describe('addToWatchlist', () => {
    it('creates an item with the requested status', async () => {
        const item = await addToWatchlist(userId, 550, 'movie');

        expect(item).toMatchObject({ userId, tmdbId: 550, mediaType: 'movie', status: 'plan_to_watch' });
    });

    it('caches TMDB metadata on the row', async () => {
        const movie = await addToWatchlist(userId, 550, 'movie');

        expect(movie).toMatchObject({
            title: 'Movie 550',
            posterPath: '/poster-550.jpg',
            releaseDate: '2001-02-03',
            voteAverage: 8.4,
            totalSeasons: null,
        });

        expect(await addToWatchlist(userId, 1399, 'tv')).toMatchObject({ title: 'Show 1399', totalSeasons: 3 });
    });

    it('records an activity row', async () => {
        await addToWatchlist(userId, 550, 'movie');

        const activities = await db.select().from(userActivities).where(eq(userActivities.userId, userId));

        expect(activities).toHaveLength(1);
        expect(activities[0]).toMatchObject({
            activityType: 'added_to_watchlist',
            tmdbId: 550,
            mediaType: 'movie',
            metadata: { status: 'plan_to_watch' },
        });
    });

    it('grants XP for the add', async () => {
        await addToWatchlist(userId, 550, 'movie');

        const [experience] = await db.select().from(userExperience).where(eq(userExperience.userId, userId));

        expect(experience?.experiencePoints).toBe(2);
    });

    it('awards both watchlist achievements on the first add', async () => {
        await addToWatchlist(userId, 550, 'movie');

        const rows = await db.select().from(achievementUser).where(eq(achievementUser.userId, userId));
        const progress = rows.map((row) => row.progress).sort((a, b) => (a ?? 0) - (b ?? 0));

        expect(progress).toEqual([1, 100]);
    });

    it('starts the daily engagement streak', async () => {
        await addToWatchlist(userId, 550, 'movie');

        expect(await getStreakInfo(userId)).toEqual({ current: 1, active_today: true });
    });

    it('updates the status instead of duplicating when the title is already tracked', async () => {
        await addToWatchlist(userId, 550, 'movie');
        const updated = await addToWatchlist(userId, 550, 'movie', 'watching');

        const items = await db
            .select()
            .from(watchlistItems)
            .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.tmdbId, 550)));

        expect(items).toHaveLength(1);
        expect(updated.status).toBe('watching');
    });

    it('restores a previously removed item rather than failing the unique key', async () => {
        const item = await addToWatchlist(userId, 550, 'movie');
        await removeFromWatchlist(item);

        expect(await findByUserAndTmdb(userId, 550, 'movie')).toBeNull();

        const restored = await addToWatchlist(userId, 550, 'movie', 'completed');

        expect(restored.deletedAt).toBeNull();
        expect(restored.status).toBe('completed');
        expect(await getUserWatchlist(userId)).toHaveLength(1);
    });

    it('tracks the same tmdb id separately for a movie and a show', async () => {
        await addToWatchlist(userId, 1399, 'movie');
        await addToWatchlist(userId, 1399, 'tv');

        expect(await getUserWatchlist(userId)).toHaveLength(2);
    });

    it('awards completion XP when a title is added as already completed', async () => {
        await addToWatchlist(userId, 550, 'movie', 'completed');

        const [experience] = await db.select().from(userExperience).where(eq(userExperience.userId, userId));

        expect(experience?.experiencePoints).toBe(12);
    });
});

describe('updateStatus', () => {
    it('stamps started_at and awards XP the first time an item is marked watching', async () => {
        const item = await addToWatchlist(userId, 550, 'movie');
        const updated = await updateStatus(item, 'watching');

        expect(updated.status).toBe('watching');
        expect(updated.startedAt).toBeInstanceOf(Date);

        const [experience] = await db.select().from(userExperience).where(eq(userExperience.userId, userId));

        expect(experience?.experiencePoints).toBe(5);
    });

    it('does not award XP twice for the same transition', async () => {
        const item = await addToWatchlist(userId, 550, 'movie');
        const watching = await updateStatus(item, 'watching');
        await updateStatus(watching, 'watching');

        const [experience] = await db.select().from(userExperience).where(eq(userExperience.userId, userId));

        expect(experience?.experiencePoints).toBe(5);
    });

    it('awards the TV amount for shows and the movie amount for movies', async () => {
        const movie = await addToWatchlist(userId, 550, 'movie');
        await updateStatus(movie, 'completed');

        const otherUser = await createTestUser();
        const show = await addToWatchlist(otherUser, 1399, 'tv');
        await updateStatus(show, 'completed');

        const [movieExperience] = await db.select().from(userExperience).where(eq(userExperience.userId, userId));
        const [showExperience] = await db.select().from(userExperience).where(eq(userExperience.userId, otherUser));

        expect(movieExperience?.experiencePoints).toBe(12);
        expect(showExperience?.experiencePoints).toBe(17);
    });

    it('logs a completion activity', async () => {
        const item = await addToWatchlist(userId, 550, 'movie');
        await updateStatus(item, 'completed');

        const activities = await db.select().from(userActivities).where(eq(userActivities.userId, userId));

        expect(activities.map((activity) => activity.activityType)).toEqual(['added_to_watchlist', 'completed']);
    });
});

describe('getUserStats', () => {
    it('counts items by status and media type in one pass', async () => {
        const first = await addToWatchlist(userId, 550, 'movie');
        await updateStatus(first, 'completed');
        await addToWatchlist(userId, 551, 'movie');
        const show = await addToWatchlist(userId, 1399, 'tv');
        await updateStatus(show, 'watching');

        expect(await getUserStats(userId)).toEqual({
            total: 3,
            by_status: { plan_to_watch: 1, watching: 1, completed: 1, dropped: 0, on_hold: 0 },
            by_media_type: { movie: 2, tv: 1 },
        });
    });

    it('excludes soft-deleted items', async () => {
        const item = await addToWatchlist(userId, 550, 'movie');
        await removeFromWatchlist(item);

        expect(await getUserStats(userId)).toMatchObject({ total: 0 });
    });
});

describe('getStatusMap', () => {
    it('returns display metadata keyed by tmdb id', async () => {
        const item = await addToWatchlist(userId, 550, 'movie');
        await updateStatus(item, 'completed');
        await addToWatchlist(userId, 551, 'movie');

        const map = await getStatusMap(userId, 'movie', [550, 551, 999]);

        expect(map[550]).toEqual({
            status: 'completed',
            status_label: 'Completed',
            status_color: 'purple',
            is_completed: true,
        });
        expect(map[551]?.is_completed).toBe(false);
        expect(map[999]).toBeUndefined();
    });

    it('avoids querying when there are no ids', async () => {
        expect(await getStatusMap(userId, 'movie', [])).toEqual({});
    });
});

describe('getUserWatchlistPaginated', () => {
    it('pages results and reports the total', async () => {
        for (const tmdbId of [1, 2, 3, 4, 5]) {
            await addToWatchlist(userId, tmdbId, 'movie');
        }

        const firstPage = await getUserWatchlistPaginated(userId, undefined, 1, 2);

        expect(firstPage.data).toHaveLength(2);
        expect(firstPage.total).toBe(5);
        expect(firstPage.lastPage).toBe(3);

        expect((await getUserWatchlistPaginated(userId, undefined, 3, 2)).data).toHaveLength(1);
    });

    it('filters by status', async () => {
        const item = await addToWatchlist(userId, 550, 'movie');
        await updateStatus(item, 'watching');
        await addToWatchlist(userId, 551, 'movie');

        const watching = await getUserWatchlistPaginated(userId, 'watching');

        expect(watching.total).toBe(1);
        expect(watching.data[0]?.tmdbId).toBe(550);
    });
});

describe('toggleFavorite', () => {
    it('adds then removes a favorite', async () => {
        expect(await toggleFavorite(userId, 550, 'movie')).toEqual({ favorited: true });
        expect(await toggleFavorite(userId, 550, 'movie')).toEqual({ favorited: false });
    });

    it('falls back to watchlist metadata when TMDB returns nothing', async () => {
        const enricher = await import('@/server/services/tmdb-enricher');
        await addToWatchlist(userId, 1399, 'tv');

        vi.mocked(enricher.fetchMetadataSafely).mockResolvedValueOnce(null);
        await toggleFavorite(userId, 1399, 'tv');

        const [favorite] = await getUserFavorites(userId, 'tv');

        expect(favorite).toMatchObject({ title: 'Show 1399', posterPath: '/poster-1399.jpg' });
    });

    it('leaves metadata empty when neither TMDB nor the watchlist can supply it', async () => {
        const enricher = await import('@/server/services/tmdb-enricher');

        vi.mocked(enricher.fetchMetadataSafely).mockResolvedValueOnce(null);
        await toggleFavorite(userId, 424242, 'movie');

        const [favorite] = await getUserFavorites(userId, 'movie');

        expect(favorite?.title).toBeNull();
    });

    it('grants XP only when adding', async () => {
        await toggleFavorite(userId, 550, 'movie');
        const [afterAdd] = await db.select().from(userExperience).where(eq(userExperience.userId, userId));

        await toggleFavorite(userId, 550, 'movie');
        const [afterRemove] = await db.select().from(userExperience).where(eq(userExperience.userId, userId));

        expect(afterAdd?.experiencePoints).toBe(1);
        expect(afterRemove?.experiencePoints).toBe(1);
    });
});

describe('getProfileStats', () => {
    it('summarises the watchlist and derives hours watched', async () => {
        const movie = await addToWatchlist(userId, 550, 'movie');
        await updateStatus(movie, 'completed');
        await addToWatchlist(userId, 551, 'movie');
        await toggleFavorite(userId, 552, 'movie');

        const stats = await getProfileStats(userId);

        expect(stats).toMatchObject({
            total_items: 2,
            completed: 1,
            plan_to_watch: 1,
            favorites: 1,
            movies_count: 2,
            tv_count: 0,
            episodes_watched: 0,
            completion_rate: 50,
        });
        expect(stats.hours_watched).toBe(2);
    });
});

describe('getRecentActivity', () => {
    it('backfills titles from the watchlist when metadata lacks them', async () => {
        await addToWatchlist(userId, 550, 'movie');
        await db.update(watchlistItems).set({ title: 'Fight Club' }).where(eq(watchlistItems.userId, userId));

        const activity = await getRecentActivity(userId);

        expect(activity).toHaveLength(1);
        expect(activity[0]?.metadata.title).toBe('Fight Club');
    });

    it('returns the newest activity first', async () => {
        await addToWatchlist(userId, 550, 'movie');
        const item = await addToWatchlist(userId, 551, 'movie');
        await updateStatus(item, 'completed');

        expect((await getRecentActivity(userId, 2))[0]?.type).toBe('completed');
    });
});

describe('getLevelInfo', () => {
    it('reports level one with no points for a fresh user', async () => {
        expect(await getLevelInfo(userId)).toMatchObject({ level: 1, points: 0 });
    });

    it('advances the level once enough points accumulate', async () => {
        for (let tmdbId = 1; tmdbId <= 30; tmdbId += 1) {
            await addToWatchlist(userId, tmdbId, 'movie', 'completed');
        }

        const info = await getLevelInfo(userId);

        expect(info.points).toBe(360);
        expect(info.level).toBeGreaterThan(1);
    });
});
