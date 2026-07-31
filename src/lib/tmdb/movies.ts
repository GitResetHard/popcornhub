import { hashFilters, remember, TTL } from '@/lib/cache';
import { APPEND, appendToResponse, tmdbRequest } from './client';
import type { Credits, DiscoverFilters, Images, KeywordResults, Movie, MovieSummary, PaginatedResponse, ReviewResults } from './types';

/** TMDB movie data, cached to stay inside rate limits. */

export function getMovie(tmdbId: number, withDetails = true): Promise<Movie> {
    return remember(`tmdb.movie.${tmdbId}${withDetails ? '.detailed' : ''}`, TTL.hours(24), () =>
        tmdbRequest<Movie>(`movie/${tmdbId}`, {
            append_to_response: withDetails
                ? appendToResponse(APPEND.credits, APPEND.videos, APPEND.similar, APPEND.watchProviders, APPEND.recommendations)
                : undefined,
        }),
    );
}

export function getReviews(tmdbId: number): Promise<ReviewResults> {
    return remember(`tmdb.movie.${tmdbId}.reviews`, TTL.hours(24), () =>
        tmdbRequest<ReviewResults>(`movie/${tmdbId}/reviews`),
    );
}

export function getPopular(page = 1): Promise<PaginatedResponse<MovieSummary>> {
    return remember(`tmdb.movies.popular.page.${page}`, TTL.hours(6), () =>
        tmdbRequest<PaginatedResponse<MovieSummary>>('movie/popular', { page }),
    );
}

export function getTopRated(page = 1): Promise<PaginatedResponse<MovieSummary>> {
    return remember(`tmdb.movies.top_rated.page.${page}`, TTL.hours(12), () =>
        tmdbRequest<PaginatedResponse<MovieSummary>>('movie/top_rated', { page }),
    );
}

export function getNowPlaying(page = 1): Promise<PaginatedResponse<MovieSummary>> {
    return remember(`tmdb.movies.now_playing.page.${page}`, TTL.hours(6), () =>
        tmdbRequest<PaginatedResponse<MovieSummary>>('movie/now_playing', { page }),
    );
}

export function getUpcoming(page = 1): Promise<PaginatedResponse<MovieSummary>> {
    return remember(`tmdb.movies.upcoming.page.${page}`, TTL.hours(12), () =>
        tmdbRequest<PaginatedResponse<MovieSummary>>('movie/upcoming', { page }),
    );
}

export async function discover(filters: DiscoverFilters = {}, page = 1): Promise<PaginatedResponse<MovieSummary>> {
    const cacheKey = `tmdb.movies.discover.${await hashFilters(filters)}.page.${page}`;

    return remember(cacheKey, TTL.hours(1), () =>
        tmdbRequest<PaginatedResponse<MovieSummary>>('discover/movie', { ...filters, page }),
    );
}

export function getSimilar(movieId: number, page = 1): Promise<PaginatedResponse<MovieSummary>> {
    return remember(`tmdb.movie.${movieId}.similar.page.${page}`, TTL.days(7), () =>
        tmdbRequest<PaginatedResponse<MovieSummary>>(`movie/${movieId}/similar`, { page }),
    );
}

export function getRecommendations(movieId: number, page = 1): Promise<PaginatedResponse<MovieSummary>> {
    return remember(`tmdb.movie.${movieId}.recommendations.page.${page}`, TTL.days(7), () =>
        tmdbRequest<PaginatedResponse<MovieSummary>>(`movie/${movieId}/recommendations`, { page }),
    );
}

export function getCredits(movieId: number): Promise<Credits> {
    return remember(`tmdb.movie.${movieId}.credits`, TTL.hours(24), () => tmdbRequest<Credits>(`movie/${movieId}/credits`));
}

export function getImages(movieId: number, language = 'en'): Promise<Images> {
    return remember(`tmdb.movie.${movieId}.images`, TTL.days(30), () =>
        tmdbRequest<Images>(`movie/${movieId}/images`, { language }),
    );
}

export function getKeywords(movieId: number): Promise<KeywordResults> {
    return remember(`tmdb.movie.${movieId}.keywords`, TTL.days(30), () =>
        tmdbRequest<KeywordResults>(`movie/${movieId}/keywords`),
    );
}

export type MovieCategory = 'popular' | 'top_rated' | 'now_playing' | 'upcoming';

export function getByCategory(category: MovieCategory, page = 1): Promise<PaginatedResponse<MovieSummary>> {
    switch (category) {
        case 'top_rated':
            return getTopRated(page);
        case 'now_playing':
            return getNowPlaying(page);
        case 'upcoming':
            return getUpcoming(page);
        default:
            return getPopular(page);
    }
}
