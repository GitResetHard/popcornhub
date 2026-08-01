import { and, count, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { customListItems, customListLikes, customLists, users } from '@/db/schema';
import type { ListVisibility, MediaType } from '@/lib/enums';
import { checkAndGrantAchievements, grantXp } from './gamification';
import { createNotification } from './notifications';

/** User-authored lists of titles. Lists are soft-deleted; counters are kept on the row. */

type ListMediaType = Extract<MediaType, 'movie' | 'tv'>;

const notDeleted = isNull(customLists.deletedAt);

export type CustomListRow = typeof customLists.$inferSelect;
export type CustomListItemRow = typeof customListItems.$inferSelect;

export type ListWithAuthor = CustomListRow & { authorName: string; authorUsername: string; authorAvatar: string | null };

function slugify(value: string): string {
    return (
        value
            .toLowerCase()
            .normalize('NFKD')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60) || 'list'
    );
}

async function uniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let suffix = 1;

    while (true) {
        const [existing] = await db.select({ id: customLists.id }).from(customLists).where(eq(customLists.slug, candidate)).limit(1);

        if (!existing) {
            return candidate;
        }

        suffix += 1;
        candidate = `${base}-${suffix}`;
    }
}

export type CreateListInput = { name: string; description?: string | null; visibility?: ListVisibility };

export async function createList(userId: number, input: CreateListInput): Promise<CustomListRow> {
    const now = new Date();
    const slug = await uniqueSlug(input.name);

    const [created] = await db
        .insert(customLists)
        .values({
            userId,
            name: input.name,
            slug,
            description: input.description ?? null,
            visibility: input.visibility ?? 'public',
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    await grantXp(userId, 'create_list');
    await checkAndGrantAchievements(userId, 'create_list');

    if (!created) {
        throw new Error('Failed to create the list');
    }

    return created;
}

export async function updateList(
    userId: number,
    listId: number,
    fields: { name?: string; description?: string | null; visibility?: ListVisibility },
): Promise<void> {
    await db
        .update(customLists)
        .set({ ...fields, updatedAt: new Date() })
        .where(and(eq(customLists.id, listId), eq(customLists.userId, userId)));
}

export async function deleteList(userId: number, listId: number): Promise<void> {
    await db
        .update(customLists)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(customLists.id, listId), eq(customLists.userId, userId)));
}

export async function getUserLists(userId: number): Promise<CustomListRow[]> {
    return db
        .select()
        .from(customLists)
        .where(and(eq(customLists.userId, userId), notDeleted))
        .orderBy(desc(customLists.updatedAt));
}

export async function getPublicLists(limit = 40): Promise<ListWithAuthor[]> {
    return db
        .select({
            id: customLists.id,
            userId: customLists.userId,
            name: customLists.name,
            slug: customLists.slug,
            description: customLists.description,
            visibility: customLists.visibility,
            itemsCount: customLists.itemsCount,
            likesCount: customLists.likesCount,
            commentsCount: customLists.commentsCount,
            createdAt: customLists.createdAt,
            updatedAt: customLists.updatedAt,
            deletedAt: customLists.deletedAt,
            authorName: users.name,
            authorUsername: users.username,
            authorAvatar: users.avatar,
        })
        .from(customLists)
        .innerJoin(users, eq(users.id, customLists.userId))
        .where(and(eq(customLists.visibility, 'public'), notDeleted))
        .orderBy(desc(customLists.likesCount), desc(customLists.updatedAt))
        .limit(limit);
}

export async function getListBySlug(slug: string): Promise<ListWithAuthor | null> {
    const [row] = await db
        .select({
            id: customLists.id,
            userId: customLists.userId,
            name: customLists.name,
            slug: customLists.slug,
            description: customLists.description,
            visibility: customLists.visibility,
            itemsCount: customLists.itemsCount,
            likesCount: customLists.likesCount,
            commentsCount: customLists.commentsCount,
            createdAt: customLists.createdAt,
            updatedAt: customLists.updatedAt,
            deletedAt: customLists.deletedAt,
            authorName: users.name,
            authorUsername: users.username,
            authorAvatar: users.avatar,
        })
        .from(customLists)
        .innerJoin(users, eq(users.id, customLists.userId))
        .where(and(eq(customLists.slug, slug), notDeleted))
        .limit(1);

    return row ?? null;
}

