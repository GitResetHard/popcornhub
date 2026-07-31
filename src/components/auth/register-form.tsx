'use client';

import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from '@/server/actions/auth';
import { FieldError, SubmitButton } from './form-parts';

export function RegisterForm() {
    const [state, formAction, isPending] = useActionState(signUp, {});

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" autoComplete="name" required autoFocus aria-invalid={Boolean(state.errors?.name)} />
                <FieldError message={state.errors?.name} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" autoComplete="username" required aria-invalid={Boolean(state.errors?.username)} />
                <p className="text-muted-foreground text-xs">3–30 characters. Letters, numbers, dashes, and underscores.</p>
                <FieldError message={state.errors?.username} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(state.errors?.email)} />
                <FieldError message={state.errors?.email} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    aria-invalid={Boolean(state.errors?.password)}
                />
                <FieldError message={state.errors?.password} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirm password</Label>
                <Input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    aria-invalid={Boolean(state.errors?.password_confirmation)}
                />
                <FieldError message={state.errors?.password_confirmation} />
            </div>

            <SubmitButton label="Create account" isPending={isPending} />
        </form>
    );
}
