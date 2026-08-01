import { BookmarkCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/layout/empty-state';
import { ClipCard } from '@/components/media/clip-card';
import { getCurrentUser } from '@/server/auth/current-user';
import { getBookmarkedClips } from '@/server/services/clips';

export const metadata: Metadata = { title: 'Saved Clips', robots: { index: false, follow: false } };

export default async function SavedClipsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login?redirect=/clips/bookmarks');
    }

    const clips = await getBookmarkedClips(user.id, 30);

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                    <BookmarkCheck className="text-primary size-6" /> Saved Clips
                </h1>
                <p className="text-muted-foreground text-sm">Clips you have bookmarked to watch later.</p>
            </div>

            {clips.length === 0 ? (
                <EmptyState icon={BookmarkCheck} title="No saved clips" description="Bookmark clips to find them here." />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {clips.map((clip) => (
                        <ClipCard key={clip.id} clip={clip} />
                    ))}
                </div>
            )}
        </div>
    );
}