export async function getListItems(listId: number): Promise<CustomListItemRow[]> {
    return db
        .select()
        .from(customListItems)
        .where(eq(customListItems.customListId, listId))
        .orderBy(customListItems.position, desc(customListItems.createdAt));
}

export async function ownsList(userId: number, listId: number): Promise<boolean> {
    const [row] = await db
        .select({ id: customLists.id })
        .from(customLists)
        .where(and(eq(customLists.id, listId), eq(customLists.userId, userId), notDeleted))
        .limit(1);

    return Boolean(row);
}

export type AddListItemInput = {
    tmdbId: number;
    mediaType: ListMediaType;
    title?: string | null;
    posterPath?: string | null;
    releaseDate?: string | null;
    voteAverage?: number | null;
    overview?: string | null;
    notes?: string | null;
};

export async function addItemToList(userId: number, listId: number, item: AddListItemInput): Promise<{ added: boolean }> {
    if (!(await ownsList(userId, listId))) {
        return { added: false };
    }

    const [existing] = await db
        .select({ id: customListItems.id })
        .from(customListItems)
        .where(
            and(
                eq(customListItems.customListId, listId),
                eq(customListItems.tmdbId, item.tmdbId),
                eq(customListItems.mediaType, item.mediaType),
            ),
        )
        .limit(1);

    if (existing) {
        return { added: false };
    }

    const now = new Date();

    await db.insert(customListItems).values({
        customListId: listId,
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        title: item.title ?? null,
        posterPath: item.posterPath ?? null,
        releaseDate: item.releaseDate ?? null,
        voteAverage: item.voteAverage ?? null,
        overview: item.overview ?? null,
        notes: item.notes ?? null,
        createdAt: now,
        updatedAt: now,
    });

    await db
        .update(customLists)
        .set({ itemsCount: sql`${customLists.itemsCount} + 1`, updatedAt: now })
        .where(eq(customLists.id, listId));

    await grantXp(userId, 'add_item_to_list');

    return { added: true };
}

export async function removeItemFromList(userId: number, listId: number, itemId: number): Promise<void> {
    if (!(await ownsList(userId, listId))) {
        return;
    }

    const deleted = await db
        .delete(customListItems)
        .where(and(eq(customListItems.id, itemId), eq(customListItems.customListId, listId)))
        .returning({ id: customListItems.id });

    if (deleted.length > 0) {
        await db
            .update(customLists)
            .set({ itemsCount: sql`GREATEST(${customLists.itemsCount} - 1, 0)`, updatedAt: new Date() })
            .where(eq(customLists.id, listId));
    }
}

export async function isListLiked(userId: number, listId: number): Promise<boolean> {
    const [row] = await db
        .select({ id: customListLikes.id })
        .from(customListLikes)
        .where(and(eq(customListLikes.customListId, listId), eq(customListLikes.userId, userId)))
        .limit(1);

    return Boolean(row);
}

export async function toggleListLike(userId: number, listId: number): Promise<{ liked: boolean }> {
    const [list] = await db
        .select({ id: customLists.id, ownerId: customLists.userId, name: customLists.name, slug: customLists.slug })
        .from(customLists)
        .where(and(eq(customLists.id, listId), notDeleted))
        .limit(1);

    if (!list) {
        return { liked: false };
    }

    if (await isListLiked(userId, listId)) {
        await db.delete(customListLikes).where(and(eq(customListLikes.customListId, listId), eq(customListLikes.userId, userId)));
        await db
            .update(customLists)
            .set({ likesCount: sql`GREATEST(${customLists.likesCount} - 1, 0)` })
            .where(eq(customLists.id, listId));

        return { liked: false };
    }

    await db.insert(customListLikes).values({ customListId: listId, userId, createdAt: new Date() });
    await db
        .update(customLists)
        .set({ likesCount: sql`${customLists.likesCount} + 1` })
        .where(eq(customLists.id, listId));

    await grantXp(userId, 'like_list');

    if (list.ownerId !== userId) {
        await createNotification(list.ownerId, 'list_like', { list_id: listId, slug: list.slug, name: list.name, liker_id: userId });
    }

    return { liked: true };
}

export async function countUserLists(userId: number): Promise<number> {
    const [row] = await db
        .select({ value: count() })
        .from(customLists)
        .where(and(eq(customLists.userId, userId), notDeleted));

    return row?.value ?? 0;
}
