import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { TwoFactorForm } from '@/components/auth/two-factor-form';
import { peekPendingTwoFactor } from '@/server/auth/pending-two-factor';

export const metadata: Metadata = { title: 'Two-factor authentication', robots: { index: false, follow: false } };

export default async function TwoFactorChallengePage() {
    if (!(await peekPendingTwoFactor())) {
        redirect('/login');
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Two-factor authentication</h1>
                <p className="text-muted-foreground text-sm">Enter the code from your authenticator app, or one of your recovery codes.</p>
            </div>

            <TwoFactorForm />
        </div>
    );
}
