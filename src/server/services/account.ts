import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, type NotificationPreferences } from '@/db/schema';
import { generateRecoveryCodes, generateTotpSecret, hashPassword, totpAuthUri, verifyPassword, verifyTotpCode } from '@/lib/security';

/** Account settings: profile, privacy, notifications, password, and two-factor management. */

export type ProfileUpdate = { name?: string; bio?: string | null; avatar?: string | null };

export async function updateProfile(userId: number, update: ProfileUpdate): Promise<void> {
    await db.update(users).set({ ...update, updatedAt: new Date() }).where(eq(users.id, userId));
}

export type PrivacyUpdate = { allowDirectMessages: boolean; showPresence: boolean };

export async function updatePrivacy(userId: number, update: PrivacyUpdate): Promise<void> {
    await db.update(users).set({ ...update, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateNotificationPreferences(userId: number, preferences: NotificationPreferences): Promise<void> {
    await db.update(users).set({ notificationPreferences: preferences, updatedAt: new Date() }).where(eq(users.id, userId));
}

export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<ChangePasswordResult> {
    const [user] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
        return { ok: false, error: 'Your current password is incorrect.' };
    }

    if (newPassword.length < 8) {
        return { ok: false, error: 'The new password must be at least 8 characters.' };
    }

    await db.update(users).set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() }).where(eq(users.id, userId));

    return { ok: true };
}

export type TwoFactorSetup = { secret: string; uri: string; recoveryCodes: string[] };

/** Begins enrolment: stores an unconfirmed secret + recovery codes and returns the otpauth URI. */
export async function beginTwoFactorSetup(userId: number, accountLabel: string): Promise<TwoFactorSetup> {
    const secret = generateTotpSecret();
    const recoveryCodes = generateRecoveryCodes();

    await db
        .update(users)
        .set({ twoFactorSecret: secret, twoFactorRecoveryCodes: recoveryCodes, twoFactorConfirmedAt: null, updatedAt: new Date() })
        .where(eq(users.id, userId));

    return { secret, uri: totpAuthUri(secret, accountLabel), recoveryCodes };
}

export async function confirmTwoFactorSetup(userId: number, code: string): Promise<boolean> {
    const [user] = await db.select({ secret: users.twoFactorSecret }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user?.secret || !verifyTotpCode(user.secret, code)) {
        return false;
    }

    await db.update(users).set({ twoFactorConfirmedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));

    return true;
}

export async function disableTwoFactor(userId: number): Promise<void> {
    await db
        .update(users)
        .set({ twoFactorSecret: null, twoFactorRecoveryCodes: null, twoFactorConfirmedAt: null, updatedAt: new Date() })
        .where(eq(users.id, userId));
}

export async function getTwoFactorState(userId: number): Promise<{ enabled: boolean; pending: boolean }> {
    const [user] = await db
        .select({ secret: users.twoFactorSecret, confirmedAt: users.twoFactorConfirmedAt })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    return { enabled: Boolean(user?.secret && user?.confirmedAt), pending: Boolean(user?.secret && !user?.confirmedAt) };
}
