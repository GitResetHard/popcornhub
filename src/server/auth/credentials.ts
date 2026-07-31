import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword, verifyPassword } from '@/lib/security';
import { isReservedUsername } from '@/lib/validation/reserved-usernames';

/** Credential checks and account creation. */

export type LoginAttemptResult =
    | { status: 'success'; userId: number }
    | { status: 'two_factor_required'; userId: number }
    | { status: 'invalid' }
    | { status: 'banned'; userId: number };

const UNMATCHABLE_HASH = 'scrypt:16384:00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

export async function attemptLogin(email: string, password: string): Promise<LoginAttemptResult> {
    const [user] = await db
        .select({
            id: users.id,
            passwordHash: users.passwordHash,
            twoFactorSecret: users.twoFactorSecret,
            twoFactorConfirmedAt: users.twoFactorConfirmedAt,
            bannedAt: users.bannedAt,
        })
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

    if (!user) {
        // Match the timing of a real failed check so response time reveals nothing.
        verifyPassword(password, UNMATCHABLE_HASH);

        return { status: 'invalid' };
    }

    if (!verifyPassword(password, user.passwordHash)) {
        return { status: 'invalid' };
    }

    if (user.bannedAt) {
        return { status: 'banned', userId: user.id };
    }

    if (user.twoFactorSecret && user.twoFactorConfirmedAt) {
        return { status: 'two_factor_required', userId: user.id };
    }

    return { status: 'success', userId: user.id };
}

export type RegistrationInput = {
    name: string;
    username: string;
    email: string;
    password: string;
};

export type RegistrationResult = { ok: true; userId: number } | { ok: false; errors: Record<string, string> };

export async function registerUser(input: RegistrationInput): Promise<RegistrationResult> {
    const errors: Record<string, string> = {};
    const username = input.username.trim().toLowerCase();
    const email = input.email.trim().toLowerCase();

    if (!input.name.trim()) {
        errors.name = 'The name field is required.';
    } else if (input.name.length > 255) {
        errors.name = 'The name field must not be greater than 255 characters.';
    }

    if (username.length < 3 || username.length > 30) {
        errors.username = 'The username field must be between 3 and 30 characters.';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.username = 'Username may only contain letters, numbers, dashes and underscores.';
    } else if (isReservedUsername(username)) {
        errors.username = 'This username is not available.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'The email field must be a valid email address.';
    }

    if (input.password.length < 8) {
        errors.password = 'The password field must be at least 8 characters.';
    }

    if (Object.keys(errors).length === 0) {
        const [existingEmail] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

        if (existingEmail) {
            errors.email = 'The email has already been taken.';
        }

        const [existingUsername] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);

        if (existingUsername) {
            errors.username = 'The username has already been taken.';
        }
    }

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
    }

    const now = new Date();
    const [result] = await db
        .insert(users)
        .values({
            name: input.name.trim(),
            username,
            email,
            passwordHash: hashPassword(input.password),
            createdAt: now,
            updatedAt: now,
        })
        .returning({ id: users.id });

    if (!result) {
        throw new Error('Failed to create the user account');
    }

    return { ok: true, userId: result.id };
}

export async function findOrCreateGoogleUser(profile: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
}): Promise<number> {
    const [byGoogleId] = await db.select({ id: users.id }).from(users).where(eq(users.googleId, profile.id)).limit(1);

    if (byGoogleId) {
        return byGoogleId.id;
    }

    const email = profile.email.toLowerCase();
    const [byEmail] = await db
        .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (byEmail) {
        await db
            .update(users)
            .set({ googleId: profile.id, emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(), updatedAt: new Date() })
            .where(eq(users.id, byEmail.id));

        return byEmail.id;
    }

    const now = new Date();
    const [result] = await db
        .insert(users)
        .values({
            name: profile.name,
            username: await generateUniqueUsername(profile.name),
            email,
            googleId: profile.id,
            avatar: profile.avatar,
            passwordHash: hashPassword(crypto.randomUUID() + crypto.randomUUID()),
            emailVerifiedAt: now,
            createdAt: now,
            updatedAt: now,
        })
        .returning({ id: users.id });

    if (!result) {
        throw new Error('Failed to create the Google user account');
    }

    return result.id;
}

export async function generateUniqueUsername(name: string | null): Promise<string> {
    let base = (name ?? 'user')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 25);

    if (base.length < 3) {
        base = 'user';
    }

    let candidate = base;
    let counter = 1;

    while (await usernameExists(candidate)) {
        candidate = `${base}_${counter}`;
        counter += 1;
    }

    return candidate;
}

async function usernameExists(username: string): Promise<boolean> {
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);

    return Boolean(row);
}
