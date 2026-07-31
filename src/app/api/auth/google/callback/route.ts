import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { findOrCreateGoogleUser } from '@/server/auth/credentials';
import { exchangeCodeForProfile } from '@/server/auth/google';
import { createSession } from '@/server/auth/session';
import { OAUTH_STATE_COOKIE } from '../redirect/route';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    const cookieStore = await cookies();
    const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
    cookieStore.delete(OAUTH_STATE_COOKIE);

    if (!code || !state || !expectedState || state !== expectedState) {
        return NextResponse.redirect(new URL('/login?error=oauth_state', env.APP_URL));
    }

    try {
        const profile = await exchangeCodeForProfile(code);
        const userId = await findOrCreateGoogleUser(profile);
        const headerList = await headers();

        await createSession(userId, {
            ipAddress: headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
            userAgent: headerList.get('user-agent'),
        });

        return NextResponse.redirect(new URL('/movies', env.APP_URL));
    } catch (error) {
        console.error('[oauth] google callback failed', error);

        return NextResponse.redirect(new URL('/login?error=oauth_failed', env.APP_URL));
    }
}
