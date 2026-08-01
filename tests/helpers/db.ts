import { sql } from 'drizzle-orm';
import { db, pool } from '@/db';
import {
    achievementUser,
    achievements,
    experienceAudits,
    favorites,
    levels,
    streaks,
    userActivities,
    userExperience,
    users,
    watchedEpisodes,
    watchlistItems,
} from '@/db/schema';
import { hashPassword } from '@/lib/security';

/** Tables the integration tests write to, ordered so children clear before parents. */
const MUTABLE_TABLES = [
    'achievement_user',
    'experience_audits',
    'user_experience',
    'streaks',
    'user_activities',
    'watched_episodes',
    'watchlist_items',
    'favorites',
    'follows',
    'notifications',
    'reviews',
    'custom_list_likes',
    'custom_list_items',
    'custom_lists',
    'sessions',
    'users',
    'achievements',
    'levels',
] as const;

export async function resetDatabase(): Promise<void> {
    // RESTART IDENTITY resets the serial sequences; CASCADE clears dependent rows in one go so
    // the tables can be truncated together without ordering around foreign keys.
    const tableList = MUTABLE_TABLES.map((table) => `"${table}"`).join(', ');

    await db.execute(sql.raw(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`));
}

/** Seeds the level thresholds and achievements gamification looks up by name. */
export async function seedGamificationData(): Promise<void> {
    const levelRows = Array.from({ length: 10 }, (_, index) => ({
        level: index + 1,
        nextLevelExperience: index === 0 ? 0 : index * 50 + (index - 1) * 25,
    }));

    await db.insert(levels).values(levelRows);
    await db.insert(achievements).values(
        [
            'First Watch',
            'Movie Buff',
            'Binge Watcher',
            'Cinephile',
            'Marathon Runner',
            'Critic',
            'Top Reviewer',
            'Social Butterfly',
            'Influencer',
            'Curator',
            'Collector',
            'Veteran',
        ].map((name) => ({ name })),
    );
}

export type TestUserOverrides = {
    name?: string;
    username?: string;
    email?: string;
    password?: string;
    emailVerified?: boolean;
    isAdmin?: boolean;
    bannedAt?: Date | null;
    twoFactorSecret?: string | null;
    twoFactorRecoveryCodes?: string[] | null;
    twoFactorConfirmedAt?: Date | null;
};

let userCounter = 0;

export async function createTestUser(overrides: TestUserOverrides = {}): Promise<number> {
    userCounter += 1;
    const now = new Date();
    const suffix = `${Date.now()}${userCounter}`;

    const [result] = await db
        .insert(users)
        .values({
            name: overrides.name ?? 'Test User',
            username: overrides.username ?? `tester_${suffix}`,
            email: overrides.email ?? `tester_${suffix}@example.test`,
            passwordHash: hashPassword(overrides.password ?? 'password'),
            emailVerifiedAt: overrides.emailVerified === false ? null : now,
            isAdmin: overrides.isAdmin ?? false,
            bannedAt: overrides.bannedAt ?? null,
            twoFactorSecret: overrides.twoFactorSecret ?? null,
            twoFactorRecoveryCodes: overrides.twoFactorRecoveryCodes ?? null,
            twoFactorConfirmedAt: overrides.twoFactorConfirmedAt ?? null,
            createdAt: now,
            updatedAt: now,
        })
        .returning({ id: users.id });

    if (!result) {
        throw new Error('Failed to create the test user');
    }

    return result.id;
}

export async function closeDatabase(): Promise<void> {
    await pool.end();
}

export { db, achievementUser, achievements, experienceAudits, favorites, streaks, userActivities, userExperience, watchedEpisodes, watchlistItems };
