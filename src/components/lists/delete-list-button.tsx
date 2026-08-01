'use client';

import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { deleteListAction } from '@/server/actions/social';

export function DeleteListButton({ listId }: { listId: number }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const onClick = () => {
        startTransition(async () => {
            const result = await deleteListAction({ listId });

            if (result.ok) {
                toast.success('List deleted');
                router.push('/lists');
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <Button onClick={onClick} disabled={isPending} variant="destructive" size="sm">
            <Trash2 className="size-4" />
            Delete
        </Button>
    );
}
