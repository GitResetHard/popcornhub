import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';
import { env } from '@/lib/env';
import { getCurrentUser } from '@/server/auth/current-user';

export const metadata: Metadata = { title: 'Log in', robots: { index: false, follow: false } };

export default async function LoginPage() {
    if (await getCurrentUser()) {
        redirect('/movies');
    }

    const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID);

    return (
        <div className="space-y-6">
            <div className="space-y-1 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                <p className="text-muted-foreground text-sm">Log in to pick up where you left off.</p>
            </div>

            <LoginForm />

            {googleEnabled && (
                <>
                    <div className="flex items-center gap-3">
                        <span className="bg-border h-px flex-1" />
                        <span className="text-muted-foreground text-xs uppercase">or</span>
                        <span className="bg-border h-px flex-1" />
                    </div>

                    <Button asChild variant="outline" className="w-full">
                        <a href="/api/auth/google/redirect">Continue with Google</a>
                    </Button>
                </>
            )}

            <p className="text-muted-foreground text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:underline">
                    Sign up
                </Link>
            </p>
        </div>
    );
}
