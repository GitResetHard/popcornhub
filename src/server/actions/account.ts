'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/server/auth/current-user';
import {
    beginTwoFactorSetup,
    changePassword,
    confirmTwoFactorSetup,
    disableTwoFactor,
    updateNotificationPreferences,
    updatePrivacy,
    updateProfile,
    type TwoFactorSetup,
} from '@/server/services/account';

export type SettingsState = { ok?: boolean; message?: string; error?: string };

const profileSchema = z.object({
    name: z.string().trim().min(1, 'Your name is required.').max(255),
    bio: z.string().trim().max(500).optional().or(z.literal('')),
    avatar: z.string().trim().url('Enter a valid image URL.').max(255).optional().or(z.literal('')),
});

export async function updateProfileAction(_state: SettingsState, formData: FormData): Promise<SettingsState> {
    const user = await requireUser().catch(() => null);

    if (!user) {
        return { error: 'Please sign in to continue.' };
    }

    const parsed = profileSchema.safeParse({
        name: formData.get('name') ?? '',
        bio: formData.get('bio') ?? '',
        avatar: formData.get('avatar') ?? '',
    });

    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
    }

    await updateProfile(user.id, {
        name: parsed.data.name,
        bio: parsed.data.bio || null,
        avatar: parsed.data.avatar || null,
    });

    revalidatePath('/settings/profile');
    revalidatePath(`/users/${user.username}`);

    return { ok: true, message: 'Profile updated.' };
}

export async function updatePrivacyAction(_state: SettingsState, formData: FormData): Promise<SettingsState> {
    const user = await requireUser().catch(() => null);

    if (!user) {
        return { error: 'Please sign in to continue.' };
    }

    await updatePrivacy(user.id, {
        allowDirectMessages: formData.get('allow_direct_messages') === 'on',
        showPresence: formData.get('show_presence') === 'on',
    });

    revalidatePath('/settings/profile');

    return { ok: true, message: 'Privacy preferences saved.' };
}

const NOTIFICATION_KEYS = ['follows', 'review_replies', 'review_reactions', 'list_comments', 'list_collaborations'] as const;

export async function updateNotificationsAction(_state: SettingsState, formData: FormData): Promise<SettingsState> {
    const user = await requireUser().catch(() => null);

    if (!user) {
        return { error: 'Please sign in to continue.' };
    }

    const preferences = Object.fromEntries(NOTIFICATION_KEYS.map((key) => [key, formData.get(key) === 'on']));

    await updateNotificationPreferences(user.id, preferences);
    revalidatePath('/settings/profile');

    return { ok: true, message: 'Notification preferences saved.' };
}

const passwordSchema = z.object({
    current_password: z.string().min(1, 'Enter your current password.'),
    password: z.string().min(8, 'The new password must be at least 8 characters.'),
    password_confirmation: z.string(),
});

export async function changePasswordAction(_state: SettingsState, formData: FormData): Promise<SettingsState> {
    const user = await requireUser().catch(() => null);

    if (!user) {
        return { error: 'Please sign in to continue.' };
    }

    const parsed = passwordSchema.safeParse({
        current_password: formData.get('current_password') ?? '',
        password: formData.get('password') ?? '',
        password_confirmation: formData.get('password_confirmation') ?? '',
    });

    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
    }

    if (parsed.data.password !== parsed.data.password_confirmation) {
        return { error: 'The password confirmation does not match.' };
    }

    const result = await changePassword(user.id, parsed.data.current_password, parsed.data.password);

    if (!result.ok) {
        return { error: result.error };
    }

    return { ok: true, message: 'Password changed.' };
}

export type TwoFactorActionResult = { ok: true; setup: TwoFactorSetup } | { ok: false; error: string };

export async function beginTwoFactorAction(): Promise<TwoFactorActionResult> {
    const user = await requireUser().catch(() => null);

    if (!user) {
        return { ok: false, error: 'Please sign in to continue.' };
    }

    return { ok: true, setup: await beginTwoFactorSetup(user.id, user.email) };
}

export async function confirmTwoFactorAction(code: string): Promise<{ ok: boolean; error?: string }> {
    const user = await requireUser().catch(() => null);

    if (!user) {
        return { ok: false, error: 'Please sign in to continue.' };
    }

    const confirmed = await confirmTwoFactorSetup(user.id, code);
    revalidatePath('/settings/profile');

    return confirmed ? { ok: true } : { ok: false, error: 'That code was invalid. Try again.' };
}

export async function disableTwoFactorAction(): Promise<{ ok: boolean }> {
    const user = await requireUser().catch(() => null);

    if (!user) {
        return { ok: false };
    }

    await disableTwoFactor(user.id);
    revalidatePath('/settings/profile');

    return { ok: true };
}
