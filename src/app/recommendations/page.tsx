import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SectionHeader } from '@/components/layout/section-header';
import { MediaGrid } from '@/components/media/media-grid';
import { getCurrentUser } from '@/server/auth/current-user';
import { getFavoriteIdSet } from '@/server/services/favorites';
import { getRecommendationsFor } from '@/server/services/discovery';
import { getStatusMap } from '@/server/services/watchlist';

export const metadata: Metadata = { title: 'Recommended for You', robots: { index: false, follow: false } };

export default async function RecommendationsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login?redirect=/recommendations');
    }

    const { movies, shows, personalised } = await getRecommendationsFor(user.id);

    const [movieStatuses, movieFavorites, showStatuses, showFavorites] = await Promise.all([
        getStatusMap(user.id, 'movie', movies.map((movie) => movie.id)),
        getFavoriteIdSet(user.id, 'movie', movies.map((movie) => movie.id)),
        getStatusMap(user.id, 'tv', shows.map((show) => show.id)),
        getFavoriteIdSet(user.id, 'tv', shows.map((show) => show.id)),
    ]);

    return (
        <div className="space-y-10">
            <div className="space-y-1">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                    <Sparkles className="text-primary size-6" /> Recommended for You
                </h1>
                <p className="text-muted-foreground text-sm">
                    {personalised ? 'Based on the titles in your watchlist.' : 'Popular right now — track a few titles to personalise this.'}
                </p>
            </div>

            <section className="space-y-3">
                <SectionHeader title="Movies you might like" />
                <MediaGrid
                    items={movies}
                    mediaType="movie"
                    showQuickActions
                    watchlistStatuses={movieStatuses}
                    favoriteIds={[...movieFavorites]}
                    emptyMessage="No movie recommendations yet."
                />
            </section>

            <section className="space-y-3">
                <SectionHeader title="Shows you might like" />
                <MediaGrid
                    items={shows}
                    mediaType="tv"
                    showQuickActions
                    watchlistStatuses={showStatuses}
                    favoriteIds={[...showFavorites]}
                    emptyMessage="No show recommendations yet."
                />
            </section>
        </div>
    );
}
