'use client';

import { Check, CheckCircle2, Clock, Eye, Heart, Pause, Star, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { Progress } from '@/components/ui/progress';
import type { WatchlistStatus } from '@/lib/enums';
import { formatYear, getImageUrl } from '@/lib/images';
import { cn } from '@/lib/utils';
import { FavoriteHeart, StatusDropdown } from './quick-actions';

export type MediaCardItem = {
    id: number;
    title?: string;
    name?: string;
    poster_path?: string | null;
    overview?: string;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
    air_date?: string;
    season_number?: number;
    episode_number?: number;
    episode_count?: number;
};

export type SeasonProgress = {
    watched: number;
    total: number;
    percent: number;
    isCompleted: boolean;
};

const STATUS_CONFIG: Record<WatchlistStatus, { label: string; icon: typeof Check; ring: string; dot: string; text: string }> = {
    plan_to_watch: { label: 'Plan to Watch', icon: Clock, ring: 'ring-zinc-400/50', dot: 'bg-zinc-400', text: 'text-zinc-400' },
    watching: { label: 'Watching', icon: Eye, ring: 'ring-blue-400/50', dot: 'bg-blue-400', text: 'text-blue-400' },
    completed: { label: 'Completed', icon: Check, ring: 'ring-emerald-400/50', dot: 'bg-emerald-400', text: 'text-emerald-400' },
    dropped: { label: 'Dropped', icon: X, ring: 'ring-red-400/50', dot: 'bg-red-400', text: 'text-red-400' },
    on_hold: { label: 'On Hold', icon: Pause, ring: 'ring-amber-400/50', dot: 'bg-amber-400', text: 'text-amber-400' },
};

export type MediaCardProps = {
    item: MediaCardItem;
    mediaType: 'movie' | 'tv' | 'season' | 'episode';
    tvShowId?: number;
    progress?: SeasonProgress;
    showQuickActions?: boolean;
    isFavorite?: boolean;
    watchlistStatus?: WatchlistStatus | null;
};

function resolveHref(props: MediaCardProps): string {
    const { item, mediaType, tvShowId } = props;

    if (mediaType === 'tv') {
        return `/tv/${item.id}`;
    }

    if (mediaType === 'season' && tvShowId && item.season_number !== undefined) {
        return `/tv/${tvShowId}/season/${item.season_number}`;
    }

    if (mediaType === 'episode' && tvShowId && item.season_number !== undefined && item.episode_number !== undefined) {
        return `/tv/${tvShowId}/season/${item.season_number}/episode/${item.episode_number}`;
    }

    return `/movies/${item.id}`;
}

export function MediaCard(props: MediaCardProps) {
    const { item, mediaType, progress, showQuickActions = false, isFavorite = false, watchlistStatus = null } = props;

    const title = item.title ?? item.name ?? 'Untitled';
    const year = formatYear(item.release_date ?? item.air_date ?? item.first_air_date);
    const href = resolveHref(props) as Route;

    const isSeason = mediaType === 'season' && item.season_number !== undefined;
    const episodeCount = isSeason ? item.episode_count : null;
    const statusConfig = watchlistStatus ? STATUS_CONFIG[watchlistStatus] : null;
    const rating = item.vote_average && item.vote_average > 0 ? Number(item.vote_average).toFixed(1) : null;

    return (
        /*
         * Hover state is in CSS, not React state. Tracking it with onMouseEnter/onMouseLeave and
         * mounting the controls conditionally breaks the status dropdown: opening it moves the
         * pointer off the card, the mouseleave unmounts the trigger, and the menu closes.
         */
        <div className="group">
            <div
                className={cn(
                    'relative aspect-[2/3] rounded-lg shadow-sm transition-all duration-300 group-hover:shadow-lg',
                    statusConfig && `ring-2 ${statusConfig.ring} ring-offset-background ring-offset-2`,
                )}
            >
                <Link href={href} className="absolute inset-0 overflow-hidden rounded-lg">
                    <Image
                        src={getImageUrl(item.poster_path, 'w342')}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 342px"
                        className="object-cover"
                        unoptimized={!item.poster_path}
                    />

                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        {rating && (
                            <div className="flex items-center gap-1.5">
                                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-lg font-bold text-white">{rating}</span>
                            </div>
                        )}

                        {item.overview && <p className="line-clamp-4 text-center text-xs leading-relaxed text-white/80">{item.overview}</p>}

                        {isSeason && progress && progress.total > 0 && (
                            <div className="w-full space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-white/70">
                                        {progress.watched}/{progress.total} episodes
                                    </span>
                                    <span className="font-semibold text-white">{Math.round(progress.percent)}%</span>
                                </div>
                                <Progress
                                    value={progress.percent}
                                    size="sm"
                                    color={progress.isCompleted ? 'success' : 'primary'}
                                    aria-label={`${title} progress: ${progress.watched} of ${progress.total} episodes watched`}
                                />
                            </div>
                        )}
                    </div>

                    {(statusConfig || isFavorite || (isSeason && progress?.isCompleted)) && (
                        <div className="absolute right-1.5 bottom-1.5 flex items-center gap-1 transition-opacity group-hover:opacity-0">
                            {isFavorite && <Heart className="size-3.5 fill-red-500 text-red-500 drop-shadow-md" />}
                            {isSeason && progress?.isCompleted && (
                                <div className="bg-success flex size-5 items-center justify-center rounded-full shadow-md">
                                    <CheckCircle2 className="size-3 text-white" />
                                </div>
                            )}
                            {statusConfig && <div className={cn('size-3 rounded-full shadow-md ring-1 ring-white/50', statusConfig.dot)} />}
                        </div>
                    )}

                    {isSeason && progress && progress.watched > 0 && !progress.isCompleted && (
                        <div className="absolute top-1.5 right-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-0">
                            {progress.watched}/{progress.total}
                        </div>
                    )}
                </Link>

                {showQuickActions && (mediaType === 'movie' || mediaType === 'tv') && (
                    /*
                     * Stays mounted so an open dropdown survives the pointer leaving the card, and
                     * becomes visible on keyboard focus as well as hover.
                     */
                    <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 flex items-start justify-between p-2.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100 has-[[data-state=open]]:pointer-events-auto has-[[data-state=open]]:opacity-100">
                        <StatusDropdown tmdbId={item.id} mediaType={mediaType} watchlistStatus={watchlistStatus} />
                        <FavoriteHeart tmdbId={item.id} mediaType={mediaType} isFavorite={isFavorite} />
                    </div>
                )}
            </div>

            <div className="mt-1.5 px-0.5">
                <h3 className="truncate text-sm font-medium">
                    <Link href={href} className="hover:underline">
                        {title}
                    </Link>
                </h3>
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <span>{year || 'N/A'}</span>
                    {isSeason && episodeCount ? (
                        <>
                            <span className="bg-muted-foreground/50 size-1 rounded-full" />
                            <span>
                                {episodeCount} ep{episodeCount !== 1 ? 's' : ''}
                            </span>
                        </>
                    ) : null}
                    {statusConfig && (
                        <>
                            <span className="bg-muted-foreground/50 size-1 rounded-full" />
                            <span className={cn('font-medium', statusConfig.text)}>{statusConfig.label}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
