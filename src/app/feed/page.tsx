import { Activity, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/layout/empty-state';
import { ActivityItem } from '@/components/social/activity-item';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/server/auth/current-user';
import { getFeed } from '@/server/services/feed';

export const metadata: Metadata = { title: 'Your Feed', robots: { index: false, follow: false } };

export default async function FeedPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login?redirect=/feed');
    }

    const feed = await getFeed(user.id);

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                    <Activity className="text-primary size-6" /> Feed
                </h1>
                <Button asChild variant="outline" size="sm">
                    <Link href="/leaderboard">Find members</Link>
                </Button>
            </div>

            {feed.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Your feed is quiet"
                    description="Follow other members and track titles to see activity here."
                    action={
                        <Button asChild>
                            <Link href="/leaderboard">Discover members</Link>
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-3">
                    {feed.map((item) => (
                        <ActivityItem
                            key={item.id}
                            item={{
                                id: item.id,
                                authorName: item.authorName,
                                authorUsername: item.authorUsername,
                                authorAvatar: item.authorAvatar,
                                type: item.type,
                                tmdbId: item.tmdbId,
                                mediaType: item.mediaType,
                                metadata: item.metadata,
                                createdAt: item.createdAt,
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
