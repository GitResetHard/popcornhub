import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';
import { getCurrentUser } from '@/server/auth/current-user';

export const metadata: Metadata = { title: 'Create an account', robots: { index: false, follow: false } };

export default async function RegisterPage() {
    if (await getCurrentUser()) {
        redirect('/movies');
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
                <p className="text-muted-foreground text-sm">Start tracking what you watch.</p>
            </div>

            <RegisterForm />

            <p className="text-muted-foreground text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                    Log in
                </Link>
            </p>
        </div>
    );
}
