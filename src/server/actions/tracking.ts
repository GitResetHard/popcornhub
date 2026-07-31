'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { WATCHLIST_STATUSES } from '@/lib/enums';
import { requireVerifiedUser } from '@/server/auth/current-user';
import { toggleFavorite as toggleFavoriteService } from '@/server/services/favorites';
import {
    addToWatchlist as addToWatchlistService,
    findByUserAndTmdb,
    removeFromWatchlist as removeFromWatchlistService,
    updateStatus as updateStatusService,
} from '@/server/services/watchlist';

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const trackedMediaSchema = z.object({
    tmdbId: z.coerce.number().int().positive(),
    mediaType: z.enum(['movie', 'tv']),
});

const setStatusSchema = trackedMediaSchema.extend({
    status: z.enum(WATCHLIST_STATUSES),
});

const favoriteSchema = z.object({
    tmdbId: z.coerce.number().int().positive(),
    mediaType: z.enum(['movie', 'tv', 'person']),
});

async function guarded<T>(operation: () => Promise<T>): Promise<ActionResult<T>> {
    try {
        return { ok: true, data: await operation() };
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AuthenticationRequiredError') {
                return { ok: false, error: 'Please sign in to continue.' };
            }

            if (error.name === 'EmailVerificationRequiredError') {
                return { ok: false, error: 'Please verify your email address to continue.' };
            }
        }

        console.error('[tracking] action failed', error);

        return { ok: false, error: 'Something went wrong. Please try again.' };
    }
}

export async function setWatchlistStatus(input: z.input<typeof setStatusSchema>): Promise<ActionResult<{ status: string }>> {
    return guarded(async () => {
        const { tmdbId, mediaType, status } = setStatusSchema.parse(input);
        const user = await requireVerifiedUser();

        const existing = await findByUserAndTmdb(user.id, tmdbId, mediaType);
        const item = existing
            ? await updateStatusService(existing, status)
            : await addToWatchlistService(user.id, tmdbId, mediaType, status);

        revalidatePath('/watchlist');
        revalidatePath(`/${mediaType === 'movie' ? 'movies' : 'tv'}/${tmdbId}`);

        return { status: item.status };
    });
}

export async function removeFromWatchlist(input: z.input<typeof trackedMediaSchema>): Promise<ActionResult> {
    return guarded(async () => {
        const { tmdbId, mediaType } = trackedMediaSchema.parse(input);
        const user = await requireVerifiedUser();

        const existing = await findByUserAndTmdb(user.id, tmdbId, mediaType);

        if (existing) {
            await removeFromWatchlistService(existing);
        }

        revalidatePath('/watchlist');
        revalidatePath(`/${mediaType === 'movie' ? 'movies' : 'tv'}/${tmdbId}`);

        return undefined;
    });
}

export async function toggleFavorite(input: z.input<typeof favoriteSchema>): Promise<ActionResult<{ favorited: boolean }>> {
    return guarded(async () => {
        const { tmdbId, mediaType } = favoriteSchema.parse(input);
        const user = await requireVerifiedUser();

        const result = await toggleFavoriteService(user.id, tmdbId, mediaType);

        revalidatePath('/favorites');

        return result;
    });
}
