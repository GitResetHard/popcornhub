'use client';

import { ListPlus } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { addToListAction } from '@/server/actions/social';

export function AddToListMenu({
    tmdbId,
    mediaType,
    lists,
}: {
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    lists: Array<{ id: number; name: string; slug: string }>;
}) {
    const [isPending, startTransition] = useTransition();

    const add = (listId: number, slug: string, name: string) => {
        startTransition(async () => {
            const result = await addToListAction({ listId, tmdbId, mediaType, slug });

            if (result.ok) {
                toast.success(result.data.added ? `Added to ${name}` : `Already in ${name}`);
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isPending}>
                    <ListPlus className="size-4" />
                    Add to list
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Your lists</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {lists.length === 0 ? (
                    <DropdownMenuItem asChild>
                        <Link href="/lists">Create your first list</Link>
                    </DropdownMenuItem>
                ) : (
                    lists.map((list) => (
                        <DropdownMenuItem key={list.id} onSelect={() => add(list.id, list.slug, list.name)}>
                            {list.name}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
