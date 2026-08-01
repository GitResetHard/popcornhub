import { Bell } from 'lucide-react';
import Link from 'next/link';
import { getUnreadNotificationCount } from '@/server/services/notifications';

/** Header bell with an unread badge; links to the notifications page. */
export async function NotificationBell({ userId }: { userId: number }) {
    const count = await getUnreadNotificationCount(userId);

    return (
        <Link
            href="/notifications"
            aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
            className="hover:bg-accent relative flex size-9 items-center justify-center rounded-md transition"
        >
            <Bell className="size-5" />
            {count > 0 && (
                <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </Link>
    );
}
