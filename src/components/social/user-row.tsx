import Link from 'next/link';
import type { ReactNode } from 'react';
import { UserAvatar } from '@/components/layout/user-avatar';
import { internalHref } from '@/lib/routes';

/** A single member row for follower/following and leaderboard listings. */
export function UserRow({
    name,
    username,
    avatar,
    subtitle,
    leading,
    trailing,
}: {
    name: string;
    username: string;
    avatar: string | null;
    subtitle?: string;
    leading?: ReactNode;
    trailing?: ReactNode;
}) {
    return (
        <div className="bg-card flex items-center gap-3 rounded-xl border p-3">
            {leading}
            <Link href={internalHref(`/users/${username}`)}>
                <UserAvatar name={name} avatar={avatar} className="size-10" />
            </Link>
            <div className="min-w-0 flex-1">
                <Link href={internalHref(`/users/${username}`)} className="block truncate text-sm font-semibold hover:underline">
                    {name}
                </Link>
                <p className="text-muted-foreground truncate text-xs">{subtitle ?? `@${username}`}</p>
            </div>
            {trailing}
        </div>
    );
}
