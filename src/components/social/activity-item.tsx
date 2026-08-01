import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import type { Route } from 'next';
import { UserAvatar } from '@/components/layout/user-avatar';
import { internalHref } from '@/lib/routes';

const VERBS: Record<string, string> = {
    added_to_watchlist: 'added to their watchlist',
    rated: 'rated',
    reviewed: 'reviewed',
    completed: 'completed',
    started_watching: 'started watching',
    updated_status: 'updated their status for',
};

export type ActivityItemData = {
    id: number;
    authorName?: string;
    authorUsername?: string;
    authorAvatar?: string | null;
    type: string;
    tmdbId: number;
    mediaType: string;
    metadata: Record<string, unknown>;
    createdAt: string;
};

function mediaHref(mediaType: string, tmdbId: number): Route | null {
    if (mediaType === 'movie') {
        return internalHref(`/movies/${tmdbId}`);
    }

    if (mediaType === 'tv') {
        return internalHref(`/tv/${tmdbId}`);
    }

    return null;
}

export function ActivityItem({ item, showAuthor = true }: { item: ActivityItemData; showAuthor?: boolean }) {
    const verb = VERBS[item.type] ?? 'updated';
    const title = typeof item.metadata.title === 'string' ? item.metadata.title : `#${item.tmdbId}`;
    const href = mediaHref(item.mediaType, item.tmdbId);
    const rating = typeof item.metadata.rating === 'number' ? item.metadata.rating : null;
    const when = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

    return (
        <div className="bg-card flex items-start gap-3 rounded-xl border p-4">
            {showAuthor && item.authorUsername && (
                <Link href={internalHref(`/users/${item.authorUsername}`)} className="shrink-0">
                    <UserAvatar name={item.authorName ?? 'User'} avatar={item.authorAvatar} className="size-9" />
                </Link>
            )}
            <div className="min-w-0 flex-1 text-sm">
                <p className="leading-relaxed">
                    {showAuthor && item.authorUsername && (
                        <Link href={internalHref(`/users/${item.authorUsername}`)} className="font-semibold hover:underline">
                            {item.authorName}{' '}
                        </Link>
                    )}
                    <span className="text-muted-foreground">{verb} </span>
                    {href ? (
                        <Link href={href} className="font-medium hover:underline">
                            {title}
                        </Link>
                    ) : (
                        <span className="font-medium">{title}</span>
                    )}
                    {rating != null && <span className="text-muted-foreground"> · {rating}/10</span>}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">{when}</p>
            </div>
        </div>
    );
}
