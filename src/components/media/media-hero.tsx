import { Calendar, Clock, Star } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { backdropUrl } from '@/lib/env';
import { formatRuntime, formatYear, getImageUrl } from '@/lib/images';
import type { WatchlistStatus } from '@/lib/enums';
import type { Genre } from '@/lib/tmdb';
import { TrackingControls } from './tracking-controls';

export function MediaHero({
    tmdbId,
    mediaType,
    title,
    tagline,
    overview,
    posterPath,
    backdropPath,
    releaseDate,
    runtime,
    voteAverage,
    voteCount,
    genres,
    status,
    seasonCount,
    watchlistStatus,
    isFavorite,
    canTrack,
}: {
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    tagline?: string | null;
    overview: string;
    posterPath: string | null;
    backdropPath: string | null;
    releaseDate?: string;
    runtime?: number | null;
    voteAverage?: number;
    voteCount?: number;
    genres: Genre[];
    status?: string;
    seasonCount?: number;
    watchlistStatus: WatchlistStatus | null;
    isFavorite: boolean;
    canTrack: boolean;
}) {
    const year = formatYear(releaseDate);
    const rating = voteAverage && voteAverage > 0 ? Number(voteAverage).toFixed(1) : null;
    const backdrop = backdropUrl(backdropPath);

    return (
        <section className="relative">
            {backdrop && (
                <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl">
                    <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover opacity-20" />
                    <div className="from-background absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
                </div>
            )}

            <div className="flex flex-col gap-6 p-4 sm:flex-row sm:p-6">
                <div className="bg-muted relative aspect-[2/3] w-40 shrink-0 self-center overflow-hidden rounded-lg shadow-lg sm:w-56 sm:self-start">
                    <Image
                        src={getImageUrl(posterPath, 'w500')}
                        alt={title}
                        fill
                        priority
                        sizes="(max-width: 640px) 160px, 224px"
                        className="object-cover"
                        unoptimized={!posterPath}
                    />
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            {title}
                            {year && <span className="text-muted-foreground ml-2 font-normal">({year})</span>}
                        </h1>
                        {tagline && <p className="text-muted-foreground mt-1 text-sm italic">{tagline}</p>}
                    </div>

                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        {rating && (
                            <span className="flex items-center gap-1.5">
                                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-foreground font-semibold">{rating}</span>
                                {voteCount ? <span>({voteCount.toLocaleString()} votes)</span> : null}
                            </span>
                        )}
                        {releaseDate && (
                            <span className="flex items-center gap-1.5">
                                <Calendar className="size-4" />
                                {releaseDate}
                            </span>
                        )}
                        {runtime ? (
                            <span className="flex items-center gap-1.5">
                                <Clock className="size-4" />
                                {formatRuntime(runtime)}
                            </span>
                        ) : null}
                        {seasonCount ? (
                            <span>
                                {seasonCount} season{seasonCount === 1 ? '' : 's'}
                            </span>
                        ) : null}
                        {status && <span>{status}</span>}
                    </div>

                    {genres.length > 0 && (
                        <ul className="flex flex-wrap gap-2">
                            {genres.map((genre) => (
                                <li key={genre.id}>
                                    <Badge variant="secondary">{genre.name}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}

                    {overview && <p className="max-w-3xl leading-relaxed">{overview}</p>}

                    <TrackingControls
                        tmdbId={tmdbId}
                        mediaType={mediaType}
                        watchlistStatus={watchlistStatus}
                        isFavorite={isFavorite}
                        canTrack={canTrack}
                    />
                </div>
            </div>
        </section>
    );
}
