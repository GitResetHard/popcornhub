import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { sign, unsign } from '@/lib/security';

/**
 * Holds the user id between a successful password check and the two-factor challenge, in a
 * short-lived signed cookie, so no session row exists until the challenge is passed.
 */

const COOKIE_NAME = 'moviestrackr_2fa';
const TTL_SECONDS = 5 * 60;

export async function storePendingTwoFactor(userId: number): Promise<void> {
    const payload = `${userId}.${Date.now() + TTL_SECONDS * 1000}`;
    const cookieStore = await cookies();

    cookieStore.set(COOKIE_NAME, sign(payload), {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.APP_URL.startsWith('https://'),
        path: '/',
        maxAge: TTL_SECONDS,
    });
}

export async function peekPendingTwoFactor(): Promise<number | null> {
    const cookieStore = await cookies();
    const raw = cookieStore.get(COOKIE_NAME)?.value;

    if (!raw) {
        return null;
    }

    const unsigned = unsign(raw);

    if (!unsigned) {
        return null;
    }

    const [userId, expiresAt] = unsigned.split('.');

    if (!userId || !expiresAt || Number(expiresAt) < Date.now()) {
        return null;
    }

    return Number(userId);
}

/** Returns the pending user id and clears the cookie so a challenge cannot be replayed. */
export async function consumePendingTwoFactor(): Promise<number | null> {
    const userId = await peekPendingTwoFactor();
    const cookieStore = await cookies();

    cookieStore.delete(COOKIE_NAME);

    return userId;
}
