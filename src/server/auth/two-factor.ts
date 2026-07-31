import { createHash, timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyTotpCode } from '@/lib/security';

/** Two-factor verification against this app's own plaintext TOTP secret and recovery codes. */

export type TwoFactorChallengeResult = { ok: true } | { ok: false; error: string };

export function hasEnabledTwoFactor(user: { twoFactorSecret: string | null; twoFactorConfirmedAt: Date | null }): boolean {
    return Boolean(user.twoFactorSecret && user.twoFactorConfirmedAt);
}

export async function attemptTwoFactorChallenge(
    userId: number,
    input: { code?: string; recoveryCode?: string },
): Promise<TwoFactorChallengeResult> {
    const [user] = await db
        .select({
            id: users.id,
            twoFactorSecret: users.twoFactorSecret,
            twoFactorRecoveryCodes: users.twoFactorRecoveryCodes,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) {
        return { ok: false, error: 'The provided two factor authentication code was invalid.' };
    }

    if (input.recoveryCode && user.twoFactorRecoveryCodes) {
        const consumed = await consumeRecoveryCode(user.id, user.twoFactorRecoveryCodes, input.recoveryCode);

        return consumed ? { ok: true } : { ok: false, error: 'The provided recovery code was invalid.' };
    }

    if (input.code && user.twoFactorSecret && verifyTotpCode(user.twoFactorSecret, input.code)) {
        return { ok: true };
    }

    return { ok: false, error: 'The provided two factor authentication code was invalid.' };
}

/** Consumes a recovery code so it cannot be reused. */
async function consumeRecoveryCode(userId: number, codes: string[], code: string): Promise<boolean> {
    const submitted = code.replace(/\s/g, '');
    const remaining = codes.filter((stored) => !constantTimeEquals(stored, submitted));

    if (remaining.length === codes.length) {
        return false;
    }

    await db.update(users).set({ twoFactorRecoveryCodes: remaining }).where(eq(users.id, userId));

    return true;
}

function constantTimeEquals(a: string, b: string): boolean {
    const left = createHash('sha256').update(a).digest();
    const right = createHash('sha256').update(b).digest();

    return timingSafeEqual(left, right);
}
