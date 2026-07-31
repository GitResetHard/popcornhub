import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { buildAuthorizationUrl, createOAuthState } from '@/server/auth/google';

export const OAUTH_STATE_COOKIE = 'moviestrackr_oauth_state';

export async function GET() {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        return NextResponse.redirect(new URL('/login?error=oauth_unavailable', env.APP_URL));
    }

    const state = createOAuthState();
    const cookieStore = await cookies();

    cookieStore.set(OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.APP_URL.startsWith('https://'),
        path: '/',
        maxAge: 10 * 60,
    });

    return NextResponse.redirect(buildAuthorizationUrl(state));
}
