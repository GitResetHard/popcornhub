'use client';

import { CheckCheck } from 'lucide-react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { markNotificationsReadAction } from '@/server/actions/social';

export function MarkReadButton() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const onClick = () => {
        startTransition(async () => {
            const result = await markNotificationsReadAction();

            if (result.ok) {
                router.refresh();
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <Button onClick={onClick} disabled={isPending} variant="outline" size="sm">
            <CheckCheck className="size-4" />
            Mark all read
        </Button>
    );
}
