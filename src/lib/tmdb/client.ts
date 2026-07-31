import { env } from '@/lib/env';

const BASE_URL = 'https://api.themoviedb.org/3';

export class TmdbError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly endpoint: string,
    ) {
        super(message);
        this.name = 'TmdbError';
    }
}

type QueryValue = string | number | boolean | undefined | null;

function buildUrl(endpoint: string, query: Record<string, QueryValue> = {}): string {
    const url = new URL(`${BASE_URL}/${endpoint.replace(/^\//, '')}`);

    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, String(value));
        }
    }

    return url.toString();
}

export async function tmdbRequest<T>(endpoint: string, query: Record<string, QueryValue> = {}): Promise<T> {
    const token = env.TMDB_API_TOKEN;

    if (!token) {
        throw new TmdbError('TMDB_API_TOKEN is not configured', 500, endpoint);
    }

    const response = await fetch(buildUrl(endpoint, query), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new TmdbError(`TMDB request failed: ${response.status} ${response.statusText}`, response.status, endpoint);
    }

    return (await response.json()) as T;
}

export const APPEND = {
    credits: 'credits',
    videos: 'videos',
    similar: 'similar',
    recommendations: 'recommendations',
    watchProviders: 'watch/providers',
    externalIds: 'external_ids',
    images: 'images',
    keywords: 'keywords',
} as const;

export function appendToResponse(...parts: Array<(typeof APPEND)[keyof typeof APPEND]>): string {
    return parts.join(',');
}
