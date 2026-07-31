import { Skeleton } from '@/components/ui/skeleton';
import type { WatchlistStatus } from '@/lib/enums';
import { MediaCard, type MediaCardItem } from './media-card';

export type MediaGridProps = {
    items: MediaCardItem[];
    mediaType: 'movie' | 'tv';
    showQuickActions?: boolean;
    watchlistStatuses?: Record<number, { status: WatchlistStatus }>;
    favoriteIds?: number[];
    emptyMessage?: string;
};

export function MediaGrid({
    items,
    mediaType,
    showQuickActions = false,
    watchlistStatuses = {},
    favoriteIds = [],
    emptyMessage = 'Nothing to show here yet.',
}: MediaGridProps) {
    if (items.length === 0) {
        return (
            <p className="text-muted-foreground py-16 text-center text-sm" role="status">
                {emptyMessage}
            </p>
        );
    }

    const favorites = new Set(favoriteIds);

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item) => (
                <MediaCard
                    key={`${mediaType}-${item.id}`}
                    item={item}
                    mediaType={mediaType}
                    showQuickActions={showQuickActions}
                    watchlistStatus={watchlistStatuses[item.id]?.status ?? null}
                    isFavorite={favorites.has(item.id)}
                />
            ))}
        </div>
    );
}

export function MediaGridSkeleton({ count = 20 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className="space-y-1.5">
                    <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
            ))}
        </div>
    );
}
