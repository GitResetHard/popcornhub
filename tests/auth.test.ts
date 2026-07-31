import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cookieJar } from './helpers/cookies';

vi.mock('next/headers', () => ({
    cookies: async () => cookieJar,
    headers: async () => ({ get: (name: string) => (name.toLowerCase() === 'user-agent' ? 'vitest' : null) }),
}));

const { db, sessions, users } = await import('@/db/schema').then(async (schema) => ({ ...schema, db: (await import('@/db')).db }));
const { env } = await import('@/lib/env');
const { generateRecoveryCodes, generateTotpSecret, verifyPassword } = await import('@/lib/security');
const { attemptLogin, findOrCreateGoogleUser, generateUniqueUsername, registerUser } = await import('@/server/auth/credentials');
const { getAuthState, requireAdmin, requireUser } = await import('@/server/auth/current-user');
const { createSession, destroySession, readSession } = await import('@/server/auth/session');
const { attemptTwoFactorChallenge, hasEnabledTwoFactor } = await import('@/server/auth/two-factor');
const { closeDatabase, createTestUser, resetDatabase, seedGamificationData } = await import('./helpers/db');

const TOTP_SECRET = generateTotpSecret();

beforeAll(async () => {
    await resetDatabase();
    await seedGamificationData();
});

afterAll(async () => {
    await closeDatabase();
});

beforeEach(() => {
    cookieJar.clear();
});

async function emailFor(userId: number): Promise<string | null> {
    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));

    return user?.email ?? null;
}

describe('attemptLogin', () => {
    it('accepts a correct password', async () => {
        const userId = await createTestUser({ password: 'correct-horse' });

        expect(await attemptLogin((await emailFor(userId)) ?? '', 'correct-horse')).toEqual({ status: 'success', userId });
    });

    it('rejects a wrong password', async () => {
        const userId = await createTestUser({ password: 'correct-horse' });

        expect(await attemptLogin((await emailFor(userId)) ?? '', 'wrong')).toEqual({ status: 'invalid' });
    });

    it('rejects an unknown email', async () => {
        expect(await attemptLogin('nobody@example.test', 'whatever')).toEqual({ status: 'invalid' });
    });

    it('matches on a lowercased email', async () => {
        const userId = await createTestUser({ email: 'mixed@example.test', password: 'secret' });

        expect(await attemptLogin('MIXED@EXAMPLE.TEST', 'secret')).toEqual({ status: 'success', userId });
    });

    it('requires a second factor when two-factor is enabled', async () => {
        const userId = await createTestUser({
            password: 'secret',
            twoFactorSecret: TOTP_SECRET,
            twoFactorConfirmedAt: new Date(),
        });

        expect(await attemptLogin((await emailFor(userId)) ?? '', 'secret')).toEqual({ status: 'two_factor_required', userId });
    });

    it('rejects a banned account', async () => {
        const userId = await createTestUser({ password: 'secret', bannedAt: new Date() });

        expect(await attemptLogin((await emailFor(userId)) ?? '', 'secret')).toEqual({ status: 'banned', userId });
    });
});

