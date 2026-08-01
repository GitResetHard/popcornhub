import { formatDistanceToNow } from 'date-fns';
import { Bell, Heart, MessageSquare, UserPlus } from 'lucide-react';
import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/layout/empty-state';
import { MarkReadButton } from '@/components/notifications/mark-read-button';
import { cn } from '@/lib/utils';
import { getCurrentUser } from '@/server/auth/current-user';
import { getNotifications, type NotificationView } from '@/server/services/notifications';

export const metadata: Metadata = { title: 'Notifications', robots: { index: false, follow: false } };

const ICONS: Record<string, LucideIcon> = {
    followed: UserPlus,
    list_like: Heart,
    review_reply: MessageSquare,
    review_reaction: Heart,
    list_comment: MessageSquare,
};

function describe(notification: NotificationView): string {
    const name = typeof notification.data.name === 'string' ? notification.data.name : 'Someone';

    switch (notification.type) {
        case 'followed':
            return `${name} started following you.`;
        case 'list_like':
            return `Someone liked your list "${notification.data.name ?? ''}".`;
        default:
            return 'You have a new notification.';
    }
}

export default async function NotificationsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login?redirect=/notifications');
    }

    const notifications = await getNotifications(user.id);

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                    <Bell className="text-primary size-6" /> Notifications
                </h1>
                {notifications.some((notification) => !notification.readAt) && <MarkReadButton />}
            </div>

            {notifications.length === 0 ? (
                <EmptyState icon={Bell} title="You're all caught up" description="New followers and interactions will show up here." />
            ) : (
                <ul className="space-y-2">
                    {notifications.map((notification) => {
                        const Icon = ICONS[notification.type] ?? Bell;

                        return (
                            <li
                                key={notification.id}
                                className={cn('bg-card flex items-start gap-3 rounded-xl border p-4', !notification.readAt && 'border-primary/40')}
                            >
                                <div className="bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
                                    <Icon className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm">{describe(notification)}</p>
                                    {notification.createdAt && (
                                        <p className="text-muted-foreground mt-0.5 text-xs">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>
                                    )}
                                </div>
                                {!notification.readAt && <span className="bg-primary mt-2 size-2 shrink-0 rounded-full" />}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
