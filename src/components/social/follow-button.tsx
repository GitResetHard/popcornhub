'use client';

import { UserCheck, UserPlus } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { toggleFollowAction } from '@/server/actions/social';

export function FollowButton({
    userId,
    username,
    initialFollowing,
}: {
    userId: number;
    username: string;
    initialFollowing: boolean;
}) {
    const [following, setFollowing] = useState(initialFollowing);
    const [isPending, startTransition] = useTransition();

    const onClick = () => {
        startTransition(async () => {
            const result = await toggleFollowAction({ userId, username });

            if (result.ok) {
                setFollowing(result.data.following);
                toast.success(result.data.following ? 'Following' : 'Unfollowed');
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <Button onClick={onClick} disabled={isPending} variant={following ? 'outline' : 'default'} size="sm">
            {following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
            {following ? 'Following' : 'Follow'}
        </Button>
    );
}
