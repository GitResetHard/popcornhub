'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p className="text-danger text-sm" role="alert">
            {message}
        </p>
    );
}

export function SubmitButton({ label, isPending }: { label: string; isPending: boolean }) {
    return (
        <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {label}
        </Button>
    );
}