describe('registerUser', () => {
    it('creates an account and normalises the username and email', async () => {
        const result = await registerUser({
            name: 'Ada Lovelace',
            username: 'AdaLovelace',
            email: 'Ada@Example.test',
            password: 'analytical-engine',
        });

        expect(result.ok).toBe(true);

        if (!result.ok) return;

        const [user] = await db.select().from(users).where(eq(users.id, result.userId));

        expect(user).toMatchObject({ name: 'Ada Lovelace', username: 'adalovelace', email: 'ada@example.test' });
    });

    it('hashes the password with scrypt, never storing plaintext', async () => {
        const result = await registerUser({
            name: 'Grace Hopper',
            username: 'gracehopper',
            email: 'grace@example.test',
            password: 'super-secret-value',
        });

        expect(result.ok).toBe(true);

        if (!result.ok) return;

        const [user] = await db.select().from(users).where(eq(users.id, result.userId));

        expect(user?.passwordHash.startsWith('scrypt:')).toBe(true);
        expect(verifyPassword('super-secret-value', user?.passwordHash)).toBe(true);
        expect(JSON.stringify(user)).not.toContain('super-secret-value');
    });

    it('rejects a reserved username', async () => {
        const result = await registerUser({
            name: 'Admin',
            username: 'admin',
            email: 'admin@example.test',
            password: 'password123',
        });

        expect(result).toEqual({ ok: false, errors: { username: 'This username is not available.' } });
    });

    it('rejects usernames with unsupported characters', async () => {
        const result = await registerUser({
            name: 'Dots',
            username: 'has.dots',
            email: 'dots@example.test',
            password: 'password123',
        });

        expect(result.ok).toBe(false);

        if (result.ok) return;

        expect(result.errors.username).toMatch(/letters, numbers, dashes and underscores/);
    });

    it('rejects a duplicate email and username', async () => {
        await registerUser({ name: 'First', username: 'takenname', email: 'taken@example.test', password: 'password123' });

        expect(
            await registerUser({ name: 'Second', username: 'takenname', email: 'taken@example.test', password: 'password123' }),
        ).toEqual({
            ok: false,
            errors: { email: 'The email has already been taken.', username: 'The username has already been taken.' },
        });
    });

    it('rejects a short password', async () => {
        const result = await registerUser({ name: 'Shorty', username: 'shorty', email: 'shorty@example.test', password: 'short' });

        expect(result.ok).toBe(false);

        if (result.ok) return;

        expect(result.errors.password).toMatch(/at least 8 characters/);
    });
});

describe('session lifecycle', () => {
    it('issues a cookie-backed session that resolves to the user', async () => {
        const userId = await createTestUser();
        const sessionId = await createSession(userId);

        expect(cookieJar.get(env.SESSION_COOKIE_NAME)?.value).toBe(sessionId);
        expect(await readSession()).toMatchObject({ id: sessionId, userId });
        expect((await getAuthState()).user?.id).toBe(userId);
    });

    it('clears the cookie and the row on sign out', async () => {
        const userId = await createTestUser();
        const sessionId = await createSession(userId);

        await destroySession();

        expect(cookieJar.get(env.SESSION_COOKIE_NAME)).toBeUndefined();
        expect(await db.select().from(sessions).where(eq(sessions.id, sessionId))).toHaveLength(0);
    });

    it('treats an expired session as signed out and removes it', async () => {
        const userId = await createTestUser();
        const sessionId = await createSession(userId);

        await db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(sessions.id, sessionId));

        expect(await readSession()).toBeNull();
        expect(await db.select().from(sessions).where(eq(sessions.id, sessionId))).toHaveLength(0);
    });

    it('ignores an unknown session id', async () => {
        cookieJar.set(env.SESSION_COOKIE_NAME, 'does-not-exist');

        expect(await readSession()).toBeNull();
    });

    it('records the impersonating admin', async () => {
        const userId = await createTestUser();
        const adminId = await createTestUser({ isAdmin: true });

        await createSession(userId, { impersonatorId: adminId });

        expect((await getAuthState()).impersonating).toBe(true);
    });
});

describe('authorization guards', () => {
    it('throws when no user is signed in', async () => {
        await expect(requireUser()).rejects.toMatchObject({ name: 'AuthenticationRequiredError' });
    });

    it('allows an admin through requireAdmin', async () => {
        const userId = await createTestUser({ isAdmin: true });
        await createSession(userId);

        expect((await requireAdmin()).id).toBe(userId);
    });

    it('rejects a non-admin from requireAdmin', async () => {
        await createSession(await createTestUser());

        await expect(requireAdmin()).rejects.toMatchObject({ name: 'AdminRequiredError' });
    });
});

