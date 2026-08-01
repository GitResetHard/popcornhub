import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { clipBookmarks, clips, users } from '@/db/schema';

/** Read models for the community clips gallery. Uploading clips is out of scope here. */

export type ClipView = {
    id: number;
    title: string;
    description: string;
    thumbnailPath: string | null;
    tmdbId: number;
    mediaType: string;
    authorName: string;
    authorUsername: string;
    viewsCount: number;
    createdAt: string | null;
};

const selection = {
    id: clips.id,
    title: clips.title,
    description: clips.description,
    thumbnailPath: clips.thumbnailPath,
    tmdbId: clips.tmdbId,
    mediaType: clips.mediaType,
    authorName: users.name,
    authorUsername: users.username,
    viewsCount: clips.viewsCount,
    createdAt: clips.createdAt,
};

function toView(row: {
    id: number;
    title: string;
    description: string;
    thumbnailPath: string | null;
    tmdbId: number;
    mediaType: string;
    authorName: string;
    authorUsername: string;
    viewsCount: number | null;
    createdAt: Date | null;
}): ClipView {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        thumbnailPath: row.thumbnailPath,
        tmdbId: row.tmdbId,
        mediaType: row.mediaType,
        authorName: row.authorName,
        authorUsername: row.authorUsername,
        viewsCount: row.viewsCount ?? 0,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    };
}

export async function getPublishedClips(limit = 30): Promise<ClipView[]> {
    const rows = await db
        .select(selection)
        .from(clips)
        .innerJoin(users, eq(users.id, clips.userId))
        .where(and(eq(clips.isPublished, true), isNull(clips.deletedAt)))
        .orderBy(desc(clips.createdAt))
        .limit(limit);

    return rows.map(toView);
}

export async function getBookmarkedClips(userId: number, limit = 30): Promise<ClipView[]> {
    const rows = await db
        .select(selection)
        .from(clipBookmarks)
        .innerJoin(clips, eq(clips.id, clipBookmarks.clipId))
        .innerJoin(users, eq(users.id, clips.userId))
        .where(and(eq(clipBookmarks.userId, userId), isNull(clips.deletedAt)))
        .orderBy(desc(clipBookmarks.createdAt))
        .limit(limit);

    return rows.map(toView);
}
