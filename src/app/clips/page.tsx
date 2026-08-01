import { Clapperboard } from 'lucide-react';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/layout/empty-state';
import { ClipCard } from '@/components/media/clip-card';
import { getPublishedClips } from '@/server/services/clips';

export const metadata: Metadata = { title: 'Clips' };

export default async function ClipsPage() {
    const clips = await getPublishedClips(30);

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                    <Clapperboard className="text-primary size-6" /> Clips
                </h1>
                <p className="text-muted-foreground text-sm">Short community clips from movies and shows.</p>
            </div>

            {clips.length === 0 ? (
                <EmptyState icon={Clapperboard} title="No clips yet" description="Published community clips will appear here." />
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
