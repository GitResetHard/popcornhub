'use client';

import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/server/actions/auth';
import { FieldError, SubmitButton } from './form-parts';

export function LoginForm() {
    const [state, formAction, isPending] = useActionState(signIn, {});

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required autoFocus aria-invalid={Boolean(state.errors?.email)} />
                <FieldError message={state.errors?.email} />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="/forgot-password" className="text-muted-foreground text-xs hover:underline">
                        Forgot password?
                    </a>
                </div>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    aria-invalid={Boolean(state.errors?.password)}
                />
                <FieldError message={state.errors?.password} />
            </div>

            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="remember" className="size-4 rounded border" />
                Remember me
            </label>

            <SubmitButton label="Log in" isPending={isPending} />
        </form>
    );
}
