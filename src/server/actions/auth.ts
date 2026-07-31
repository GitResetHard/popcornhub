'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { attemptLogin, registerUser } from '@/server/auth/credentials';
import { consumePendingTwoFactor, storePendingTwoFactor } from '@/server/auth/pending-two-factor';
import { createSession, destroySession } from '@/server/auth/session';
import { attemptTwoFactorChallenge } from '@/server/auth/two-factor';

const HOME_AFTER_LOGIN = '/movies';

export type FormState = {
    errors?: Record<string, string>;
    message?: string;
};

const loginSchema = z.object({
    email: z.string().min(1, 'The email field is required.'),
    password: z.string().min(1, 'The password field is required.'),
    remember: z.coerce.boolean().optional(),
});

async function requestContext(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
    const headerList = await headers();

    return {
        ipAddress: headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
        userAgent: headerList.get('user-agent'),
    };
}

export async function signIn(_state: FormState, formData: FormData): Promise<FormState> {
    const parsed = loginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        remember: formData.get('remember') === 'on',
    });

    if (!parsed.success) {
        return { errors: Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])) };
    }

    const result = await attemptLogin(parsed.data.email, parsed.data.password);

    if (result.status === 'invalid') {
        return { errors: { email: 'These credentials do not match our records.' } };
    }

    if (result.status === 'banned') {
        return { errors: { email: 'This account has been suspended.' } };
    }

    if (result.status === 'two_factor_required') {
        await storePendingTwoFactor(result.userId);

        redirect('/two-factor-challenge');
    }

    await createSession(result.userId, await requestContext());

    redirect(HOME_AFTER_LOGIN);
}

const registerSchema = z.object({
    name: z.string(),
    username: z.string(),
    email: z.string(),
    password: z.string(),
    password_confirmation: z.string(),
});

export async function signUp(_state: FormState, formData: FormData): Promise<FormState> {
    const parsed = registerSchema.safeParse({
        name: formData.get('name') ?? '',
        username: formData.get('username') ?? '',
        email: formData.get('email') ?? '',
        password: formData.get('password') ?? '',
        password_confirmation: formData.get('password_confirmation') ?? '',
    });

    if (!parsed.success) {
        return { errors: { name: 'Please complete every field.' } };
    }

    if (parsed.data.password !== parsed.data.password_confirmation) {
        return { errors: { password_confirmation: 'The password confirmation does not match.' } };
    }

    const result = await registerUser({
        name: parsed.data.name,
        username: parsed.data.username,
        email: parsed.data.email,
        password: parsed.data.password,
    });

    if (!result.ok) {
        return { errors: result.errors };
    }

    await createSession(result.userId, await requestContext());

    redirect(HOME_AFTER_LOGIN);
}

const twoFactorSchema = z.object({
    code: z.string().optional(),
    recovery_code: z.string().optional(),
});

export async function submitTwoFactorChallenge(_state: FormState, formData: FormData): Promise<FormState> {
    const pendingUserId = await consumePendingTwoFactor();

    if (!pendingUserId) {
        redirect('/login');
    }

    const parsed = twoFactorSchema.parse({
        code: formData.get('code') ?? undefined,
        recovery_code: formData.get('recovery_code') ?? undefined,
    });

    const result = await attemptTwoFactorChallenge(pendingUserId, {
        code: parsed.code,
        recoveryCode: parsed.recovery_code,
    });

    if (!result.ok) {
        await storePendingTwoFactor(pendingUserId);

        return { errors: { code: result.error } };
    }

    await createSession(pendingUserId, { ...(await requestContext()), twoFactorConfirmed: true });

    redirect(HOME_AFTER_LOGIN);
}

export async function signOut(): Promise<void> {
    await destroySession();

    redirect('/');
}
