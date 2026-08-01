'use client';

import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { deleteReviewAction } from '@/server/actions/social';

export function DeleteReviewButton({ reviewId, tmdbId, mediaType }: { reviewId: number; tmdbId: number; mediaType: 'movie' | 'tv' }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const onClick = () => {
        startTransition(async () => {
            const result = await deleteReviewAction({ reviewId, tmdbId, mediaType });

            if (result.ok) {
                toast.success('Review deleted');
                router.refresh();
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <Button onClick={onClick} disabled={isPending} variant="ghost" size="icon" aria-label="Delete your review">
            <Trash2 className="size-4" />
        </Button>
    );
}
