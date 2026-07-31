'use client';

import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { submitTwoFactorChallenge } from '@/server/actions/auth';
import { FieldError, SubmitButton } from './form-parts';

export function TwoFactorForm() {
    const [state, formAction, isPending] = useActionState(submitTwoFactorChallenge, {});

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="code">Authentication code</Label>
                <Input
                    id="code"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    autoFocus
                    aria-invalid={Boolean(state.errors?.code)}
                />
                <FieldError message={state.errors?.code} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="recovery_code">Recovery code</Label>
                <Input id="recovery_code" name="recovery_code" autoComplete="one-time-code" />
                <p className="text-muted-foreground text-xs">
                    Use a recovery code if you cannot reach your authenticator app. Each code works once.
                </p>
            </div>

            <SubmitButton label="Verify" isPending={isPending} />
        </form>
    );
}
