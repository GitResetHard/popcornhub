import { hashFilters, remember, TTL } from '@/lib/cache';
import { APPEND, appendToResponse, tmdbRequest } from './client';
import type {
    AggregateCredits,
    DiscoverFilters,
    Episode,
    ExternalIds,
    Images,
    KeywordResults,
    PaginatedResponse,
    SeasonDetail,
    TvShow,
    TvShowSummary,
} from './types';

/** TMDB TV data, cached to stay inside rate limits. */

export function getTvShow(tmdbId: number, withDetails = true): Promise<TvShow> {
    return remember(`tmdb.tv.${tmdbId}${withDetails ? '.detailed' : ''}`, TTL.hours(24), () =>
        tmdbRequest<TvShow>(`tv/${tmdbId}`, {
            append_to_response: withDetails
                ? appendToResponse(APPEND.credits, APPEND.videos, APPEND.similar, APPEND.watchProviders, APPEND.recommendations)
                : undefined,
        }),
    );
}

export function getSeason(tvId: number, seasonNumber: number): Promise<SeasonDetail> {
    return remember(`tmdb.tv.${tvId}.season.${seasonNumber}`, TTL.days(7), () =>
        tmdbRequest<SeasonDetail>(`tv/${tvId}/season/${seasonNumber}`),
    );
}

export function getEpisode(tvId: number, seasonNumber: number, episodeNumber: number): Promise<Episode> {
    return remember(`tmdb.tv.${tvId}.season.${seasonNumber}.episode.${episodeNumber}`, TTL.days(7), () =>
        tmdbRequest<Episode>(`tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`, {
            append_to_response: appendToResponse(APPEND.credits, APPEND.images),
        }),
    );
}

export function getPopular(page = 1): Promise<PaginatedResponse<TvShowSummary>> {
    return remember(`tmdb.tv.popular.page.${page}`, TTL.hours(6), () =>
        tmdbRequest<PaginatedResponse<TvShowSummary>>('tv/popular', { page }),
    );
}

export function getTopRated(page = 1): Promise<PaginatedResponse<TvShowSummary>> {
    return remember(`tmdb.tv.top_rated.page.${page}`, TTL.hours(12), () =>
        tmdbRequest<PaginatedResponse<TvShowSummary>>('tv/top_rated', { page }),
    );
}

export function getAiringToday(page = 1): Promise<PaginatedResponse<TvShowSummary>> {
    return remember(`tmdb.tv.airing_today.page.${page}`, TTL.hours(6), () =>
        tmdbRequest<PaginatedResponse<TvShowSummary>>('tv/airing_today', { page }),
    );
}

export function getOnTheAir(page = 1): Promise<PaginatedResponse<TvShowSummary>> {
    return remember(`tmdb.tv.on_the_air.page.${page}`, TTL.hours(6), () =>
        tmdbRequest<PaginatedResponse<TvShowSummary>>('tv/on_the_air', { page }),
    );
}

export async function discover(filters: DiscoverFilters = {}, page = 1): Promise<PaginatedResponse<TvShowSummary>> {
    const cacheKey = `tmdb.tv.discover.${await hashFilters(filters)}.page.${page}`;

    return remember(cacheKey, TTL.hours(1), () =>
        tmdbRequest<PaginatedResponse<TvShowSummary>>('discover/tv', { ...filters, page }),
    );
}

export function getSimilar(tvShowId: number, page = 1): Promise<PaginatedResponse<TvShowSummary>> {
    return remember(`tmdb.tv.${tvShowId}.similar.page.${page}`, TTL.days(7), () =>
        tmdbRequest<PaginatedResponse<TvShowSummary>>(`tv/${tvShowId}/similar`, { page }),
    );
}

export function getRecommendations(tvShowId: number, page = 1): Promise<PaginatedResponse<TvShowSummary>> {
    return remember(`tmdb.tv.${tvShowId}.recommendations.page.${page}`, TTL.days(7), () =>
        tmdbRequest<PaginatedResponse<TvShowSummary>>(`tv/${tvShowId}/recommendations`, { page }),
    );
}

export function getAggregateCredits(tvShowId: number): Promise<AggregateCredits> {
    return remember(`tmdb.tv.${tvShowId}.aggregate_credits`, TTL.hours(24), () =>
        tmdbRequest<AggregateCredits>(`tv/${tvShowId}/aggregate_credits`),
    );
}

export function getImages(tvShowId: number): Promise<Images> {
    return remember(`tmdb.tv.${tvShowId}.images`, TTL.days(30), () => tmdbRequest<Images>(`tv/${tvShowId}/images`));
}

export function getKeywords(tvShowId: number): Promise<KeywordResults> {
    return remember(`tmdb.tv.${tvShowId}.keywords`, TTL.days(30), () => tmdbRequest<KeywordResults>(`tv/${tvShowId}/keywords`));
}

export function getExternalIds(tvShowId: number): Promise<ExternalIds> {
    return remember(`tmdb.tv.${tvShowId}.external_ids`, TTL.days(30), () =>
        tmdbRequest<ExternalIds>(`tv/${tvShowId}/external_ids`),
    );
}

export type TvCategory = 'popular' | 'top_rated' | 'airing_today' | 'on_the_air';

export function getByCategory(category: TvCategory, page = 1): Promise<PaginatedResponse<TvShowSummary>> {
    switch (category) {
        case 'top_rated':
            return getTopRated(page);
        case 'airing_today':
            return getAiringToday(page);
        case 'on_the_air':
            return getOnTheAir(page);
        default:
            return getPopular(page);
    }
}
