import { randomUUID } from 'node:crypto';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { notifications } from '@/db/schema';

/**
 * In-app notifications. Rows are keyed by a uuid and carry a free-form `data` payload so a
 * single table serves follows, review replies, list activity, and so on.
 */

export type NotificationType = 'followed' | 'review_reply' | 'review_reaction' | 'list_comment' | 'list_like';

export type NotificationView = {
    id: string;
    type: string;
    data: Record<string, unknown>;
    readAt: string | null;
    createdAt: string | null;
};

export async function createNotification(userId: number, type: NotificationType, data: Record<string, unknown>): Promise<void> {
    await db.insert(notifications).values({ id: randomUUID(), userId, type, data, createdAt: new Date() });
}

export async function getNotifications(userId: number, limit = 30): Promise<NotificationView[]> {
    const rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

    return rows.map((row) => ({
        id: row.id,
        type: row.type,
        data: row.data ?? {},
        readAt: row.readAt ? row.readAt.toISOString() : null,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    }));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
    const [row] = await db
        .select({ value: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    return row?.value ?? 0;
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
    await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
