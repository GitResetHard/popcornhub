import { randomBytes } from 'node:crypto';
import { and, eq, lt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { env } from '@/lib/env';

/**
 * Session store for logins performed in this app.
 *
 * A session is a random id stored in the `sessions` table and sent to the browser in an
 * httpOnly cookie. Every sensitive read resolves the user id from the row, never from the
 * cookie value alone.
 */

export type SessionRecord = {
    id: string;
    userId: number;
    twoFactorConfirmedAt: Date | null;
    impersonatorId: number | null;
};

function newSessionId(): string {
    return randomBytes(32).toString('hex');
}

function expiryFromNow(): Date {
    return new Date(Date.now() + env.SESSION_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
}

export type CreateSessionOptions = {
    ipAddress?: string | null;
    userAgent?: string | null;
    twoFactorConfirmed?: boolean;
    impersonatorId?: number | null;
};

export async function createSession(userId: number, options: CreateSessionOptions = {}): Promise<string> {
    const id = newSessionId();
    const now = new Date();

    await db.insert(sessions).values({
        id,
        userId,
        ipAddress: options.ipAddress ?? null,
        userAgent: options.userAgent ?? null,
        twoFactorConfirmedAt: options.twoFactorConfirmed ? now : null,
        impersonatorId: options.impersonatorId ?? null,
        lastActivityAt: now,
        expiresAt: expiryFromNow(),
        createdAt: now,
    });

    const cookieStore = await cookies();

    cookieStore.set(env.SESSION_COOKIE_NAME, id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.APP_URL.startsWith('https://'),
        path: '/',
        expires: expiryFromNow(),
    });

    return id;
}

export async function readSession(): Promise<SessionRecord | null> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
        return null;
    }

    const [row] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!row) {
        return null;
    }

    if (row.expiresAt.getTime() < Date.now()) {
        await db.delete(sessions).where(eq(sessions.id, sessionId));

        return null;
    }

    return {
        id: row.id,
        userId: row.userId,
        twoFactorConfirmedAt: row.twoFactorConfirmedAt,
        impersonatorId: row.impersonatorId,
    };
}

/** Extends the session lifetime, throttled to one write per minute so every view isn't an UPDATE. */
export async function touchSession(sessionId: string): Promise<void> {
    const oneMinuteAgo = new Date(Date.now() - 60_000);

    await db
        .update(sessions)
        .set({ lastActivityAt: new Date(), expiresAt: expiryFromNow() })
        .where(and(eq(sessions.id, sessionId), lt(sessions.lastActivityAt, oneMinuteAgo)));
}

export async function destroySession(): Promise<void> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;

    if (sessionId) {
        await db.delete(sessions).where(eq(sessions.id, sessionId));
    }

    cookieStore.delete(env.SESSION_COOKIE_NAME);
}

export async function confirmTwoFactor(sessionId: string): Promise<void> {
    await db.update(sessions).set({ twoFactorConfirmedAt: new Date() }).where(eq(sessions.id, sessionId));
}

export async function pruneExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
