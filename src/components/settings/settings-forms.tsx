'use client';

import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { useActionState, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    beginTwoFactorAction,
    changePasswordAction,
    confirmTwoFactorAction,
    disableTwoFactorAction,
    updateNotificationsAction,
    updatePrivacyAction,
    updateProfileAction,
    type SettingsState,
    type TwoFactorActionResult,
} from '@/server/actions/account';

function StatusLine({ state }: { state: SettingsState }) {
    if (state.error) {
        return (
            <p className="text-danger text-sm" role="alert">
                {state.error}
            </p>
        );
    }

    if (state.ok && state.message) {
        return (
            <p className="text-success text-sm" role="status">
                {state.message}
            </p>
        );
    }

    return null;
}

function Toggle({ name, label, description, defaultChecked }: { name: string; label: string; description?: string; defaultChecked: boolean }) {
    return (
        <label className="flex items-start gap-3">
            <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 size-4 rounded border" />
            <span>
                <span className="block text-sm font-medium">{label}</span>
                {description && <span className="text-muted-foreground block text-xs">{description}</span>}
            </span>
        </label>
    );
}

export function ProfileForm({ name, bio, avatar }: { name: string; bio: string | null; avatar: string | null }) {
    const [state, action, isPending] = useActionState<SettingsState, FormData>(updateProfileAction, {});

    return (
        <form action={action} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" name="name" defaultValue={name} maxLength={255} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" name="bio" defaultValue={bio ?? ''} maxLength={500} rows={3} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input id="avatar" name="avatar" defaultValue={avatar ?? ''} placeholder="https://…" maxLength={255} />
            </div>
            <StatusLine state={state} />
            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Save profile
            </Button>
        </form>
    );
}

export function PrivacyForm({ allowDirectMessages, showPresence }: { allowDirectMessages: boolean; showPresence: boolean }) {
    const [state, action, isPending] = useActionState<SettingsState, FormData>(updatePrivacyAction, {});

    return (
        <form action={action} className="space-y-4">
            <Toggle name="allow_direct_messages" label="Allow direct messages" description="Let other members start a conversation." defaultChecked={allowDirectMessages} />
            <Toggle name="show_presence" label="Show online presence" description="Display when you were last active." defaultChecked={showPresence} />
            <StatusLine state={state} />
            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Save privacy
            </Button>
        </form>
    );
}

const NOTIFICATION_OPTIONS = [
    { key: 'follows', label: 'New followers' },
    { key: 'review_replies', label: 'Replies to my reviews' },
    { key: 'review_reactions', label: 'Reactions to my reviews' },
    { key: 'list_comments', label: 'Comments on my lists' },
    { key: 'list_collaborations', label: 'List collaboration invites' },
] as const;

export function NotificationsForm({ preferences }: { preferences: Record<string, boolean> }) {
    const [state, action, isPending] = useActionState<SettingsState, FormData>(updateNotificationsAction, {});

    return (
        <form action={action} className="space-y-4">
            {NOTIFICATION_OPTIONS.map((option) => (
                <Toggle key={option.key} name={option.key} label={option.label} defaultChecked={preferences[option.key] ?? true} />
            ))}
            <StatusLine state={state} />
            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Save notifications
            </Button>
        </form>
    );
}

export function PasswordForm() {
    const [state, action, isPending] = useActionState<SettingsState, FormData>(changePasswordAction, {});

    return (
        <form action={action} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="current_password">Current password</Label>
                <Input id="current_password" name="current_password" type="password" autoComplete="current-password" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input id="password" name="password" type="password" autoComplete="new-password" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirm new password</Label>
                <Input id="password_confirmation" name="password_confirmation" type="password" autoComplete="new-password" required />
            </div>
            <StatusLine state={state} />
            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Change password
            </Button>
        </form>
    );
}

export function TwoFactorSection({ enabled }: { enabled: boolean }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [setup, setSetup] = useState<Extract<TwoFactorActionResult, { ok: true }>['setup'] | null>(null);
    const [code, setCode] = useState('');

    const begin = () => {
        startTransition(async () => {
            const result = await beginTwoFactorAction();

            if (result.ok) {
                setSetup(result.setup);
            } else {
                toast.error(result.error);
            }
        });
    };

    const confirm = () => {
        startTransition(async () => {
            const result = await confirmTwoFactorAction(code);

            if (result.ok) {
                toast.success('Two-factor authentication enabled');
                setSetup(null);
                setCode('');
                router.refresh();
            } else {
                toast.error(result.error ?? 'Invalid code');
            }
        });
    };

    const disable = () => {
        startTransition(async () => {
            await disableTwoFactorAction();
            toast.success('Two-factor authentication disabled');
            router.refresh();
        });
    };

    if (enabled) {
        return (
            <div className="space-y-3">
                <p className="text-success flex items-center gap-2 text-sm">
                    <ShieldCheck className="size-4" /> Two-factor authentication is enabled.
                </p>
                <Button onClick={disable} disabled={isPending} variant="destructive" size="sm">
                    <ShieldOff className="size-4" />
                    Disable
                </Button>
            </div>
        );
    }

    if (setup) {
        return (
            <div className="space-y-4">
                <p className="text-sm">Add this secret to your authenticator app, then enter a code to confirm.</p>
                <div className="bg-muted rounded-md p-3 font-mono text-sm break-all">{setup.secret}</div>
                <a href={setup.uri} className="text-primary text-xs hover:underline">
                    Open in authenticator app
                </a>
                <div>
                    <p className="text-sm font-medium">Recovery codes</p>
                    <p className="text-muted-foreground mb-2 text-xs">Store these safely — each can be used once.</p>
                    <ul className="bg-muted grid grid-cols-2 gap-1 rounded-md p-3 font-mono text-xs">
                        {setup.recoveryCodes.map((codeValue) => (
                            <li key={codeValue}>{codeValue}</li>
                        ))}
                    </ul>
                </div>
                <div className="flex items-end gap-2">
                    <div className="space-y-2">
                        <Label htmlFor="totp">6-digit code</Label>
                        <Input id="totp" value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" maxLength={6} className="w-32" />
                    </div>
                    <Button onClick={confirm} disabled={isPending || code.length < 6}>
                        Confirm
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-muted-foreground text-sm">Add a second step to your sign-in with a TOTP authenticator app.</p>
            <Button onClick={begin} disabled={isPending} size="sm">
                <ShieldCheck className="size-4" />
                Enable two-factor
            </Button>
        </div>
    );
}
