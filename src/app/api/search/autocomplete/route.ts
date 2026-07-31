import { NextResponse } from 'next/server';
import { formatYear } from '@/lib/images';
import { search } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

const MAX_RESULTS = 8;

export async function GET(request: Request) {
    const query = new URL(request.url).searchParams.get('q')?.trim();

    if (!query || query.length > 255) {
        return NextResponse.json({ results: [] });
    }

    try {
        const response = await search.multiSearch(query, 1);

        const results = response.results
            .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
            .slice(0, MAX_RESULTS)
            .map((item) => ({
                id: item.id,
                media_type: item.media_type,
                title: item.title ?? item.name ?? 'Unknown',
                year: formatYear(item.release_date ?? item.first_air_date),
                poster_path: item.poster_path ?? null,
                vote_average: item.vote_average ?? 0,
            }));

        return NextResponse.json({ results });
    } catch (error) {
        console.error('[autocomplete] search failed', error);

        return NextResponse.json({ results: [] });
    }
}
