import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AddToListMenu } from '@/components/lists/add-to-list-menu';
import { CastList } from '@/components/media/cast-list';
import { MediaHero } from '@/components/media/media-hero';
import { MediaRow } from '@/components/media/media-row';
import { ReviewSection } from '@/components/reviews/review-section';
import { JsonLd } from '@/components/seo/json-ld';
import { movies, TmdbError } from '@/lib/tmdb';
import { metadataForMovie, movieJsonLd } from '@/lib/seo';
import { getCurrentUser } from '@/server/auth/current-user';
import { findByUserAndTmdb as findFavorite } from '@/server/services/favorites';
import { getUserLists } from '@/server/services/lists';
import { findByUserAndTmdb as findWatchlistItem } from '@/server/services/watchlist';

type PageParams = Promise<{ id: string }>;

async function loadMovie(rawId: string) {
    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
        notFound();
    }

    try {
        return await movies.getMovie(id, true);
    } catch (error) {
        if (error instanceof TmdbError && error.status === 404) {
            notFound();
        }

        throw error;
    }
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
    const { id } = await params;

    return metadataForMovie(await loadMovie(id));
}

export default async function MovieDetailPage({ params }: { params: PageParams }) {
    const { id } = await params;
    const movie = await loadMovie(id);
    const user = await getCurrentUser();

    const [watchlistItem, favorite, userLists] = user
        ? await Promise.all([findWatchlistItem(user.id, movie.id, 'movie'), findFavorite(user.id, movie.id, 'movie'), getUserLists(user.id)])
        : [null, null, []];

    const recommendations = movie.recommendations?.results ?? [];
    const similar = movie.similar?.results ?? [];

    return (
        <div className="space-y-10">
            <JsonLd data={movieJsonLd(movie)} />

            <MediaHero
                tmdbId={movie.id}
                mediaType="movie"
                title={movie.title}
                tagline={movie.tagline}
                overview={movie.overview}
                posterPath={movie.poster_path}
                backdropPath={movie.backdrop_path}
                releaseDate={movie.release_date}
                runtime={movie.runtime}
                voteAverage={movie.vote_average}
                voteCount={movie.vote_count}
                genres={movie.genres ?? []}
                status={movie.status}
                watchlistStatus={watchlistItem?.status ?? null}
                isFavorite={Boolean(favorite)}
                canTrack={Boolean(user?.email_verified_at)}
            />

            {user?.email_verified_at && (
                <div className="flex justify-end">
                    <AddToListMenu tmdbId={movie.id} mediaType="movie" lists={userLists.map((list) => ({ id: list.id, name: list.name, slug: list.slug }))} />
                </div>
            )}

            <CastList cast={movie.credits?.cast ?? []} viewAllHref={`/movies/${movie.id}/credits`} />

            <MediaRow title="Recommended" items={recommendations} mediaType="movie" />
            {recommendations.length === 0 && <MediaRow title="Similar Movies" items={similar} mediaType="movie" />}

            <ReviewSection tmdbId={movie.id} mediaType="movie" />
        </div>
    );
}
