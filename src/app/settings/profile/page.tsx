import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    NotificationsForm,
    PasswordForm,
    PrivacyForm,
    ProfileForm,
    TwoFactorSection,
} from '@/components/settings/settings-forms';
import { getCurrentUser } from '@/server/auth/current-user';
import { getTwoFactorState } from '@/server/services/account';

export const metadata: Metadata = { title: 'Settings', robots: { index: false, follow: false } };

export default async function SettingsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login?redirect=/settings/profile');
    }

    const twoFactor = await getTwoFactorState(user.id);

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>How you appear to other members.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProfileForm name={user.name} bio={user.bio} avatar={user.avatar} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Privacy</CardTitle>
                    <CardDescription>Control what other members can see and do.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PrivacyForm allowDirectMessages={user.allow_direct_messages} showPresence={user.show_presence} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Choose which activity you want to hear about.</CardDescription>
                </CardHeader>
                <CardContent>
                    <NotificationsForm preferences={user.notification_preferences} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>Update the password you use to sign in.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PasswordForm />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Two-factor authentication</CardTitle>
                    <CardDescription>Protect your account with a one-time code.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TwoFactorSection enabled={twoFactor.enabled} />
                </CardContent>
            </Card>
        </div>
    );
}
