import { md5, remember, TTL } from '@/lib/cache';
import { tmdbRequest } from './client';
import type { MovieSummary, PaginatedResponse, Person, SearchResult, TvShowSummary } from './types';

/** TMDB search; query strings are md5-hashed into cache keys. */

export function multiSearch(query: string, page = 1): Promise<PaginatedResponse<SearchResult>> {
    return remember(`tmdb.search.multi.${md5(query)}.page.${page}`, TTL.minutes(15), () =>
        tmdbRequest<PaginatedResponse<SearchResult>>('search/multi', { query, page }),
    );
}

export function searchMovies(query: string, page = 1): Promise<PaginatedResponse<MovieSummary>> {
    return remember(`tmdb.search.movies.${md5(query)}.page.${page}`, TTL.minutes(15), () =>
        tmdbRequest<PaginatedResponse<MovieSummary>>('search/movie', { query, page }),
    );
}

export function searchTvShows(query: string, page = 1): Promise<PaginatedResponse<TvShowSummary>> {
    return remember(`tmdb.search.tv.${md5(query)}.page.${page}`, TTL.minutes(15), () =>
        tmdbRequest<PaginatedResponse<TvShowSummary>>('search/tv', { query, page }),
    );
}

export function searchPeople(query: string, page = 1): Promise<PaginatedResponse<Person>> {
    return remember(`tmdb.search.people.${md5(query)}.page.${page}`, TTL.minutes(15), () =>
        tmdbRequest<PaginatedResponse<Person>>('search/person', { query, page }),
    );
}
