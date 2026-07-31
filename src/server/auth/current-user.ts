import { and, count, eq, isNull } from 'drizzle-orm';
import { cache } from 'react';
import { db } from '@/db';
import { notifications, users } from '@/db/schema';
import { env } from '@/lib/env';
import type { NotificationPreferences } from '@/db/schema';
import { readSession, touchSession } from './session';

/**
 * Resolves the authenticated user for the current request and shapes it the way pages expect.
 */

export const DEFAULT_NOTIFICATION_PREFERENCES: Required<NotificationPreferences> = {
    follows: true,
    review_replies: true,
    review_reactions: true,
    list_comments: true,
    list_collaborations: true,
};

export type AuthUser = {
    id: number;
    name: string;
    username: string;
    email: string;
    avatar: string | null;
    bio: string | null;
    allow_direct_messages: boolean;
    show_presence: boolean;
    notification_preferences: Required<NotificationPreferences>;
    email_verified_at: string | null;
    created_at: string | null;
    is_admin: boolean;
    is_banned: boolean;
    unread_notifications_count: number;
    onboarded_at: string | null;
};

export type AuthState = {
    user: AuthUser | null;
    impersonating: boolean;
};

export function resolveAvatarUrl(avatar: string | null): string | null {
    if (!avatar) {
        return null;
    }

    if (avatar.startsWith('http')) {
        return avatar;
    }

    const base = env.UPLOADS_URL;

    return base ? `${base.replace(/\/$/, '')}/${avatar.replace(/^\//, '')}` : avatar;
}

function toIso(value: Date | null): string | null {
    return value ? value.toISOString() : null;
}

async function unreadNotificationCount(userId: number): Promise<number> {
    const [row] = await db
        .select({ value: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    return row?.value ?? 0;
}

/**
 * `cache` deduplicates the work within one request, so a layout and the page it renders share
 * a single set of queries.
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
    const session = await readSession();

    if (!session) {
        return { user: null, impersonating: false };
    }

    await touchSession(session.id);

    const [row] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);

    if (!row) {
        return { user: null, impersonating: false };
    }

    const unreadNotifications = await unreadNotificationCount(row.id);

    const user: AuthUser = {
        id: row.id,
        name: row.name,
        username: row.username,
        email: row.email,
        avatar: resolveAvatarUrl(row.avatar),
        bio: row.bio,
        allow_direct_messages: row.allowDirectMessages ?? true,
        show_presence: row.showPresence ?? true,
        notification_preferences: { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(row.notificationPreferences ?? {}) },
        email_verified_at: toIso(row.emailVerifiedAt),
        created_at: toIso(row.createdAt),
        is_admin: row.isAdmin ?? false,
        is_banned: row.bannedAt != null,
        unread_notifications_count: unreadNotifications,
        onboarded_at: toIso(row.onboardedAt),
    };

    return { user, impersonating: session.impersonatorId != null };
});

export async function getCurrentUser(): Promise<AuthUser | null> {
    return (await getAuthState()).user;
}

export async function requireUser(): Promise<AuthUser> {
    const user = await getCurrentUser();

    if (!user) {
        throw new AuthenticationRequiredError();
    }

    return user;
}

export async function requireVerifiedUser(): Promise<AuthUser> {
    const user = await requireUser();

    if (!user.email_verified_at) {
        throw new EmailVerificationRequiredError();
    }

    return user;
}

export async function requireAdmin(): Promise<AuthUser> {
    const user = await requireUser();

    if (!user.is_admin) {
        throw new AdminRequiredError();
    }

    return user;
}

export class AuthenticationRequiredError extends Error {
    constructor() {
        super('Authentication required.');
        this.name = 'AuthenticationRequiredError';
    }
}

export class EmailVerificationRequiredError extends Error {
    constructor() {
        super('Email verification required.');
        this.name = 'EmailVerificationRequiredError';
    }
}

export class AdminRequiredError extends Error {
    constructor() {
        super('Administrator access required.');
        this.name = 'AdminRequiredError';
    }
}
