import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { MediaGrid } from '@/components/media/media-grid';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/server/auth/current-user';
import { getUserFavorites } from '@/server/services/favorites';
import { getStatusMap } from '@/server/services/watchlist';

export const metadata: Metadata = { title: 'Your Favorites', robots: { index: false, follow: false } };

const paramsSchema = z.object({
    type: z.enum(['movie', 'tv', 'person']).optional().catch(undefined),
});

const TYPE_TABS = [
    { value: undefined, label: 'All' },
    { value: 'movie' as const, label: 'Movies' },
    { value: 'tv' as const, label: 'TV Shows' },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FavoritesPage({ searchParams }: { searchParams: SearchParams }) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login?redirect=/favorites');
    }

    const { type } = paramsSchema.parse(await searchParams);
    const favorites = await getUserFavorites(user.id, type);

    const items = favorites.map((favorite) => ({
        id: favorite.tmdbId,
        title: favorite.title ?? `#${favorite.tmdbId}`,
        poster_path: favorite.posterPath,
        release_date: favorite.releaseDate ?? undefined,
        vote_average: favorite.voteAverage ?? undefined,
        overview: favorite.overview ?? undefined,
        mediaType: favorite.mediaType,
    }));

    const movies = items.filter((item) => item.mediaType === 'movie');
    const shows = items.filter((item) => item.mediaType === 'tv');

    const [movieStatuses, tvStatuses] = await Promise.all([
        getStatusMap(user.id, 'movie', movies.map((item) => item.id)),
        getStatusMap(user.id, 'tv', shows.map((item) => item.id)),
    ]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Your Favorites</h1>

            <nav aria-label="Favorite types" className="flex flex-wrap gap-2">
                {TYPE_TABS.map((tab) => (
                    <Button key={tab.label} asChild size="sm" variant={type === tab.value ? 'default' : 'outline'}>
                        <Link href={(tab.value ? `/favorites?type=${tab.value}` : '/favorites') as never}>{tab.label}</Link>
                    </Button>
                ))}
            </nav>

            {items.length === 0 ? (
                <div className="py-16 text-center">
                    <p className="text-muted-foreground">You have not favorited anything yet.</p>
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
                                watchlistStatuses={movieStatuses}
                                favoriteIds={movies.map((item) => item.id)}
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
                                watchlistStatuses={tvStatuses}
                                favoriteIds={shows.map((item) => item.id)}
                            />
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
