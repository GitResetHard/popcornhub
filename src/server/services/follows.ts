import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { follows, users } from '@/db/schema';
import { handleGainedFollower, grantXp } from './gamification';
import { createNotification } from './notifications';

/**
 * Social graph. Following someone grants the follower XP and advances the followed user's
 * Influencer achievement, mirroring the reference implementation's gamification hooks.
 */

export type UserSummary = {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    bio: string | null;
};

const summaryColumns = {
    id: users.id,
    name: users.name,
    username: users.username,
    avatar: users.avatar,
    bio: users.bio,
};

export async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [row] = await db
        .select({ id: follows.id })
        .from(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
        .limit(1);

    return Boolean(row);
}

export async function countFollowers(userId: number): Promise<number> {
    const [row] = await db.select({ value: count() }).from(follows).where(eq(follows.followingId, userId));

    return row?.value ?? 0;
}

export async function countFollowing(userId: number): Promise<number> {
    const [row] = await db.select({ value: count() }).from(follows).where(eq(follows.followerId, userId));

    return row?.value ?? 0;
}

export async function getFollowingIds(userId: number): Promise<number[]> {
    const rows = await db.select({ id: follows.followingId }).from(follows).where(eq(follows.followerId, userId));

    return rows.map((row) => row.id);
}

export async function getFollowers(userId: number): Promise<UserSummary[]> {
    return db
        .select(summaryColumns)
        .from(follows)
        .innerJoin(users, eq(users.id, follows.followerId))
        .where(eq(follows.followingId, userId))
        .orderBy(desc(follows.createdAt));
}

export async function getFollowing(userId: number): Promise<UserSummary[]> {
    return db
        .select(summaryColumns)
        .from(follows)
        .innerJoin(users, eq(users.id, follows.followingId))
        .where(eq(follows.followerId, userId))
        .orderBy(desc(follows.createdAt));
}

/** Which of `candidateIds` the viewer already follows — used to render follow buttons in lists. */
export async function getFollowedSubset(followerId: number, candidateIds: number[]): Promise<Set<number>> {
    if (candidateIds.length === 0) {
        return new Set();
    }

    const rows = await db
        .select({ id: follows.followingId })
        .from(follows)
        .where(and(eq(follows.followerId, followerId), inArray(follows.followingId, candidateIds)));

    return new Set(rows.map((row) => row.id));
}

export type ToggleFollowResult = { following: boolean };

export async function toggleFollow(followerId: number, followingId: number): Promise<ToggleFollowResult> {
    if (followerId === followingId) {
        return { following: false };
    }

    if (await isFollowing(followerId, followingId)) {
        await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));

        return { following: false };
    }

    const now = new Date();

    await db.insert(follows).values({ followerId, followingId, createdAt: now, updatedAt: now });

    await grantXp(followerId, 'follow_user');
    await handleGainedFollower(followingId);

    const [follower] = await db.select({ name: users.name, username: users.username }).from(users).where(eq(users.id, followerId)).limit(1);

    if (follower) {
        await createNotification(followingId, 'followed', { follower_id: followerId, name: follower.name, username: follower.username });
    }

    return { following: true };
}
