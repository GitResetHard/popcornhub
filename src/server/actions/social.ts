'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { LIST_VISIBILITIES } from '@/lib/enums';
import { requireUser, requireVerifiedUser } from '@/server/auth/current-user';
import { toggleFollow } from '@/server/services/follows';
import { addItemToList, createList, deleteList, removeItemFromList, toggleListLike, updateList } from '@/server/services/lists';
import { markAllNotificationsRead } from '@/server/services/notifications';
import { deleteReview, upsertReview } from '@/server/services/reviews';
import { fetchMetadataSafely } from '@/server/services/tmdb-enricher';

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

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

        console.error('[social] action failed', error);

        return { ok: false, error: 'Something went wrong. Please try again.' };
    }
}

/* --------------------------------- follows -------------------------------- */

const followSchema = z.object({ userId: z.coerce.number().int().positive(), username: z.string().optional() });

export async function toggleFollowAction(input: z.input<typeof followSchema>): Promise<ActionResult<{ following: boolean }>> {
    return guarded(async () => {
        const { userId, username } = followSchema.parse(input);
        const viewer = await requireVerifiedUser();
        const result = await toggleFollow(viewer.id, userId);

        if (username) {
            revalidatePath(`/users/${username}`);
        }

        return result;
    });
}

/* --------------------------------- reviews -------------------------------- */

const reviewSchema = z.object({
    tmdbId: z.coerce.number().int().positive(),
    mediaType: z.enum(['movie', 'tv']),
    rating: z.coerce.number().int().min(1).max(10),
    title: z.string().trim().max(255).optional().or(z.literal('')),
    content: z.string().trim().max(5000).optional().or(z.literal('')),
    hasSpoilers: z.coerce.boolean().optional(),
});

export async function submitReviewAction(input: z.input<typeof reviewSchema>): Promise<ActionResult<{ created: boolean }>> {
    return guarded(async () => {
        const parsed = reviewSchema.parse(input);
        const user = await requireVerifiedUser();

        const result = await upsertReview({
            userId: user.id,
            tmdbId: parsed.tmdbId,
            mediaType: parsed.mediaType,
            rating: parsed.rating,
            title: parsed.title || null,
            content: parsed.content || null,
            hasSpoilers: parsed.hasSpoilers ?? false,
        });

        revalidatePath(`/${parsed.mediaType === 'movie' ? 'movies' : 'tv'}/${parsed.tmdbId}`);

        return result;
    });
}

const deleteReviewSchema = z.object({
    reviewId: z.coerce.number().int().positive(),
    tmdbId: z.coerce.number().int().positive(),
    mediaType: z.enum(['movie', 'tv']),
});

export async function deleteReviewAction(input: z.input<typeof deleteReviewSchema>): Promise<ActionResult> {
    return guarded(async () => {
        const parsed = deleteReviewSchema.parse(input);
        const user = await requireUser();

        await deleteReview(user.id, parsed.reviewId);
        revalidatePath(`/${parsed.mediaType === 'movie' ? 'movies' : 'tv'}/${parsed.tmdbId}`);

        return undefined;
    });
}

/* ---------------------------------- lists --------------------------------- */

const listFieldsSchema = z.object({
    name: z.string().trim().min(1, 'A list name is required.').max(255),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    visibility: z.enum(LIST_VISIBILITIES).default('public'),
});

export type ListFormState = { error?: string; slug?: string };

export async function createListAction(_state: ListFormState, formData: FormData): Promise<ListFormState> {
    const user = await requireVerifiedUser().catch(() => null);

    if (!user) {
        return { error: 'Please sign in with a verified account to create a list.' };
    }

    const parsed = listFieldsSchema.safeParse({
        name: formData.get('name') ?? '',
        description: formData.get('description') ?? '',
        visibility: formData.get('visibility') ?? 'public',
    });

    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' };
    }

    const list = await createList(user.id, {
        name: parsed.data.name,
        description: parsed.data.description || null,
        visibility: parsed.data.visibility,
    });

    revalidatePath('/lists');

    return { slug: list.slug };
}

const updateListSchema = z.object({
    listId: z.coerce.number().int().positive(),
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    visibility: z.enum(LIST_VISIBILITIES),
    slug: z.string(),
});

export async function updateListAction(input: z.input<typeof updateListSchema>): Promise<ActionResult> {
    return guarded(async () => {
        const parsed = updateListSchema.parse(input);
        const user = await requireVerifiedUser();

        await updateList(user.id, parsed.listId, {
            name: parsed.name,
            description: parsed.description || null,
            visibility: parsed.visibility,
        });

        revalidatePath(`/lists/${parsed.slug}`);
        revalidatePath('/lists');

        return undefined;
    });
}

const listIdSchema = z.object({ listId: z.coerce.number().int().positive(), slug: z.string().optional() });

export async function deleteListAction(input: z.input<typeof listIdSchema>): Promise<ActionResult> {
    return guarded(async () => {
        const { listId } = listIdSchema.parse(input);
        const user = await requireVerifiedUser();

        await deleteList(user.id, listId);
        revalidatePath('/lists');

        return undefined;
    });
}

export async function toggleListLikeAction(input: z.input<typeof listIdSchema>): Promise<ActionResult<{ liked: boolean }>> {
    return guarded(async () => {
        const { listId, slug } = listIdSchema.parse(input);
        const user = await requireVerifiedUser();
        const result = await toggleListLike(user.id, listId);

        if (slug) {
            revalidatePath(`/lists/${slug}`);
        }

        return result;
    });
}

const addToListSchema = z.object({
    listId: z.coerce.number().int().positive(),
    tmdbId: z.coerce.number().int().positive(),
    mediaType: z.enum(['movie', 'tv']),
    slug: z.string().optional(),
});

export async function addToListAction(input: z.input<typeof addToListSchema>): Promise<ActionResult<{ added: boolean }>> {
    return guarded(async () => {
        const parsed = addToListSchema.parse(input);
        const user = await requireVerifiedUser();
        const metadata = await fetchMetadataSafely(parsed.tmdbId, parsed.mediaType, false);

        const result = await addItemToList(user.id, parsed.listId, {
            tmdbId: parsed.tmdbId,
            mediaType: parsed.mediaType,
            title: metadata?.title ?? null,
            posterPath: metadata?.poster_path ?? null,
            releaseDate: metadata?.release_date ?? null,
            voteAverage: metadata?.vote_average ?? null,
            overview: metadata?.overview ?? null,
        });

        if (parsed.slug) {
            revalidatePath(`/lists/${parsed.slug}`);
        }

        return result;
    });
}

const removeFromListSchema = z.object({
    listId: z.coerce.number().int().positive(),
    itemId: z.coerce.number().int().positive(),
    slug: z.string(),
});

export async function removeFromListAction(input: z.input<typeof removeFromListSchema>): Promise<ActionResult> {
    return guarded(async () => {
        const parsed = removeFromListSchema.parse(input);
        const user = await requireVerifiedUser();

        await removeItemFromList(user.id, parsed.listId, parsed.itemId);
        revalidatePath(`/lists/${parsed.slug}`);

        return undefined;
    });
}

/* ------------------------------ notifications ----------------------------- */

export async function markNotificationsReadAction(): Promise<ActionResult> {
    return guarded(async () => {
        const user = await requireUser();

        await markAllNotificationsRead(user.id);
        revalidatePath('/notifications');

        return undefined;
    });
}
