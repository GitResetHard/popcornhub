'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="py-20 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
                We could not load this page. This is usually temporary — please try again.
            </p>
            {error.digest && <p className="text-muted-foreground mt-2 text-xs">Reference: {error.digest}</p>}
            <Button onClick={reset} className="mt-6">
                <RefreshCw className="size-4" />
                Try again
            </Button>
        </div>
    );
}
