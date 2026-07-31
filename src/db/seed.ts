import { eq } from 'drizzle-orm';
import { db, pool } from '@/db';
import { achievements, levels, users } from '@/db/schema';
import { hashPassword } from '@/lib/security';

/**
 * Seeds reference data: level thresholds, achievements, and an initial admin account.
 * Run with `npm run db:seed`.
 */

const LEVELS = Array.from({ length: 50 }, (_, index) => {
    const level = index + 1;

    return { level, nextLevelExperience: level === 1 ? 0 : index * 50 + (index - 1) * 25 };
});

const ACHIEVEMENTS = [
    { name: 'First Watch', description: 'Add your first title to the watchlist' },
    { name: 'Movie Buff', description: 'Complete 10 movies' },
    { name: 'Binge Watcher', description: 'Complete 10 TV shows' },
    { name: 'Cinephile', description: 'Complete 50 movies' },
    { name: 'Marathon Runner', description: 'Complete 100 TV shows' },
    { name: 'Critic', description: 'Write 5 reviews' },
    { name: 'Top Reviewer', description: 'Write 50 reviews' },
    { name: 'Social Butterfly', description: 'Follow 10 users' },
    { name: 'Influencer', description: 'Gain 25 followers' },
    { name: 'Curator', description: 'Create 5 public lists' },
    { name: 'Collector', description: 'Add 100 titles to your watchlist' },
    { name: 'Veteran', description: 'A member for a full year' },
];

async function seed() {
    for (const row of LEVELS) {
        await db
            .insert(levels)
            .values(row)
            .onConflictDoUpdate({ target: levels.level, set: { nextLevelExperience: row.nextLevelExperience } });
    }

    for (const row of ACHIEVEMENTS) {
        const [existing] = await db.select({ id: achievements.id }).from(achievements).where(eq(achievements.name, row.name)).limit(1);

        if (!existing) {
            await db.insert(achievements).values(row);
        }
    }

    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@moviestrackr.local';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'change-me-immediately';

    const [existingAdmin] = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail)).limit(1);

    if (!existingAdmin) {
        const now = new Date();

        await db.insert(users).values({
            name: 'Administrator',
            username: 'admin',
            email: adminEmail,
            passwordHash: hashPassword(adminPassword),
            emailVerifiedAt: now,
            isAdmin: true,
            createdAt: now,
            updatedAt: now,
        });

        console.log(`Created admin account ${adminEmail}`);
    }

    console.log('Seeded levels and achievements.');
}

seed()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
