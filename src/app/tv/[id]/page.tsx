import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AddToListMenu } from '@/components/lists/add-to-list-menu';
import { CastList } from '@/components/media/cast-list';
import { MediaHero } from '@/components/media/media-hero';
import { MediaRow } from '@/components/media/media-row';
import { ReviewSection } from '@/components/reviews/review-section';
import { JsonLd } from '@/components/seo/json-ld';
import { Progress } from '@/components/ui/progress';
import { metadataForTvShow, tvShowJsonLd } from '@/lib/seo';
import { TmdbError, tv } from '@/lib/tmdb';
import { getCurrentUser } from '@/server/auth/current-user';
import { findByUserAndTmdb as findFavorite } from '@/server/services/favorites';
import { getWatchedEpisodeCountsBySeason } from '@/server/services/episodes';
import { getUserLists } from '@/server/services/lists';
import { findByUserAndTmdb as findWatchlistItem } from '@/server/services/watchlist';

type PageParams = Promise<{ id: string }>;

async function loadShow(rawId: string) {
    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
        notFound();
    }

    try {
        return await tv.getTvShow(id, true);
    } catch (error) {
        if (error instanceof TmdbError && error.status === 404) {
            notFound();
        }

        throw error;
    }
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
    const { id } = await params;

    return metadataForTvShow(await loadShow(id));
}

export default async function TvDetailPage({ params }: { params: PageParams }) {
    const { id } = await params;
    const show = await loadShow(id);
    const user = await getCurrentUser();

    const [watchlistItem, favorite, watchedBySeason, userLists] = user
        ? await Promise.all([
              findWatchlistItem(user.id, show.id, 'tv'),
              findFavorite(user.id, show.id, 'tv'),
              getWatchedEpisodeCountsBySeason(user.id, show.id),
              getUserLists(user.id),
          ])
        : [null, null, new Map<number, number>(), []];

    // Season 0 holds specials, which the browse UI hides.
    const seasons = (show.seasons ?? []).filter((season) => season.season_number > 0);
    const recommendations = show.recommendations?.results ?? [];

    return (
        <div className="space-y-10">
            <JsonLd data={tvShowJsonLd(show)} />

            <MediaHero
                tmdbId={show.id}
                mediaType="tv"
                title={show.name}
                tagline={show.tagline}
                overview={show.overview}
                posterPath={show.poster_path}
                backdropPath={show.backdrop_path}
                releaseDate={show.first_air_date}
                voteAverage={show.vote_average}
                voteCount={show.vote_count}
                genres={show.genres ?? []}
                status={show.status}
                seasonCount={show.number_of_seasons}
                watchlistStatus={watchlistItem?.status ?? null}
                isFavorite={Boolean(favorite)}
                canTrack={Boolean(user?.email_verified_at)}
            />

            {user?.email_verified_at && (
                <div className="flex justify-end">
                    <AddToListMenu tmdbId={show.id} mediaType="tv" lists={userLists.map((list) => ({ id: list.id, name: list.name, slug: list.slug }))} />
                </div>
            )}

            {seasons.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold sm:text-xl">Seasons</h2>
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {seasons.map((season) => {
                            const watched = watchedBySeason.get(season.season_number) ?? 0;
                            const total = season.episode_count;
                            const percent = total > 0 ? (watched / total) * 100 : 0;

                            return (
                                <li key={season.id} className="hover:bg-accent/50 rounded-lg border p-4 transition-colors">
                                    <a href={`/tv/${show.id}/season/${season.season_number}`} className="block space-y-2">
                                        <span className="flex items-baseline justify-between gap-2">
                                            <span className="font-medium">{season.name}</span>
                                            <span className="text-muted-foreground text-xs">
                                                {total} episode{total === 1 ? '' : 's'}
                                            </span>
                                        </span>
                                        {user && total > 0 && (
                                            <>
                                                <Progress
                                                    value={percent}
                                                    size="sm"
                                                    color={watched >= total ? 'success' : 'primary'}
                                                    aria-label={`${season.name}: ${watched} of ${total} episodes watched`}
                                                />
                                                <span className="text-muted-foreground text-xs">
                                                    {watched}/{total} watched
                                                </span>
                                            </>
                                        )}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            <CastList cast={show.credits?.cast ?? []} viewAllHref={`/tv/${show.id}/credits`} />

            <MediaRow title="Recommended" items={recommendations} mediaType="tv" />

            <ReviewSection tmdbId={show.id} mediaType="tv" />
        </div>
    );
}
