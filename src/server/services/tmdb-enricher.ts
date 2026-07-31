import { movies, tv } from '@/lib/tmdb';
import type { MediaType } from '@/lib/enums';

/**
 * Watchlist rows, favorites, and list items cache TMDB metadata locally so lists render
 * without hitting the API; this fills that data in when a row is created.
 */

export type MediaMetadata = {
    title: string | null;
    poster_path: string | null;
    release_date: string | null;
    vote_average: number | null;
    overview: string | null;
    total_seasons: number | null;
};

function extractReleaseDate(details: { release_date?: string; first_air_date?: string }): string | null {
    const raw = details.release_date ?? details.first_air_date ?? null;

    if (!raw) {
        return null;
    }

    return raw.length >= 10 ? raw.slice(0, 10) : null;
}

export async function fetchMetadata(tmdbId: number, mediaType: MediaType, withOverview = true): Promise<MediaMetadata> {
    if (mediaType === 'tv') {
        const show = await tv.getTvShow(tmdbId, false);

        return {
            title: show.name ?? null,
            poster_path: show.poster_path,
            release_date: extractReleaseDate(show),
            vote_average: show.vote_average ?? null,
            overview: withOverview ? (show.overview ?? null) : null,
            total_seasons: show.number_of_seasons ?? null,
        };
    }

    const movie = await movies.getMovie(tmdbId, false);

    return {
        title: movie.title ?? null,
        poster_path: movie.poster_path,
        release_date: extractReleaseDate(movie),
        vote_average: movie.vote_average ?? null,
        overview: withOverview ? (movie.overview ?? null) : null,
        total_seasons: null,
    };
}

/** A TMDB outage must not block a user from tracking a title, so failures resolve to null. */
export async function fetchMetadataSafely(
    tmdbId: number,
    mediaType: MediaType,
    withOverview = true,
): Promise<MediaMetadata | null> {
    try {
        return await fetchMetadata(tmdbId, mediaType, withOverview);
    } catch (error) {
        console.warn('[tmdb-enricher] failed to fetch metadata', { tmdbId, mediaType, error });

        return null;
    }
}
