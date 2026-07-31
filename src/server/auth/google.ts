import { randomBytes } from 'node:crypto';
import { env } from '@/lib/env';

/** Google OAuth 2.0. */

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export function createOAuthState(): string {
    return randomBytes(32).toString('hex');
}

export function buildAuthorizationUrl(state: string): string {
    const url = new URL(AUTHORIZE_URL);

    url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID ?? '');
    url.searchParams.set('redirect_uri', env.GOOGLE_REDIRECT_URL ?? '');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'select_account');

    return url.toString();
}

export type GoogleProfile = {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
};

export async function exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
    const tokenResponse = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID ?? '',
            client_secret: env.GOOGLE_CLIENT_SECRET ?? '',
            redirect_uri: env.GOOGLE_REDIRECT_URL ?? '',
            grant_type: 'authorization_code',
        }),
        cache: 'no-store',
    });

    if (!tokenResponse.ok) {
        throw new Error(`Google token exchange failed with status ${tokenResponse.status}`);
    }

    const { access_token: accessToken } = (await tokenResponse.json()) as { access_token?: string };

    if (!accessToken) {
        throw new Error('Google token response did not include an access token');
    }

    const profileResponse = await fetch(USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
    });

    if (!profileResponse.ok) {
        throw new Error(`Google userinfo request failed with status ${profileResponse.status}`);
    }

    const profile = (await profileResponse.json()) as {
        sub: string;
        email?: string;
        name?: string;
        picture?: string;
    };

    if (!profile.email) {
        throw new Error('Google account did not expose an email address');
    }

    return {
        id: profile.sub,
        email: profile.email,
        name: profile.name ?? profile.email.split('@')[0] ?? 'User',
        avatar: profile.picture ?? null,
    };
}
