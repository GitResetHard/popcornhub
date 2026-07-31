import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheForget } from '@/lib/cache';
import { movies, tv } from '@/lib/tmdb';
import { fetchMetadata, fetchMetadataSafely } from '@/server/services/tmdb-enricher';

/**
 * The TMDB layer is exercised against a stubbed `fetch`, asserting the request that goes out
 * and the cache key it is stored under.
 */

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown): Response {
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
    process.env.TMDB_API_TOKEN = 'test-token';
    fetchMock = vi.fn(async () => jsonResponse({ id: 550, title: 'Fight Club', results: [] }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await Promise.all(
        [
            'tmdb.movie.550.detailed',
            'tmdb.movie.550',
            'tmdb.movies.popular.page.1',
            'tmdb.movies.top_rated.page.2',
            'tmdb.tv.1399.season.1',
            'tmdb.tv.1399.detailed',
        ].map(cacheForget),
    );
});

afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
});

function requestedUrl(callIndex = 0): URL {
    const call = fetchMock.mock.calls[callIndex];

    return new URL(String(call?.[0]));
}

describe('movie requests', () => {
    it('requests the append_to_response fields the detail page needs', async () => {
        await movies.getMovie(550, true);

        const url = requestedUrl();

        expect(url.pathname).toBe('/3/movie/550');
        expect(url.searchParams.get('append_to_response')).toBe('credits,videos,similar,watch/providers,recommendations');
    });

    it('omits append_to_response when details are not requested', async () => {
        await movies.getMovie(550, false);

        expect(requestedUrl().searchParams.has('append_to_response')).toBe(false);
    });

    it('sends the API token as a bearer credential', async () => {
        await movies.getPopular();

        const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
        const headers = init.headers as Record<string, string>;

        expect(headers.Authorization).toBe('Bearer test-token');
    });

    it('serves a second call from the cache', async () => {
        await movies.getPopular(1);
        await movies.getPopular(1);

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('caches each page separately', async () => {
        await movies.getPopular(1);
        await movies.getTopRated(2);

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(requestedUrl(0).pathname).toBe('/3/movie/popular');
        expect(requestedUrl(1).pathname).toBe('/3/movie/top_rated');
        expect(requestedUrl(1).searchParams.get('page')).toBe('2');
    });

    it('routes browse categories to the matching endpoint', async () => {
        await movies.getByCategory('now_playing', 1);

        expect(requestedUrl().pathname).toBe('/3/movie/now_playing');
    });

    it('builds one cache entry per distinct discover filter set', async () => {
        await movies.discover({ with_genres: '28' }, 1);
        await movies.discover({ with_genres: '35' }, 1);
        await movies.discover({ with_genres: '28' }, 1);

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('treats filters that differ only in key order as the same request', async () => {
        await movies.discover({ with_genres: '28', sort_by: 'popularity.desc' }, 1);
        await movies.discover({ sort_by: 'popularity.desc', with_genres: '28' }, 1);

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});

describe('tv requests', () => {
    it('requests a season by number', async () => {
        await tv.getSeason(1399, 1);

        expect(requestedUrl().pathname).toBe('/3/tv/1399/season/1');
    });

    it('appends credits and images to episode requests', async () => {
        await tv.getEpisode(1399, 1, 2);

        const url = requestedUrl();

        expect(url.pathname).toBe('/3/tv/1399/season/1/episode/2');
        expect(url.searchParams.get('append_to_response')).toBe('credits,images');
    });
});

describe('error handling', () => {
    it('surfaces a TmdbError for a failed response', async () => {
        fetchMock.mockResolvedValue(new Response('Not Found', { status: 404 }));

        await expect(movies.getMovie(999_999, false)).rejects.toThrow(/TMDB request failed: 404/);
    });

    it('does not cache failed responses', async () => {
        fetchMock.mockResolvedValueOnce(new Response('boom', { status: 500 }));

        await expect(movies.getPopular(1)).rejects.toThrow();

        fetchMock.mockResolvedValueOnce(jsonResponse({ page: 1, results: [] }));
        await expect(movies.getPopular(1)).resolves.toMatchObject({ page: 1 });
    });
});

describe('tmdb enricher', () => {
    it('maps a movie response to the columns the watchlist stores', async () => {
        fetchMock.mockResolvedValue(
            jsonResponse({
                id: 550,
                title: 'Fight Club',
                poster_path: '/poster.jpg',
                release_date: '1999-10-15',
                vote_average: 8.4,
                overview: 'A ticking-time-bomb insomniac.',
            }),
        );

        expect(await fetchMetadata(550, 'movie')).toEqual({
            title: 'Fight Club',
            poster_path: '/poster.jpg',
            release_date: '1999-10-15',
            vote_average: 8.4,
            overview: 'A ticking-time-bomb insomniac.',
            total_seasons: null,
        });
    });

    it('reads first_air_date and season count for TV shows', async () => {
        fetchMock.mockResolvedValue(
            jsonResponse({
                id: 1399,
                name: 'Game of Thrones',
                poster_path: '/got.jpg',
                first_air_date: '2011-04-17',
                vote_average: 8.5,
                overview: 'Seven noble families fight.',
                number_of_seasons: 8,
            }),
        );

        expect(await fetchMetadata(1399, 'tv')).toMatchObject({
            title: 'Game of Thrones',
            release_date: '2011-04-17',
            total_seasons: 8,
        });
    });

    it('treats an empty release date as missing', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ id: 550, title: 'Untitled', release_date: '' }));

        expect((await fetchMetadata(550, 'movie')).release_date).toBeNull();
    });

    it('resolves to null instead of throwing when TMDB is unreachable', async () => {
        fetchMock.mockRejectedValue(new Error('network down'));
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        expect(await fetchMetadataSafely(550, 'movie')).toBeNull();
    });
});
