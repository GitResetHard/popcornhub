import { z } from 'zod';
import type { DiscoverFilters } from '@/lib/tmdb';

/**
 * Query-string parsing for the browse pages. Invalid values are dropped rather than rejected,
 * so a hand-edited URL degrades to the default listing instead of erroring.
 */

export const MOVIE_SORTS = ['popularity.desc', 'vote_average.desc', 'primary_release_date.desc', 'revenue.desc'] as const;
export const TV_SORTS = ['popularity.desc', 'vote_average.desc', 'first_air_date.desc'] as const;
export const RATING_OPTIONS = [5, 6, 7, 8, 9] as const;

const baseSchema = {
    genre: z.coerce.number().int().positive().optional().catch(undefined),
    year: z.coerce.number().int().min(1900).max(2030).optional().catch(undefined),
    rating: z.coerce
        .number()
        .refine((value) => (RATING_OPTIONS as readonly number[]).includes(value))
        .optional()
        .catch(undefined),
    page: z.coerce.number().int().min(1).max(1000).default(1).catch(1),
};

export const movieBrowseSchema = z.object({
    ...baseSchema,
    category: z.enum(['popular', 'top_rated', 'now_playing', 'upcoming']).default('popular').catch('popular'),
    sort: z.enum(MOVIE_SORTS).optional().catch(undefined),
});

export const tvBrowseSchema = z.object({
    ...baseSchema,
    category: z.enum(['popular', 'top_rated', 'airing_today', 'on_the_air']).default('popular').catch('popular'),
    sort: z.enum(TV_SORTS).optional().catch(undefined),
});

export type MovieBrowseParams = z.infer<typeof movieBrowseSchema>;
export type TvBrowseParams = z.infer<typeof tvBrowseSchema>;
export type BrowseParams = MovieBrowseParams | TvBrowseParams;

export function hasActiveFilters(params: BrowseParams): boolean {
    return Boolean(params.genre || params.year || params.sort || params.rating);
}

/** Builds the `/discover` filter set, including the vote-count floors that keep obscure titles out. */
export function toDiscoverFilters(params: BrowseParams, dateField: 'primary_release_year' | 'first_air_date_year'): DiscoverFilters {
    const sort = params.sort ?? 'popularity.desc';
    const filters: DiscoverFilters = { sort_by: sort };

    if (params.genre) {
        filters.with_genres = String(params.genre);
    }

    if (params.year) {
        filters[dateField] = params.year;
    }

    if (params.rating) {
        filters['vote_average.gte'] = params.rating;
        filters['vote_count.gte'] = 50;
    }

    if (sort === 'vote_average.desc') {
        filters['vote_count.gte'] = 200;
    }

    return filters;
}

export function buildBrowseQuery(params: Partial<BrowseParams> & { category?: string }): string {
    const query = new URLSearchParams();

    if (params.category && params.category !== 'popular') {
        query.set('category', params.category);
    }

    if (params.genre) {
        query.set('genre', String(params.genre));
    }

    if (params.year) {
        query.set('year', String(params.year));
    }

    if (params.sort) {
        query.set('sort', params.sort);
    }

    if (params.rating) {
        query.set('rating', String(params.rating));
    }

    if (params.page && params.page > 1) {
        query.set('page', String(params.page));
    }

    const serialized = query.toString();

    return serialized ? `?${serialized}` : '';
}
