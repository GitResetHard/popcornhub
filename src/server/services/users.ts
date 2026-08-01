import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { userExperience, users } from '@/db/schema';

/** Public user lookups and the experience leaderboard. */

export type PublicProfile = {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    bio: string | null;
    isAdmin: boolean;
    isBanned: boolean;
    showPresence: boolean;
    createdAt: string | null;
};

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
    const [row] = await db
        .select({
            id: users.id,
            name: users.name,
            username: users.username,
            avatar: users.avatar,
            bio: users.bio,
            isAdmin: users.isAdmin,
            bannedAt: users.bannedAt,
            showPresence: users.showPresence,
            createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.username, username.toLowerCase()))
        .limit(1);

    if (!row) {
        return null;
    }

    return {
        id: row.id,
        name: row.name,
        username: row.username,
        avatar: row.avatar,
        bio: row.bio,
        isAdmin: row.isAdmin ?? false,
        isBanned: row.bannedAt != null,
        showPresence: row.showPresence ?? true,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    };
}

export type LeaderboardEntry = {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    level: number;
    points: number;
};

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
    return db
        .select({
            id: users.id,
            name: users.name,
            username: users.username,
            avatar: users.avatar,
            level: userExperience.level,
            points: userExperience.experiencePoints,
        })
        .from(userExperience)
        .innerJoin(users, eq(users.id, userExperience.userId))
        .orderBy(desc(userExperience.experiencePoints))
        .limit(limit);
}
