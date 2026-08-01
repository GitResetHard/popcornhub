'use client';

import { Loader2, Plus } from 'lucide-react';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { internalHref } from '@/lib/routes';
import { createListAction, type ListFormState } from '@/server/actions/social';

export function CreateListForm() {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState<ListFormState, FormData>(createListAction, {});

    useEffect(() => {
        if (state.slug) {
            router.push(internalHref(`/lists/${state.slug}`));
        }
    }, [state.slug, router]);

    return (
        <form action={formAction} className="bg-card space-y-4 rounded-xl border p-5">
            <div className="space-y-2">
                <Label htmlFor="list-name">List name</Label>
                <Input id="list-name" name="name" required maxLength={255} placeholder="e.g. Cozy autumn watches" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="list-description">Description (optional)</Label>
                <Textarea id="list-description" name="description" rows={3} placeholder="What ties these titles together?" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="list-visibility">Visibility</Label>
                <select
                    id="list-visibility"
                    name="visibility"
                    defaultValue="public"
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                >
                    <option value="public">Public — anyone can view</option>
                    <option value="private">Private — only you</option>
                </select>
            </div>

            {state.error && (
                <p className="text-danger text-sm" role="alert">
                    {state.error}
                </p>
            )}

            <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Create list
            </Button>
        </form>
    );
}
