'use client';

import { X } from 'lucide-react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { removeFromListAction } from '@/server/actions/social';

export function RemoveListItemButton({ listId, itemId, slug }: { listId: number; itemId: number; slug: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const onClick = () => {
        startTransition(async () => {
            const result = await removeFromListAction({ listId, itemId, slug });

            if (result.ok) {
                toast.success('Removed from list');
                router.refresh();
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isPending}
            aria-label="Remove from list"
            className="bg-black/70 text-white absolute top-1.5 right-1.5 z-10 flex size-7 items-center justify-center rounded-full opacity-0 transition hover:bg-black/90 group-hover:opacity-100 disabled:opacity-40"
        >
            <X className="size-4" />
        </button>
    );
}
