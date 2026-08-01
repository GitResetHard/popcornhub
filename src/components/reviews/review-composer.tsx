'use client';

import { Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { StarInput } from '@/components/media/star-rating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitReviewAction } from '@/server/actions/social';

export function ReviewComposer({
    tmdbId,
    mediaType,
    existing,
}: {
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    existing?: { rating: number; title: string | null; content: string | null; hasSpoilers: boolean } | null;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const onSubmit = (formData: FormData) => {
        const rating = Number(formData.get('rating') ?? 0);

        if (!rating) {
            toast.error('Choose a rating before posting.');

            return;
        }

        startTransition(async () => {
            const result = await submitReviewAction({
                tmdbId,
                mediaType,
                rating,
                title: String(formData.get('title') ?? ''),
                content: String(formData.get('content') ?? ''),
                hasSpoilers: formData.get('has_spoilers') === 'on',
            });

            if (result.ok) {
                toast.success(result.data.created ? 'Review posted' : 'Review updated');
                router.refresh();
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <form action={onSubmit} className="bg-card space-y-4 rounded-xl border p-5">
            <div className="space-y-2">
                <Label>Your rating</Label>
                <StarInput defaultValue={existing?.rating ?? 0} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="review-title">Headline (optional)</Label>
                <Input id="review-title" name="title" defaultValue={existing?.title ?? ''} maxLength={255} placeholder="Sum it up in a line" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="review-content">Review (optional)</Label>
                <Textarea id="review-content" name="content" defaultValue={existing?.content ?? ''} rows={4} placeholder="What did you think?" />
            </div>

            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="has_spoilers" defaultChecked={existing?.hasSpoilers ?? false} className="size-4 rounded border" />
                This review contains spoilers
            </label>

            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {existing ? 'Update review' : 'Post review'}
            </Button>
        </form>
    );
}
