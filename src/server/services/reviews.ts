import { and, avg, count, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { reviews, userActivities, users } from '@/db/schema';
import type { MediaType } from '@/lib/enums';
import { checkAndGrantAchievements, grantXp, recordDailyStreak } from './gamification';

/** Written reviews with a 1–10 rating. Soft-deleted rows stay for audit but never render. */

type ReviewMediaType = Extract<MediaType, 'movie' | 'tv'>;

export type ReviewView = {
    id: number;
    userId: number;
    authorName: string;
    authorUsername: string;
    authorAvatar: string | null;
    rating: number;
    title: string | null;
    content: string | null;
    hasSpoilers: boolean;
    isEdited: boolean;
    createdAt: string | null;
};

const notDeleted = isNull(reviews.deletedAt);

export async function getReviewsForMedia(tmdbId: number, mediaType: ReviewMediaType): Promise<ReviewView[]> {
    const rows = await db
        .select({
            id: reviews.id,
            userId: reviews.userId,
            authorName: users.name,
            authorUsername: users.username,
            authorAvatar: users.avatar,
            rating: reviews.rating,
            title: reviews.title,
            content: reviews.content,
            hasSpoilers: reviews.hasSpoilers,
            isEdited: reviews.isEdited,
            createdAt: reviews.createdAt,
        })
        .from(reviews)
        .innerJoin(users, eq(users.id, reviews.userId))
        .where(and(eq(reviews.tmdbId, tmdbId), eq(reviews.mediaType, mediaType), notDeleted))
        .orderBy(desc(reviews.createdAt));

    return rows.map((row) => ({
        ...row,
        hasSpoilers: row.hasSpoilers ?? false,
        isEdited: row.isEdited ?? false,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    }));
}

export type MediaRatingSummary = { average: number | null; count: number };

export async function getMediaRatingSummary(tmdbId: number, mediaType: ReviewMediaType): Promise<MediaRatingSummary> {
    const [row] = await db
        .select({ average: avg(reviews.rating), value: count() })
        .from(reviews)
        .where(and(eq(reviews.tmdbId, tmdbId), eq(reviews.mediaType, mediaType), notDeleted));

    return { average: row?.average ? Number(row.average) : null, count: row?.value ?? 0 };
}

export async function getUserReview(userId: number, tmdbId: number, mediaType: ReviewMediaType) {
    const [row] = await db
        .select()
        .from(reviews)
        .where(and(eq(reviews.userId, userId), eq(reviews.tmdbId, tmdbId), eq(reviews.mediaType, mediaType), notDeleted))
        .limit(1);

    return row ?? null;
}

export async function countUserReviews(userId: number): Promise<number> {
    const [row] = await db
        .select({ value: count() })
        .from(reviews)
        .where(and(eq(reviews.userId, userId), notDeleted));

    return row?.value ?? 0;
}

export type UserReviewView = ReviewView & { tmdbId: number; mediaType: ReviewMediaType };

export async function getUserReviews(userId: number, limit = 20): Promise<UserReviewView[]> {
    const rows = await db
        .select()
        .from(reviews)
        .where(and(eq(reviews.userId, userId), notDeleted))
        .orderBy(desc(reviews.createdAt))
        .limit(limit);

    return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        authorName: '',
        authorUsername: '',
        authorAvatar: null,
        rating: row.rating,
        title: row.title,
        content: row.content,
        hasSpoilers: row.hasSpoilers ?? false,
        isEdited: row.isEdited ?? false,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
        tmdbId: row.tmdbId,
        mediaType: row.mediaType,
    }));
}

export type UpsertReviewInput = {
    userId: number;
    tmdbId: number;
    mediaType: ReviewMediaType;
    rating: number;
    title?: string | null;
    content?: string | null;
    hasSpoilers?: boolean;
};

export async function upsertReview(input: UpsertReviewInput): Promise<{ created: boolean }> {
    const existing = await getUserReview(input.userId, input.tmdbId, input.mediaType);
    const now = new Date();

    if (existing) {
        await db
            .update(reviews)
            .set({
                rating: input.rating,
                title: input.title ?? null,
                content: input.content ?? null,
                hasSpoilers: input.hasSpoilers ?? false,
                isEdited: true,
                deletedAt: null,
                updatedAt: now,
            })
            .where(eq(reviews.id, existing.id));

        return { created: false };
    }

    await db.insert(reviews).values({
        userId: input.userId,
        tmdbId: input.tmdbId,
        mediaType: input.mediaType,
        rating: input.rating,
        title: input.title ?? null,
        content: input.content ?? null,
        hasSpoilers: input.hasSpoilers ?? false,
        createdAt: now,
        updatedAt: now,
    });

    await db.insert(userActivities).values({
        userId: input.userId,
        activityType: 'reviewed',
        tmdbId: input.tmdbId,
        mediaType: input.mediaType,
        metadata: { rating: input.rating, title: input.title ?? null },
        createdAt: now,
    });

    await grantXp(input.userId, 'write_review');
    await checkAndGrantAchievements(input.userId, 'write_review');
    await recordDailyStreak(input.userId);

    return { created: true };
}

export async function deleteReview(userId: number, reviewId: number): Promise<void> {
    await db
        .update(reviews)
        .set({ deletedAt: new Date() })
        .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)));
}