describe('two-factor authentication', () => {
    it('accepts a valid TOTP code', async () => {
        const OTPAuth = await import('otpauth');
        const userId = await createTestUser({ twoFactorSecret: TOTP_SECRET, twoFactorConfirmedAt: new Date() });

        const code = new OTPAuth.TOTP({
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(TOTP_SECRET),
        }).generate();

        expect(await attemptTwoFactorChallenge(userId, { code })).toEqual({ ok: true });
    });

    it('rejects an incorrect TOTP code', async () => {
        const userId = await createTestUser({ twoFactorSecret: TOTP_SECRET, twoFactorConfirmedAt: new Date() });

        expect(await attemptTwoFactorChallenge(userId, { code: '000000' })).toEqual({
            ok: false,
            error: 'The provided two factor authentication code was invalid.',
        });
    });

    it('consumes a recovery code so it cannot be reused', async () => {
        const codes = generateRecoveryCodes(2);
        const userId = await createTestUser({
            twoFactorSecret: TOTP_SECRET,
            twoFactorRecoveryCodes: codes,
            twoFactorConfirmedAt: new Date(),
        });

        expect(await attemptTwoFactorChallenge(userId, { recoveryCode: codes[0] })).toEqual({ ok: true });
        expect(await attemptTwoFactorChallenge(userId, { recoveryCode: codes[0] })).toEqual({
            ok: false,
            error: 'The provided recovery code was invalid.',
        });
    });

    it('requires both a secret and a confirmation timestamp to be considered enabled', () => {
        expect(hasEnabledTwoFactor({ twoFactorSecret: TOTP_SECRET, twoFactorConfirmedAt: new Date() })).toBe(true);
        expect(hasEnabledTwoFactor({ twoFactorSecret: TOTP_SECRET, twoFactorConfirmedAt: null })).toBe(false);
        expect(hasEnabledTwoFactor({ twoFactorSecret: null, twoFactorConfirmedAt: new Date() })).toBe(false);
    });
});

describe('Google sign-in', () => {
    it('signs in a returning user matched on google_id', async () => {
        const userId = await createTestUser({ email: 'returning@example.test' });
        await db.update(users).set({ googleId: 'google-123' }).where(eq(users.id, userId));

        expect(await findOrCreateGoogleUser({ id: 'google-123', email: 'different@example.test', name: 'Returning', avatar: null })).toBe(
            userId,
        );
    });

    it('links an existing account matched on email and marks it verified', async () => {
        const userId = await createTestUser({ email: 'link@example.test', emailVerified: false });

        expect(
            await findOrCreateGoogleUser({ id: 'google-link', email: 'link@example.test', name: 'Linked', avatar: null }),
        ).toBe(userId);

        const [user] = await db.select().from(users).where(eq(users.id, userId));

        expect(user?.googleId).toBe('google-link');
        expect(user?.emailVerifiedAt).toBeInstanceOf(Date);
    });

    it('creates a verified account for a first-time Google user', async () => {
        const resolved = await findOrCreateGoogleUser({
            id: 'google-new',
            email: 'brand-new@example.test',
            name: 'Brand New',
            avatar: 'https://example.test/avatar.jpg',
        });

        const [user] = await db.select().from(users).where(eq(users.id, resolved));

        expect(user).toMatchObject({ email: 'brand-new@example.test', googleId: 'google-new' });
        expect(user?.emailVerifiedAt).toBeInstanceOf(Date);
        expect(user?.passwordHash.startsWith('scrypt:')).toBe(true);
    });

    it('suffixes a generated username until it is unique', async () => {
        await createTestUser({ username: 'ada_lovelace' });

        expect(await generateUniqueUsername('Ada Lovelace')).toBe('ada_lovelace_1');
    });

    it('falls back to "user" when a name yields too few usable characters', async () => {
        expect(await generateUniqueUsername('!!')).toBe('user');
        expect(await generateUniqueUsername(null)).toMatch(/^user(_\d+)?$/);
    });
});
