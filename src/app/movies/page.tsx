import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrowseFilters } from '@/components/browse/browse-filters';
import { Pagination } from '@/components/browse/pagination';
import { MediaGrid, MediaGridSkeleton } from '@/components/media/media-grid';
import { buildBrowseQuery, hasActiveFilters, MOVIE_SORTS, movieBrowseSchema, toDiscoverFilters } from '@/lib/browse';
import { getMovieGenres, movies } from '@/lib/tmdb';
import { getCurrentUser } from '@/server/auth/current-user';
import { getFavoriteIdSet } from '@/server/services/favorites';
import { getStatusMap } from '@/server/services/watchlist';

const CATEGORIES = [
    { value: 'popular', label: 'Popular' },
    { value: 'top_rated', label: 'Top Rated' },
    { value: 'now_playing', label: 'Now Playing' },
    { value: 'upcoming', label: 'Upcoming' },
];

const SORTS = [
    { value: MOVIE_SORTS[0], label: 'Most popular' },
    { value: MOVIE_SORTS[1], label: 'Highest rated' },
    { value: MOVIE_SORTS[2], label: 'Newest' },
    { value: MOVIE_SORTS[3], label: 'Highest revenue' },
];

const CATEGORY_TITLES: Record<string, string> = {
    popular: 'Popular Movies',
    top_rated: 'Top Rated Movies',
    now_playing: 'Now Playing',
    upcoming: 'Upcoming Movies',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const params = movieBrowseSchema.parse(await searchParams);
    const title = CATEGORY_TITLES[params.category] ?? 'Movies';

    return { title, description: `Browse ${title.toLowerCase()} and track what you want to watch.` };
}

async function MovieResults({ params }: { params: ReturnType<typeof movieBrowseSchema.parse> }) {
    const filtered = hasActiveFilters(params);
    const results = filtered
        ? await movies.discover(toDiscoverFilters(params, 'primary_release_year'), params.page)
        : await movies.getByCategory(params.category, params.page);

    const user = await getCurrentUser();
    const tmdbIds = results.results.map((movie) => movie.id);

    const [watchlistStatuses, favoriteIds] = user
        ? await Promise.all([getStatusMap(user.id, 'movie', tmdbIds), getFavoriteIdSet(user.id, 'movie', tmdbIds)])
        : [{}, new Set<number>()];

    return (
        <>
            <MediaGrid
                items={results.results}
                mediaType="movie"
                showQuickActions={Boolean(user)}
                watchlistStatuses={watchlistStatuses}
                favoriteIds={[...favoriteIds]}
                emptyMessage="No movies matched those filters."
            />
            <Pagination
                page={results.page}
                lastPage={Math.min(results.total_pages, 500)}
                buildHref={(page) => `/movies${buildBrowseQuery({ ...params, page })}`}
            />
        </>
    );
}

export default async function MoviesPage({ searchParams }: { searchParams: SearchParams }) {
    const params = movieBrowseSchema.parse(await searchParams);
    const genres = await getMovieGenres();
    const heading = hasActiveFilters(params) ? 'Movies' : (CATEGORY_TITLES[params.category] ?? 'Movies');

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>

            <BrowseFilters basePath="/movies" categories={CATEGORIES} sorts={SORTS} genres={genres} />

            <Suspense key={JSON.stringify(params)} fallback={<MediaGridSkeleton />}>
                <MovieResults params={params} />
            </Suspense>
        </div>
    );
}
