import { Film } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/layout/empty-state';
import { UserAvatar } from '@/components/layout/user-avatar';
import { DeleteListButton } from '@/components/lists/delete-list-button';
import { ListLikeButton } from '@/components/lists/list-like-button';
import { RemoveListItemButton } from '@/components/lists/remove-list-item-button';
import { MediaCard } from '@/components/media/media-card';
import { Badge } from '@/components/ui/badge';
import { internalHref } from '@/lib/routes';
import { getCurrentUser } from '@/server/auth/current-user';
import { getListBySlug, getListItems, isListLiked } from '@/server/services/lists';

type PageParams = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
    const { slug } = await params;
    const list = await getListBySlug(slug);

    if (!list || list.visibility !== 'public') {
        return { title: 'List', robots: { index: false, follow: false } };
    }

    return { title: list.name, description: list.description ?? `A list by ${list.authorName}.` };
}

export default async function ListDetailPage({ params }: { params: PageParams }) {
    const { slug } = await params;
    const list = await getListBySlug(slug);

    if (!list) {
        notFound();
    }

    const viewer = await getCurrentUser();
    const isOwner = viewer?.id === list.userId;

    if (list.visibility === 'private' && !isOwner) {
        notFound();
    }

    const [items, liked] = await Promise.all([
        getListItems(list.id),
        viewer ? isListLiked(viewer.id, list.id) : Promise.resolve(false),
    ]);

    return (
        <div className="space-y-6">
            <header className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">{list.name}</h1>
                            {list.visibility === 'private' && <Badge variant="outline">Private</Badge>}
                        </div>
                        <Link href={internalHref(`/users/${list.authorUsername}`)} className="text-muted-foreground flex items-center gap-2 text-sm hover:underline">
                            <UserAvatar name={list.authorName} avatar={list.authorAvatar} className="size-5" />
                            {list.authorName}
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        {viewer && !isOwner && (
                            <ListLikeButton listId={list.id} slug={list.slug} initialLiked={liked} initialCount={list.likesCount ?? 0} />
                        )}
                        {isOwner && <DeleteListButton listId={list.id} />}
                    </div>
                </div>
                {list.description && <p className="text-muted-foreground max-w-2xl text-sm">{list.description}</p>}
                <p className="text-muted-foreground text-sm">
                    {items.length} title{items.length === 1 ? '' : 's'} · {list.likesCount ?? 0} likes
                </p>
            </header>

            {items.length === 0 ? (
                <EmptyState
                    icon={Film}
                    title="This list is empty"
                    description={isOwner ? 'Open any movie or show and use “Add to list”.' : 'Nothing here yet.'}
                />
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {items.map((item) => (
                        <div key={item.id} className="group relative">
                            {isOwner && <RemoveListItemButton listId={list.id} itemId={item.id} slug={list.slug} />}
                            <MediaCard
                                mediaType={item.mediaType}
                                item={{
                                    id: item.tmdbId,
                                    title: item.title ?? `#${item.tmdbId}`,
                                    poster_path: item.posterPath,
                                    overview: item.overview ?? undefined,
                                    vote_average: item.voteAverage ?? undefined,
                                    release_date: item.releaseDate ?? undefined,
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
