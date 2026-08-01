import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { userActivities, users } from '@/db/schema';
import { getFollowingIds } from './follows';

/** Activity feed combining the viewer's own activity with the people they follow. */

export type FeedItem = {
    id: number;
    authorId: number;
    authorName: string;
    authorUsername: string;
    authorAvatar: string | null;
    type: string;
    tmdbId: number;
    mediaType: string;
    metadata: Record<string, unknown>;
    createdAt: string;
};

export async function getFeed(userId: number, limit = 40): Promise<FeedItem[]> {
    const following = await getFollowingIds(userId);
    const authorIds = Array.from(new Set([userId, ...following]));

    const rows = await db
        .select({
            id: userActivities.id,
            authorId: userActivities.userId,
            authorName: users.name,
            authorUsername: users.username,
            authorAvatar: users.avatar,
            type: userActivities.activityType,
            tmdbId: userActivities.tmdbId,
            mediaType: userActivities.mediaType,
            metadata: userActivities.metadata,
            createdAt: userActivities.createdAt,
        })
        .from(userActivities)
        .innerJoin(users, eq(users.id, userActivities.userId))
        .where(inArray(userActivities.userId, authorIds))
        .orderBy(desc(userActivities.createdAt))
        .limit(limit);

    return rows.map((row) => ({
        id: row.id,
        authorId: row.authorId,
        authorName: row.authorName,
        authorUsername: row.authorUsername,
        authorAvatar: row.authorAvatar,
        type: row.type,
        tmdbId: row.tmdbId,
        mediaType: row.mediaType,
        metadata: row.metadata ?? {},
        createdAt: row.createdAt.toISOString(),
    }));
}
