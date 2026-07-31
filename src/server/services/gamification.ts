import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { achievements as achievementsTable, achievementUser, experienceAudits, levels, streaks, userExperience } from '@/db/schema';
import { xpPoints, type XpAction } from '@/lib/enums';

/**
 * Gamification: XP, levels, achievements, and the daily engagement streak.
 *
 * Failures are logged and swallowed, matching the reference implementation's rule that
 * gamification must never break the user action that triggered it.
 */

const ACHIEVEMENT_RULES: Partial<Record<XpAction, Array<{ name: string; increment: number }>>> = {
    add_to_watchlist: [
        { name: 'First Watch', increment: 100 },
        { name: 'Collector', increment: 1 },
    ],
    complete_movie: [
        { name: 'Movie Buff', increment: 10 },
        { name: 'Cinephile', increment: 2 },
    ],
    complete_tv_show: [
        { name: 'Binge Watcher', increment: 10 },
        { name: 'Marathon Runner', increment: 1 },
    ],
    write_review: [
        { name: 'Critic', increment: 20 },
        { name: 'Top Reviewer', increment: 2 },
    ],
    follow_user: [{ name: 'Social Butterfly', increment: 10 }],
    create_list: [{ name: 'Curator', increment: 20 }],
};

export function grantXp(userId: number, action: XpAction): Promise<void> {
    return grantCustomXp(userId, xpPoints(action), action);
}

/** Adds points and advances the level when the next threshold is crossed. */
export async function grantCustomXp(userId: number, amount: number, reason: string): Promise<void> {
    try {
        const levelRows = await db
            .select({ level: levels.level, nextLevelExperience: levels.nextLevelExperience })
            .from(levels)
            .orderBy(levels.level);

        if (levelRows.length === 0) {
            return;
        }

        const firstLevel = levelRows[0]?.level ?? 1;

        const [existing] = await db
            .select({ userId: userExperience.userId, points: userExperience.experiencePoints, level: userExperience.level })
            .from(userExperience)
            .where(eq(userExperience.userId, userId))
            .limit(1);

        const now = new Date();
        const previousPoints = existing?.points ?? 0;
        const newPoints = previousPoints + amount;

        const reached = levelRows.reduce((best, candidate) => {
            return newPoints >= candidate.nextLevelExperience && candidate.level >= best ? candidate.level : best;
        }, firstLevel);

        const previousLevel = existing?.level ?? firstLevel;
        const levelledUp = reached > previousLevel;

        if (existing) {
            await db
                .update(userExperience)
                .set({ experiencePoints: newPoints, level: reached, updatedAt: now })
                .where(eq(userExperience.userId, userId));
        } else {
            await db.insert(userExperience).values({ userId, level: reached, experiencePoints: newPoints, updatedAt: now });
        }

        await db.insert(experienceAudits).values({
            userId,
            points: amount,
            levelledUp,
            levelTo: levelledUp ? reached : null,
            reason,
            createdAt: now,
        });
    } catch (error) {
        console.warn('[gamification] failed to grant XP', { userId, reason, error });
    }
}

export async function checkAndGrantAchievements(userId: number, action: XpAction): Promise<void> {
    const rules = ACHIEVEMENT_RULES[action];

    if (!rules) {
        return;
    }

    try {
        for (const rule of rules) {
            await incrementAchievementProgress(userId, rule.name, rule.increment);
        }
    } catch (error) {
        console.warn('[gamification] failed to check achievements', { userId, action, error });
    }
}

/** Adds progress to a named achievement, capped at 100 and skipped once complete. */
export async function incrementAchievementProgress(userId: number, name: string, amount: number): Promise<void> {
    const [achievement] = await db
        .select({ id: achievementsTable.id })
        .from(achievementsTable)
        .where(eq(achievementsTable.name, name))
        .limit(1);

    if (!achievement) {
        return;
    }

    const [existing] = await db
        .select({ id: achievementUser.id, progress: achievementUser.progress })
        .from(achievementUser)
        .where(and(eq(achievementUser.userId, userId), eq(achievementUser.achievementId, achievement.id)))
        .limit(1);

    const now = new Date();

    if (!existing) {
        const progress = Math.min(amount, 100);

        await db.insert(achievementUser).values({
            userId,
            achievementId: achievement.id,
            progress,
            earnedAt: progress >= 100 ? now : null,
        });

        return;
    }

    if (existing.progress === null || existing.progress >= 100) {
        return;
    }

    const next = Math.min(existing.progress + amount, 100);

    await db
        .update(achievementUser)
        .set({ progress: next, earnedAt: next >= 100 ? now : null })
        .where(eq(achievementUser.id, existing.id));
}

/** Increments the Influencer achievement, worth 4% per new follower. */
export async function handleGainedFollower(userId: number): Promise<void> {
    try {
        await incrementAchievementProgress(userId, 'Influencer', 4);
    } catch (error) {
        console.warn('[gamification] failed to handle gained follower', { userId, error });
    }
}

function startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);

    return copy;
}

function isSameDay(a: Date, b: Date): boolean {
    return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** A streak continues when the last activity was yesterday and resets when a day was missed. */
export async function recordDailyStreak(userId: number): Promise<void> {
    try {
        const [existing] = await db
            .select({ id: streaks.id, count: streaks.count, activityAt: streaks.activityAt })
            .from(streaks)
            .where(eq(streaks.userId, userId))
            .limit(1);

        const now = new Date();

        if (!existing) {
            await db.insert(streaks).values({ userId, count: 1, activityAt: now, createdAt: now, updatedAt: now });

            return;
        }

        const lastActivity = existing.activityAt;

        if (lastActivity && isSameDay(lastActivity, now)) {
            return;
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const continues = lastActivity ? isSameDay(lastActivity, yesterday) : false;

        await db
            .update(streaks)
            .set({ count: continues ? (existing.count ?? 0) + 1 : 1, activityAt: now, updatedAt: now })
            .where(eq(streaks.id, existing.id));
    } catch (error) {
        console.warn('[gamification] failed to record streak', { userId, error });
    }
}

export type LevelInfo = { level: number; points: number; next_level_at: number | null };

export async function getLevelInfo(userId: number): Promise<LevelInfo> {
    const [row] = await db
        .select({ points: userExperience.experiencePoints, level: userExperience.level })
        .from(userExperience)
        .where(eq(userExperience.userId, userId))
        .limit(1);

    const level = row?.level ?? 1;
    const points = row?.points ?? 0;

    const [next] = await db.select({ nextLevelExperience: levels.nextLevelExperience }).from(levels).where(eq(levels.level, level + 1)).limit(1);

    return { level, points, next_level_at: next?.nextLevelExperience ?? null };
}

export type StreakInfo = { current: number; active_today: boolean };

export async function getStreakInfo(userId: number): Promise<StreakInfo> {
    const [row] = await db
        .select({ count: streaks.count, activityAt: streaks.activityAt })
        .from(streaks)
        .where(eq(streaks.userId, userId))
        .limit(1);

    if (!row) {
        return { current: 0, active_today: false };
    }

    return { current: row.count ?? 0, active_today: row.activityAt ? isSameDay(row.activityAt, new Date()) : false };
}

export async function getEarnedAchievements(userId: number): Promise<Array<{ name: string; progress: number | null }>> {
    return db
        .select({ name: achievementsTable.name, progress: achievementUser.progress })
        .from(achievementUser)
        .innerJoin(achievementsTable, eq(achievementsTable.id, achievementUser.achievementId))
        .where(and(eq(achievementUser.userId, userId), sql`${achievementUser.progress} >= 100`));
}
