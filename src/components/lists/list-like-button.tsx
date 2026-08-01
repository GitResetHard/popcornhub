'use client';

import { Heart } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toggleListLikeAction } from '@/server/actions/social';

export function ListLikeButton({
    listId,
    slug,
    initialLiked,
    initialCount,
}: {
    listId: number;
    slug: string;
    initialLiked: boolean;
    initialCount: number;
}) {
    const [liked, setLiked] = useState(initialLiked);
    const [count, setCount] = useState(initialCount);
    const [isPending, startTransition] = useTransition();

    const onClick = () => {
        startTransition(async () => {
            const result = await toggleListLikeAction({ listId, slug });

            if (result.ok) {
                setLiked(result.data.liked);
                setCount((current) => current + (result.data.liked ? 1 : -1));
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <Button onClick={onClick} disabled={isPending} variant={liked ? 'default' : 'outline'} size="sm">
            <Heart className={cn('size-4', liked && 'fill-current')} />
            {count}
        </Button>
    );
}
