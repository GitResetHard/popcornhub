'use client';

import { Bookmark, Check, Clock, Eye, Heart, Pause, X } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WatchlistStatus } from '@/lib/enums';
import { cn } from '@/lib/utils';
import { removeFromWatchlist, setWatchlistStatus, toggleFavorite } from '@/server/actions/tracking';

const STATUS_ITEMS: Array<{ status: WatchlistStatus; label: string; icon: typeof Check }> = [
    { status: 'plan_to_watch', label: 'Plan to Watch', icon: Clock },
    { status: 'watching', label: 'Watching', icon: Eye },
    { status: 'completed', label: 'Completed', icon: Check },
    { status: 'on_hold', label: 'On Hold', icon: Pause },
    { status: 'dropped', label: 'Dropped', icon: X },
];

type MediaIdentity = { tmdbId: number; mediaType: 'movie' | 'tv' };

export function StatusDropdown({ tmdbId, mediaType, watchlistStatus }: MediaIdentity & { watchlistStatus: WatchlistStatus | null }) {
    const [isPending, startTransition] = useTransition();

    const apply = (status: WatchlistStatus) => {
        startTransition(async () => {
            const result = await setWatchlistStatus({ tmdbId, mediaType, status });

            if (result.ok) {
                toast.success(`Marked as ${STATUS_ITEMS.find((item) => item.status === status)?.label ?? status}`);
            } else {
                toast.error(result.error);
            }
        });
    };

    const remove = () => {
        startTransition(async () => {
            const result = await removeFromWatchlist({ tmdbId, mediaType });

            if (result.ok) {
                toast.success('Removed from your watchlist');
            } else {
                toast.error(result.error);
            }
        });
    };

    const activeStatus = watchlistStatus ? STATUS_ITEMS.find((item) => item.status === watchlistStatus) : null;
    const ActiveIcon = activeStatus?.icon ?? Bookmark;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={activeStatus ? `Watchlist status: ${activeStatus.label}` : 'Add to watchlist'}
                disabled={isPending}
                className={cn(
                    'flex size-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition hover:bg-black/90 disabled:opacity-60',
                    activeStatus && 'bg-primary/90 hover:bg-primary',
                )}
            >
                <ActiveIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
                {STATUS_ITEMS.map(({ status, label, icon: Icon }) => (
                    <DropdownMenuItem key={status} onSelect={() => apply(status)}>
                        <Icon className="size-4" />
                        <span>{label}</span>
                        {watchlistStatus === status && <Check className="ml-auto size-3.5" />}
                    </DropdownMenuItem>
                ))}
                {watchlistStatus && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={remove}>
                            <X className="size-4" />
                            <span>Remove</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function FavoriteHeart({ tmdbId, mediaType, isFavorite }: MediaIdentity & { isFavorite: boolean }) {
    const [isPending, startTransition] = useTransition();

    const toggle = () => {
        startTransition(async () => {
            const result = await toggleFavorite({ tmdbId, mediaType });

            if (result.ok) {
                toast.success(result.data.favorited ? 'Added to favorites' : 'Removed from favorites');
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={isPending}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
            className="flex size-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition hover:bg-black/90 disabled:opacity-60"
        >
            <Heart className={cn('size-4', isFavorite && 'fill-red-500 text-red-500')} />
        </button>
    );
}
