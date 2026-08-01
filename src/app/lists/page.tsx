import { List, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CreateListForm } from '@/components/lists/create-list-form';
import { EmptyState } from '@/components/layout/empty-state';
import { SectionHeader } from '@/components/layout/section-header';
import { UserAvatar } from '@/components/layout/user-avatar';
import { Badge } from '@/components/ui/badge';
import { internalHref } from '@/lib/routes';
import { getCurrentUser } from '@/server/auth/current-user';
import { getPublicLists, getUserLists, type CustomListRow, type ListWithAuthor } from '@/server/services/lists';

export const metadata: Metadata = { title: 'Lists' };

function ListCard({ list, author }: { list: CustomListRow | ListWithAuthor; author?: ListWithAuthor }) {
    return (
        <Link href={internalHref(`/lists/${list.slug}`)} className="bg-card hover:border-primary/50 block rounded-xl border p-5 transition">
            <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-semibold">{list.name}</h3>
                {list.visibility === 'private' && <Badge variant="outline">Private</Badge>}
            </div>
            {list.description && <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{list.description}</p>}
            <div className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
                {author && (
                    <span className="flex items-center gap-1.5">
                        <UserAvatar name={author.authorName} avatar={author.authorAvatar} className="size-5" />
                        {author.authorName}
                    </span>
                )}
                <span>{list.itemsCount ?? 0} titles</span>
                <span>{list.likesCount ?? 0} likes</span>
            </div>
        </Link>
    );
}

export default async function ListsPage() {
    const user = await getCurrentUser();
    const [myLists, publicLists] = await Promise.all([user ? getUserLists(user.id) : Promise.resolve([]), getPublicLists(24)]);
    const discover = publicLists.filter((list) => list.userId !== user?.id);

    return (
        <div className="space-y-10">
            <div className="space-y-1">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                    <List className="text-primary size-6" /> Lists
                </h1>
                <p className="text-muted-foreground text-sm">Curate collections of titles and share them with the community.</p>
            </div>

            {user ? (
                <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
                    <section className="space-y-3">
                        <SectionHeader title="Your lists" />
                        {myLists.length === 0 ? (
                            <EmptyState icon={Plus} title="No lists yet" description="Create your first list to get started." />
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {myLists.map((list) => (
                                    <ListCard key={list.id} list={list} />
                                ))}
                            </div>
                        )}
                    </section>
                    <aside className="space-y-3">
                        <SectionHeader title="New list" />
                        <CreateListForm />
                    </aside>
                </div>
            ) : (
                <EmptyState
                    icon={List}
                    title="Sign in to build lists"
                    description="Create an account to curate and share your own lists."
                    action={
                        <Link href="/login" className="text-primary text-sm hover:underline">
                            Log in
                        </Link>
                    }
                />
            )}

            <section className="space-y-3">
                <SectionHeader title="Discover lists" description="Popular public lists from the community." />
                {discover.length === 0 ? (
                    <EmptyState icon={List} title="No public lists yet" />
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {discover.map((list) => (
                            <ListCard key={list.id} list={list} author={list} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
