import { count, desc, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { customLists, favorites, reviews, userActivities, users, watchlistItems } from '@/db/schema';

/** Aggregate figures and recent signups for the admin dashboard. */

export type AdminStats = {
    users: number;
    watchlistItems: number;
    reviews: number;
    lists: number;
    favorites: number;
    activities: number;
};

export async function getAdminStats(): Promise<AdminStats> {
    const [userRow] = await db.select({ value: count() }).from(users);
    const [watchlistRow] = await db.select({ value: count() }).from(watchlistItems);
    const [reviewRow] = await db.select({ value: count() }).from(reviews).where(isNull(reviews.deletedAt));
    const [listRow] = await db.select({ value: count() }).from(customLists).where(isNull(customLists.deletedAt));
    const [favoriteRow] = await db.select({ value: count() }).from(favorites);
    const [activityRow] = await db.select({ value: count() }).from(userActivities);

    return {
        users: userRow?.value ?? 0,
        watchlistItems: watchlistRow?.value ?? 0,
        reviews: reviewRow?.value ?? 0,
        lists: listRow?.value ?? 0,
        favorites: favoriteRow?.value ?? 0,
        activities: activityRow?.value ?? 0,
    };
}

export type AdminUserRow = {
    id: number;
    name: string;
    username: string;
    email: string;
    isAdmin: boolean;
    isBanned: boolean;
    createdAt: string | null;
};

export async function getRecentUsers(limit = 20): Promise<AdminUserRow[]> {
    const rows = await db
        .select({
            id: users.id,
            name: users.name,
            username: users.username,
            email: users.email,
            isAdmin: users.isAdmin,
            bannedAt: users.bannedAt,
            createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit);

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        username: row.username,
        email: row.email,
        isAdmin: row.isAdmin ?? false,
        isBanned: row.bannedAt != null,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    }));
}
