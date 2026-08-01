import { Clapperboard, Eye } from 'lucide-react';
import Link from 'next/link';
import { UserAvatar } from '@/components/layout/user-avatar';
import { internalHref } from '@/lib/routes';
import type { ClipView } from '@/server/services/clips';

/** Compact clip preview card. Playback lives on the linked media page. */
export function ClipCard({ clip }: { clip: ClipView }) {
    return (
        <article className="bg-card overflow-hidden rounded-xl border">
            <Link
                href={internalHref(`/${clip.mediaType === 'movie' ? 'movies' : 'tv'}/${clip.tmdbId}`)}
                className="bg-muted flex aspect-video items-center justify-center"
            >
                <Clapperboard className="text-muted-foreground size-8" />
            </Link>
            <div className="space-y-2 p-4">
                <h3 className="line-clamp-1 font-semibold">{clip.title}</h3>
                <p className="text-muted-foreground line-clamp-2 text-sm">{clip.description}</p>
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <Link href={internalHref(`/users/${clip.authorUsername}`)} className="flex items-center gap-1.5 hover:underline">
                        <UserAvatar name={clip.authorName} className="size-5" />
                        {clip.authorName}
                    </Link>
                    <span className="flex items-center gap-1">
                        <Eye className="size-3.5" />
                        {clip.viewsCount.toLocaleString()}
                    </span>
                </div>
            </div>
        </article>
    );
}
