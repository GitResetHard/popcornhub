import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrowseFilters } from '@/components/browse/browse-filters';
import { Pagination } from '@/components/browse/pagination';
import { MediaGrid, MediaGridSkeleton } from '@/components/media/media-grid';
import { buildBrowseQuery, hasActiveFilters, toDiscoverFilters, tvBrowseSchema, TV_SORTS } from '@/lib/browse';
import { getTvGenres, tv } from '@/lib/tmdb';
import { getCurrentUser } from '@/server/auth/current-user';
import { getFavoriteIdSet } from '@/server/services/favorites';
import { getStatusMap } from '@/server/services/watchlist';

const CATEGORIES = [
    { value: 'popular', label: 'Popular' },
    { value: 'top_rated', label: 'Top Rated' },
    { value: 'on_the_air', label: 'On The Air' },
    { value: 'airing_today', label: 'Airing Today' },
];

const SORTS = [
    { value: TV_SORTS[0], label: 'Most popular' },
    { value: TV_SORTS[1], label: 'Highest rated' },
    { value: TV_SORTS[2], label: 'Newest' },
];

const CATEGORY_TITLES: Record<string, string> = {
    popular: 'Popular TV Shows',
    top_rated: 'Top Rated TV Shows',
    on_the_air: 'On The Air',
    airing_today: 'Airing Today',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const params = tvBrowseSchema.parse(await searchParams);
    const title = CATEGORY_TITLES[params.category] ?? 'TV Shows';

    return { title, description: `Browse ${title.toLowerCase()} and keep track of the episodes you have watched.` };
}

async function TvResults({ params }: { params: ReturnType<typeof tvBrowseSchema.parse> }) {
    const results = hasActiveFilters(params)
        ? await tv.discover(toDiscoverFilters(params, 'first_air_date_year'), params.page)
        : await tv.getByCategory(params.category, params.page);

    const user = await getCurrentUser();
    const tmdbIds = results.results.map((show) => show.id);

    const [watchlistStatuses, favoriteIds] = user
        ? await Promise.all([getStatusMap(user.id, 'tv', tmdbIds), getFavoriteIdSet(user.id, 'tv', tmdbIds)])
        : [{}, new Set<number>()];

    return (
        <>
            <MediaGrid
                items={results.results}
                mediaType="tv"
                showQuickActions={Boolean(user)}
                watchlistStatuses={watchlistStatuses}
                favoriteIds={[...favoriteIds]}
                emptyMessage="No shows matched those filters."
            />
            <Pagination
                page={results.page}
                lastPage={Math.min(results.total_pages, 500)}
                buildHref={(page) => `/tv${buildBrowseQuery({ ...params, page })}`}
            />
        </>
    );
}

export default async function TvPage({ searchParams }: { searchParams: SearchParams }) {
    const params = tvBrowseSchema.parse(await searchParams);
    const genres = await getTvGenres();
    const heading = hasActiveFilters(params) ? 'TV Shows' : (CATEGORY_TITLES[params.category] ?? 'TV Shows');

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>

            <BrowseFilters basePath="/tv" categories={CATEGORIES} sorts={SORTS} genres={genres} />

            <Suspense key={JSON.stringify(params)} fallback={<MediaGridSkeleton />}>
                <TvResults params={params} />
            </Suspense>
        </div>
    );
}
