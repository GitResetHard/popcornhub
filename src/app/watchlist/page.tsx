import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Pagination } from '@/components/browse/pagination';
import { MediaGrid } from '@/components/media/media-grid';
import { Button } from '@/components/ui/button';
import { internalHref } from '@/lib/routes';
import { WATCHLIST_STATUSES, watchlistStatusLabel, type WatchlistStatus } from '@/lib/enums';
import { getCurrentUser } from '@/server/auth/current-user';
import { getFavoriteIdSet } from '@/server/services/favorites';
import { getUserStats, getUserWatchlistPaginated } from '@/server/services/watchlist';

export const metadata: Metadata = { title: 'Your Watchlist', robots: { index: false, follow: false } };

const paramsSchema = z.object({
    status: z.enum(WATCHLIST_STATUSES).optional().catch(undefined),
    page: z.coerce.number().int().min(1).default(1).catch(1),
});

const PER_PAGE = 24;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildHref(status: WatchlistStatus | undefined, page: number): string {
    const params = new URLSearchParams();

    if (status) {
        params.set('status', status);
    }

    if (page > 1) {
        params.set('page', String(page));
    }

    const query = params.toString();

    return query ? `/watchlist?${query}` : '/watchlist';
}

export default async function WatchlistPage({ searchParams }: { searchParams: SearchParams }) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login?redirect=/watchlist');
    }

    const { status, page } = paramsSchema.parse(await searchParams);
    const [results, stats] = await Promise.all([getUserWatchlistPaginated(user.id, status, page, PER_PAGE), getUserStats(user.id)]);

    const movieIds = results.data.filter((item) => item.mediaType === 'movie').map((item) => item.tmdbId);
    const tvIds = results.data.filter((item) => item.mediaType === 'tv').map((item) => item.tmdbId);

    const [movieFavorites, tvFavorites] = await Promise.all([
        getFavoriteIdSet(user.id, 'movie', movieIds),
        getFavoriteIdSet(user.id, 'tv', tvIds),
    ]);

    const items = results.data.map((item) => ({
        id: item.tmdbId,
        title: item.title ?? `#${item.tmdbId}`,
        poster_path: item.posterPath,
        release_date: item.releaseDate ?? undefined,
        vote_average: item.voteAverage ?? undefined,
        overview: item.overview ?? undefined,
        mediaType: item.mediaType,
        status: item.status,
    }));

    const movies = items.filter((item) => item.mediaType === 'movie');
    const shows = items.filter((item) => item.mediaType === 'tv');

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Your Watchlist</h1>
                <p className="text-muted-foreground text-sm">
                    {stats.total} title{stats.total === 1 ? '' : 's'} tracked
                </p>
            </div>

            <nav aria-label="Watchlist statuses" className="hide-scrollbar flex gap-2 overflow-x-auto">
                <Button asChild size="sm" variant={status ? 'outline' : 'default'}>
                    <Link href={internalHref(buildHref(undefined, 1))}>All ({stats.total})</Link>
                </Button>
                {WATCHLIST_STATUSES.map((candidate) => (
                    <Button key={candidate} asChild size="sm" variant={status === candidate ? 'default' : 'outline'}>
                        <Link href={internalHref(buildHref(candidate, 1))}>
                            {watchlistStatusLabel(candidate)} ({stats.by_status[candidate]})
                        </Link>
                    </Button>
                ))}
            </nav>

            {results.total === 0 ? (
                <div className="py-16 text-center">
                    <p className="text-muted-foreground">
                        {status ? `Nothing is marked as ${watchlistStatusLabel(status)} yet.` : 'Your watchlist is empty.'}
                    </p>
                    <Button asChild className="mt-4">
                        <Link href="/movies">Browse movies</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-8">
                    {movies.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold">Movies</h2>
                            <MediaGrid
                                items={movies}
                                mediaType="movie"
                                showQuickActions
                                watchlistStatuses={Object.fromEntries(movies.map((item) => [item.id, { status: item.status }]))}
                                favoriteIds={[...movieFavorites]}
                            />
                        </section>
                    )}

                    {shows.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold">TV Shows</h2>
                            <MediaGrid
                                items={shows}
                                mediaType="tv"
                                showQuickActions
                                watchlistStatuses={Object.fromEntries(shows.map((item) => [item.id, { status: item.status }]))}
                                favoriteIds={[...tvFavorites]}
                            />
                        </section>
                    )}

                    <Pagination page={results.page} lastPage={results.lastPage} buildHref={(next) => buildHref(status, next)} />
                </div>
            )}
        </div>
    );
}
