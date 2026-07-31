import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { z } from 'zod';
import { Pagination } from '@/components/browse/pagination';
import { MediaGrid, MediaGridSkeleton } from '@/components/media/media-grid';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/images';
import { internalHref } from '@/lib/routes';
import { search } from '@/lib/tmdb';
import { getCurrentUser } from '@/server/auth/current-user';
import { getFavoriteIdSet } from '@/server/services/favorites';
import { getStatusMap } from '@/server/services/watchlist';

const searchSchema = z.object({
    query: z.string().max(255).optional().catch(undefined),
    q: z.string().max(255).optional().catch(undefined),
    type: z.enum(['multi', 'movie', 'tv', 'person']).default('multi').catch('multi'),
    page: z.coerce.number().int().min(1).max(1000).default(1).catch(1),
});

const TYPE_TABS: Array<{ value: 'multi' | 'movie' | 'tv' | 'person'; label: string }> = [
    { value: 'multi', label: 'All' },
    { value: 'movie', label: 'Movies' },
    { value: 'tv', label: 'TV Shows' },
    { value: 'person', label: 'People' },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parse(params: Record<string, string | string[] | undefined>) {
    const parsed = searchSchema.parse(params);

    return { ...parsed, term: (parsed.query ?? parsed.q ?? '').trim() };
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const { term } = parse(await searchParams);

    return {
        title: term ? `Search results for "${term}"` : 'Search',
        description: term ? `Movies, TV shows, and people matching "${term}".` : 'Search across movies, TV shows, and people.',
        robots: { index: false, follow: true },
    };
}

function buildHref(term: string, type: string, page: number): string {
    const params = new URLSearchParams({ query: term });

    if (type !== 'multi') {
        params.set('type', type);
    }

    if (page > 1) {
        params.set('page', String(page));
    }

    return `/search?${params.toString()}`;
}

async function PersonResults({ term, page }: { term: string; page: number }) {
    const results = await search.searchPeople(term, page);

    if (results.results.length === 0) {
        return <p className="text-muted-foreground py-16 text-center text-sm">No people matched that search.</p>;
    }

    return (
        <>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {results.results.map((person) => (
                    <li key={person.id}>
                        <a href={`/people/${person.id}`} className="group block">
                            <div className="bg-muted relative aspect-[2/3] overflow-hidden rounded-lg">
                                <Image
                                    src={getImageUrl(person.profile_path, 'w342')}
                                    alt={person.name}
                                    fill
                                    sizes="(max-width: 640px) 50vw, 200px"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    unoptimized={!person.profile_path}
                                />
                            </div>
                            <p className="mt-1.5 truncate text-sm font-medium">{person.name}</p>
                            <p className="text-muted-foreground truncate text-xs">{person.known_for_department}</p>
                        </a>
                    </li>
                ))}
            </ul>
            <Pagination page={results.page} lastPage={Math.min(results.total_pages, 500)} buildHref={(next) => buildHref(term, 'person', next)} />
        </>
    );
}

async function MediaResults({ term, type, page }: { term: string; type: 'multi' | 'movie' | 'tv'; page: number }) {
    const results =
        type === 'movie'
            ? await search.searchMovies(term, page)
            : type === 'tv'
              ? await search.searchTvShows(term, page)
              : await search.multiSearch(term, page);

    const items = results.results.filter((item) => !('media_type' in item) || item.media_type !== 'person');

    const user = await getCurrentUser();
    const tmdbIds = items.map((item) => item.id);
    const gridMediaType = type === 'tv' ? 'tv' : 'movie';

    const [watchlistStatuses, favoriteIds] = user
        ? await Promise.all([getStatusMap(user.id, gridMediaType, tmdbIds), getFavoriteIdSet(user.id, gridMediaType, tmdbIds)])
        : [{}, new Set<number>()];

    return (
        <>
            <MediaGrid
                items={items}
                mediaType={gridMediaType}
                showQuickActions={Boolean(user) && type !== 'multi'}
                watchlistStatuses={watchlistStatuses}
                favoriteIds={[...favoriteIds]}
                emptyMessage="Nothing matched that search."
            />
            <Pagination page={results.page} lastPage={Math.min(results.total_pages, 500)} buildHref={(next) => buildHref(term, type, next)} />
        </>
    );
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
    const { term, type, page } = parse(await searchParams);

    if (!term) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold tracking-tight">Search</h1>
                <p className="text-muted-foreground">Use the search box in the header to find movies, TV shows, and people.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">
                Results for <span className="text-primary">{term}</span>
            </h1>

            <nav aria-label="Result types" className="flex flex-wrap gap-2">
                {TYPE_TABS.map((tab) => (
                    <Button key={tab.value} asChild size="sm" variant={type === tab.value ? 'default' : 'outline'}>
                        <Link href={internalHref(buildHref(term, tab.value, 1))}>{tab.label}</Link>
                    </Button>
                ))}
            </nav>

            <Suspense key={`${term}-${type}-${page}`} fallback={<MediaGridSkeleton />}>
                {type === 'person' ? <PersonResults term={term} page={page} /> : <MediaResults term={term} type={type} page={page} />}
            </Suspense>
        </div>
    );
}
