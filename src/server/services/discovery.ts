import { movies, tv } from '@/lib/tmdb';
import type { MovieSummary, TvShowSummary } from '@/lib/tmdb/types';
import { getUserWatchlist } from './watchlist';

/**
 * Personalised discovery derived from a user's watchlist. Everything degrades to popular
 * titles (or empty) when TMDB is unavailable, so these never throw into a page.
 */

async function safe<T>(request: Promise<{ results: T[] }>): Promise<T[]> {
    try {
        return (await request).results;
    } catch (error) {
        console.warn('[discovery] TMDB request failed', error);

        return [];
    }
}

function dedupeExclude<T extends { id: number; vote_count?: number; popularity?: number }>(items: T[], exclude: Set<number>): T[] {
    const seen = new Set<number>();
    const out: T[] = [];

    for (const item of items) {
        if (exclude.has(item.id) || seen.has(item.id)) {
            continue;
        }

        seen.add(item.id);
        out.push(item);
    }

    return out.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
}

export type Recommendations = {
    movies: MovieSummary[];
    shows: TvShowSummary[];
    personalised: boolean;
};

export async function getRecommendationsFor(userId: number): Promise<Recommendations> {
    const watchlist = await getUserWatchlist(userId);

    const movieSeeds = watchlist
        .filter((item) => item.mediaType === 'movie')
        .sort((a, b) => (b.status === 'completed' ? 1 : 0) - (a.status === 'completed' ? 1 : 0))
        .slice(0, 4)
        .map((item) => item.tmdbId);

    const tvSeeds = watchlist
        .filter((item) => item.mediaType === 'tv')
        .sort((a, b) => (b.status === 'completed' ? 1 : 0) - (a.status === 'completed' ? 1 : 0))
        .slice(0, 4)
        .map((item) => item.tmdbId);

    const excludeMovies = new Set(watchlist.filter((item) => item.mediaType === 'movie').map((item) => item.tmdbId));
    const excludeShows = new Set(watchlist.filter((item) => item.mediaType === 'tv').map((item) => item.tmdbId));

    const [movieBatches, tvBatches] = await Promise.all([
        Promise.all(movieSeeds.map((id) => safe(movies.getRecommendations(id)))),
        Promise.all(tvSeeds.map((id) => safe(tv.getRecommendations(id)))),
    ]);

    let recommendedMovies = dedupeExclude(movieBatches.flat(), excludeMovies);
    let recommendedShows = dedupeExclude(tvBatches.flat(), excludeShows);
    const personalised = recommendedMovies.length > 0 || recommendedShows.length > 0;

    if (recommendedMovies.length === 0) {
        recommendedMovies = dedupeExclude(await safe(movies.getPopular(1)), excludeMovies);
    }

    if (recommendedShows.length === 0) {
        recommendedShows = dedupeExclude(await safe(tv.getPopular(1)), excludeShows);
    }

    return { movies: recommendedMovies.slice(0, 18), shows: recommendedShows.slice(0, 18), personalised };
}

export type CalendarEntry = {
    key: string;
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath: string | null;
    date: string;
    label: string;
};

/** Upcoming episodes for tracked shows plus future releases of planned movies. */
export async function getUpcomingSchedule(userId: number): Promise<CalendarEntry[]> {
    const watchlist = await getUserWatchlist(userId);
    const today = new Date().toISOString().slice(0, 10);

    const trackedShows = watchlist
        .filter((item) => item.mediaType === 'tv' && (item.status === 'watching' || item.status === 'plan_to_watch'))
        .slice(0, 24);

    const episodeEntries = await Promise.all(
        trackedShows.map(async (item): Promise<CalendarEntry | null> => {
            try {
                const show = await tv.getTvShow(item.tmdbId, false);
                const next = show.next_episode_to_air;

                if (!next?.air_date || next.air_date < today) {
                    return null;
                }

                return {
                    key: `tv-${item.tmdbId}-${next.season_number}-${next.episode_number}`,
                    tmdbId: item.tmdbId,
                    mediaType: 'tv',
                    title: item.title ?? show.name,
                    posterPath: item.posterPath ?? show.poster_path,
                    date: next.air_date,
                    label: `S${next.season_number} E${next.episode_number}${next.name ? ` · ${next.name}` : ''}`,
                };
            } catch (error) {
                console.warn('[discovery] calendar lookup failed', { tmdbId: item.tmdbId, error });

                return null;
            }
        }),
    );

    const movieEntries: CalendarEntry[] = watchlist
        .filter((item) => item.mediaType === 'movie' && item.status === 'plan_to_watch' && item.releaseDate && item.releaseDate >= today)
        .map((item) => ({
            key: `movie-${item.tmdbId}`,
            tmdbId: item.tmdbId,
            mediaType: 'movie' as const,
            title: item.title ?? `#${item.tmdbId}`,
            posterPath: item.posterPath,
            date: item.releaseDate as string,
            label: 'Theatrical / digital release',
        }));

    return [...episodeEntries.filter((entry): entry is CalendarEntry => entry !== null), ...movieEntries].sort((a, b) =>
        a.date.localeCompare(b.date),
    );
}
