'use client';

import { Check, Clock, Eye, Heart, Pause, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { WATCHLIST_STATUSES, watchlistStatusLabel, type WatchlistStatus } from '@/lib/enums';
import { cn } from '@/lib/utils';
import { removeFromWatchlist, setWatchlistStatus, toggleFavorite } from '@/server/actions/tracking';

const STATUS_ICONS: Record<WatchlistStatus, typeof Check> = {
    plan_to_watch: Clock,
    watching: Eye,
    completed: Check,
    on_hold: Pause,
    dropped: X,
};

export function TrackingControls({
    tmdbId,
    mediaType,
    watchlistStatus,
    isFavorite,
    canTrack,
}: {
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    watchlistStatus: WatchlistStatus | null;
    isFavorite: boolean;
    canTrack: boolean;
}) {
    const [isPending, startTransition] = useTransition();

    if (!canTrack) {
        return (
            <p className="text-muted-foreground text-sm">
                <Link href="/login" className="text-primary hover:underline">
                    Sign in
                </Link>{' '}
                to add this to your watchlist.
            </p>
        );
    }

    const run = (operation: () => Promise<{ ok: boolean; error?: string }>, successMessage: string) => {
        startTransition(async () => {
            const result = await operation();

            if (result.ok) {
                toast.success(successMessage);
            } else {
                toast.error(result.error ?? 'Something went wrong.');
            }
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {WATCHLIST_STATUSES.map((status) => {
                const Icon = STATUS_ICONS[status];
                const isActive = watchlistStatus === status;

                return (
                    <Button
                        key={status}
                        size="sm"
                        variant={isActive ? 'default' : 'outline'}
                        disabled={isPending}
                        aria-pressed={isActive}
                        onClick={() => run(() => setWatchlistStatus({ tmdbId, mediaType, status }), `Marked as ${watchlistStatusLabel(status)}`)}
                    >
                        <Icon className="size-4" />
                        {watchlistStatusLabel(status)}
                    </Button>
                );
            })}

            <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                aria-pressed={isFavorite}
                onClick={() =>
                    run(() => toggleFavorite({ tmdbId, mediaType }), isFavorite ? 'Removed from favorites' : 'Added to favorites')
                }
            >
                <Heart className={cn('size-4', isFavorite && 'fill-red-500 text-red-500')} />
                {isFavorite ? 'Favorited' : 'Favorite'}
            </Button>

            {watchlistStatus && (
                <Button
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => run(() => removeFromWatchlist({ tmdbId, mediaType }), 'Removed from your watchlist')}
                >
                    <Trash2 className="size-4" />
                    Remove
                </Button>
            )}
        </div>
    );
}
