import { relations } from 'drizzle-orm';
import {
    bigint,
    bigserial,
    boolean,
    char,
    date,
    foreignKey,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    real,
    smallint,
    text,
    timestamp,
    unique,
    varchar,
} from 'drizzle-orm/pg-core';
import type { ActivityType, CollaboratorRole, CollaboratorStatus, ListVisibility, MediaType, ReportStatus } from '@/lib/enums';

/**
 * The application's own schema, designed from the domain of the reference project.
 *
 * Names and shapes are chosen for this app, not inherited from any prior implementation. A
 * one-off import script (out of scope here) is the place to map a previous system onto it.
 *
 * The database is PostgreSQL (Neon on Vercel, plain Postgres locally and in CI). All timestamp
 * columns are `timestamptz` so instants round-trip without a timezone shift regardless of the
 * server's local zone.
 */

/** All timestamp columns store an absolute instant (`timestamptz`). */
const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/* ---------------------------------- enums --------------------------------- */

export const mediaTypeEnum = pgEnum('media_type', ['movie', 'tv']);
export const favoriteMediaTypeEnum = pgEnum('favorite_media_type', ['movie', 'tv', 'person']);
export const watchlistStatusEnum = pgEnum('watchlist_status', ['plan_to_watch', 'watching', 'completed', 'dropped', 'on_hold']);
export const collaboratorRoleEnum = pgEnum('collaborator_role', ['editor', 'viewer']);
export const collaboratorStatusEnum = pgEnum('collaborator_status', ['pending', 'accepted', 'rejected']);
export const activityTypeEnum = pgEnum('activity_type', [
    'added_to_watchlist',
    'rated',
    'reviewed',
    'completed',
    'started_watching',
    'updated_status',
]);
export const activityMediaTypeEnum = pgEnum('activity_media_type', ['movie', 'tv', 'episode', 'person', 'collection', 'list']);

/* ---------------------------------- users --------------------------------- */

export type NotificationPreferences = {
    follows?: boolean;
    review_replies?: boolean;
    review_reactions?: boolean;
    list_comments?: boolean;
    list_collaborations?: boolean;
};

export const users = pgTable('users', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    username: varchar('username', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    googleId: varchar('google_id', { length: 255 }),
    avatar: varchar('avatar', { length: 255 }),
    bio: text('bio'),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    emailVerifiedAt: ts('email_verified_at'),
    isAdmin: boolean('is_admin').default(false),
    bannedAt: ts('banned_at'),
    banReason: text('ban_reason'),
    allowDirectMessages: boolean('allow_direct_messages').default(true),
    showPresence: boolean('show_presence').default(true),
    notificationPreferences: jsonb('notification_preferences').$type<NotificationPreferences>(),
    twoFactorSecret: varchar('two_factor_secret', { length: 64 }),
    twoFactorRecoveryCodes: jsonb('two_factor_recovery_codes').$type<string[]>(),
    twoFactorConfirmedAt: ts('two_factor_confirmed_at'),
    onboardedAt: ts('onboarded_at'),
    lastOnlineAt: ts('last_online_at'),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
});

export const sessions = pgTable(
    'sessions',
    {
        id: char('id', { length: 64 }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        ipAddress: varchar('ip_address', { length: 45 }),
        userAgent: text('user_agent'),
        twoFactorConfirmedAt: ts('two_factor_confirmed_at'),
        impersonatorId: bigint('impersonator_id', { mode: 'number' }),
        lastActivityAt: ts('last_activity_at').notNull(),
        expiresAt: ts('expires_at').notNull(),
        createdAt: ts('created_at').notNull(),
    },
    (table) => [index('sessions_user_id_index').on(table.userId), index('sessions_expires_at_index').on(table.expiresAt)],
);

export const passwordResetTokens = pgTable('password_reset_tokens', {
    email: varchar('email', { length: 255 }).primaryKey(),
    token: varchar('token', { length: 255 }).notNull(),
    createdAt: ts('created_at'),
});

export const follows = pgTable(
    'follows',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        followerId: bigint('follower_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        followingId: bigint('following_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
    },
    (table) => [
        unique('follows_follower_id_following_id_unique').on(table.followerId, table.followingId),
        index('follows_follower_id_index').on(table.followerId),
        index('follows_following_id_index').on(table.followingId),
    ],
);

export const userBlocks = pgTable(
    'user_blocks',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        blockerId: bigint('blocker_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        blockedId: bigint('blocked_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        reason: varchar('reason', { length: 255 }),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
    },
    (table) => [
        unique('user_blocks_blocker_id_blocked_id_unique').on(table.blockerId, table.blockedId),
        index('user_blocks_blocked_id_index').on(table.blockedId),
    ],
);

export const notifications = pgTable(
    'notifications',
    {
        id: char('id', { length: 36 }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        type: varchar('type', { length: 255 }).notNull(),
        data: jsonb('data').$type<Record<string, unknown>>().notNull(),
        readAt: ts('read_at'),
        createdAt: ts('created_at'),
    },
    (table) => [index('notifications_user_id_read_at_index').on(table.userId, table.readAt)],
);

/* --------------------------------- tracking -------------------------------- */

export const watchlistItems = pgTable(
    'watchlist_items',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbId: integer('tmdb_id').notNull(),
        mediaType: mediaTypeEnum('media_type').notNull(),
        status: watchlistStatusEnum('status').default('plan_to_watch').notNull(),
        title: varchar('title', { length: 255 }),
        overview: text('overview'),
        posterPath: varchar('poster_path', { length: 255 }),
        releaseDate: date('release_date', { mode: 'string' }),
        voteAverage: real('vote_average'),
        genreIds: jsonb('genre_ids').$type<number[]>(),
        currentSeason: integer('current_season'),
        currentEpisode: integer('current_episode'),
        totalSeasons: integer('total_seasons'),
        startedAt: ts('started_at'),
        completedAt: ts('completed_at'),
        notes: text('notes'),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
        deletedAt: ts('deleted_at'),
    },
    (table) => [
        unique('watchlist_items_user_id_tmdb_id_media_type_unique').on(table.userId, table.tmdbId, table.mediaType),
        index('watchlist_items_user_id_status_index').on(table.userId, table.status),
        index('watchlist_items_user_id_status_updated_at_index').on(table.userId, table.status, table.updatedAt),
    ],
);

export const favorites = pgTable(
    'favorites',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbId: integer('tmdb_id').notNull(),
        mediaType: favoriteMediaTypeEnum('media_type').notNull(),
        title: varchar('title', { length: 255 }),
        posterPath: varchar('poster_path', { length: 255 }),
        releaseDate: date('release_date', { mode: 'string' }),
        voteAverage: real('vote_average'),
        overview: text('overview'),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
    },
    (table) => [
        unique('favorites_user_id_tmdb_id_media_type_unique').on(table.userId, table.tmdbId, table.mediaType),
        index('favorites_user_id_created_at_index').on(table.userId, table.createdAt),
    ],
);

export const watchedEpisodes = pgTable(
    'watched_episodes',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbId: integer('tmdb_id').notNull(),
        seasonNumber: integer('season_number').notNull(),
        episodeNumber: integer('episode_number').notNull(),
        watchedAt: ts('watched_at'),
        createdAt: ts('created_at'),
    },
    (table) => [
        unique('watched_episodes_unique').on(table.userId, table.tmdbId, table.seasonNumber, table.episodeNumber),
        index('watched_episodes_user_id_tmdb_id_index').on(table.userId, table.tmdbId),
    ],
);

export const watchHistories = pgTable(
    'watch_histories',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbId: integer('tmdb_id').notNull(),
        mediaType: mediaTypeEnum('media_type').notNull(),
        seasonNumber: integer('season_number'),
        episodeNumber: integer('episode_number'),
        title: varchar('title', { length: 255 }),
        posterPath: varchar('poster_path', { length: 255 }),
        progress: integer('progress').default(0),
        duration: integer('duration').default(0),
        lastWatchedAt: ts('last_watched_at').notNull(),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
    },
    (table) => [
        unique('watch_histories_unique').on(table.userId, table.tmdbId, table.mediaType, table.seasonNumber, table.episodeNumber),
    ],
);

export const seasonRatings = pgTable(
    'season_ratings',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbId: integer('tmdb_id').notNull(),
        seasonNumber: smallint('season_number').notNull(),
        rating: smallint('rating').notNull(),
        notes: text('notes'),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
    },
    (table) => [unique('season_ratings_user_id_tmdb_id_season_number_unique').on(table.userId, table.tmdbId, table.seasonNumber)],
);

export const personNotes = pgTable(
    'person_notes',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbPersonId: integer('tmdb_person_id').notNull(),
        content: text('content').notNull(),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
    },
    (table) => [unique('person_notes_user_id_tmdb_person_id_unique').on(table.userId, table.tmdbPersonId)],
);

export const collectionBadges = pgTable(
    'collection_badges',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        collectionId: integer('collection_id').notNull(),
        collectionName: varchar('collection_name', { length: 255 }).notNull(),
        completedAt: ts('completed_at').notNull(),
        createdAt: ts('created_at'),
    },
    (table) => [unique('collection_badges_user_id_collection_id_unique').on(table.userId, table.collectionId)],
);

export const moodTags = pgTable(
    'mood_tags',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        name: varchar('name', { length: 255 }).notNull(),
        slug: varchar('slug', { length: 255 }).notNull(),
        icon: varchar('icon', { length: 255 }),
        color: varchar('color', { length: 255 }),
        createdAt: ts('created_at'),
    },
    (table) => [unique('mood_tags_name_unique').on(table.name), unique('mood_tags_slug_unique').on(table.slug)],
);

export const mediaMoodTags = pgTable(
    'media_mood_tags',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
        tmdbId: integer('tmdb_id').notNull(),
        mediaType: varchar('media_type', { length: 10 }).$type<MediaType>().notNull(),
        moodTagId: bigint('mood_tag_id', { mode: 'number' })
            .notNull()
            .references(() => moodTags.id, { onDelete: 'cascade' }),
        createdAt: ts('created_at'),
    },
    (table) => [unique('media_mood_unique').on(table.userId, table.tmdbId, table.mediaType, table.moodTagId)],
);

/* --------------------------------- reviews --------------------------------- */

export const reviews = pgTable(
    'reviews',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbId: integer('tmdb_id').notNull(),
        mediaType: mediaTypeEnum('media_type').notNull(),
        rating: smallint('rating').notNull(),
        title: varchar('title', { length: 255 }),
        content: text('content'),
        hasSpoilers: boolean('has_spoilers').default(false),
        spoilerTags: jsonb('spoiler_tags').$type<string[]>(),
        isEdited: boolean('is_edited').default(false),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
        deletedAt: ts('deleted_at'),
    },
    (table) => [
        unique('reviews_user_id_tmdb_id_media_type_unique').on(table.userId, table.tmdbId, table.mediaType),
        index('reviews_tmdb_id_media_type_index').on(table.tmdbId, table.mediaType),
        index('reviews_created_at_index').on(table.createdAt),
    ],
);

export const reviewReactions = pgTable(
    'review_reactions',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        reviewId: bigint('review_id', { mode: 'number' })
            .notNull()
            .references(() => reviews.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        type: varchar('type', { length: 255 }).notNull(),
        createdAt: ts('created_at'),
    },
    (table) => [unique('review_reactions_review_id_user_id_type_unique').on(table.reviewId, table.userId, table.type)],
);

export const reviewReplies = pgTable('review_replies', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    reviewId: bigint('review_id', { mode: 'number' })
        .notNull()
        .references(() => reviews.id, { onDelete: 'cascade' }),
    userId: bigint('user_id', { mode: 'number' })
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
    deletedAt: ts('deleted_at'),
});

export const reviewReplyLikes = pgTable(
    'review_reply_likes',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        reviewReplyId: bigint('review_reply_id', { mode: 'number' })
            .notNull()
            .references(() => reviewReplies.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        createdAt: ts('created_at'),
    },
    (table) => [unique('review_reply_likes_review_reply_id_user_id_unique').on(table.reviewReplyId, table.userId)],
);

export const reviewReports = pgTable(
    'review_reports',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        reviewId: bigint('review_id', { mode: 'number' })
            .notNull()
            .references(() => reviews.id, { onDelete: 'cascade' }),
        reporterId: bigint('reporter_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        reason: varchar('reason', { length: 255 }).notNull(),
        details: text('details'),
        status: varchar('status', { length: 255 }).$type<ReportStatus>().default('pending'),
        resolvedBy: bigint('resolved_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
        resolutionNote: text('resolution_note'),
        resolvedAt: ts('resolved_at'),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
    },
    (table) => [
        index('review_reports_review_id_status_index').on(table.reviewId, table.status),
        index('review_reports_reporter_id_index').on(table.reporterId),
    ],
);

/* ---------------------------------- lists ---------------------------------- */

export const customLists = pgTable(
    'custom_lists',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 255 }).notNull(),
        slug: varchar('slug', { length: 255 }).notNull(),
        description: text('description'),
        visibility: varchar('visibility', { length: 255 }).$type<ListVisibility>().default('public'),
        itemsCount: integer('items_count').default(0),
        likesCount: integer('likes_count').default(0),
        commentsCount: integer('comments_count').default(0),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
        deletedAt: ts('deleted_at'),
    },
    (table) => [
        unique('custom_lists_slug_unique').on(table.slug),
        index('custom_lists_user_id_visibility_index').on(table.userId, table.visibility),
    ],
);

export const customListItems = pgTable(
    'custom_list_items',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        customListId: bigint('custom_list_id', { mode: 'number' })
            .notNull()
            .references(() => customLists.id, { onDelete: 'cascade' }),
        tmdbId: integer('tmdb_id').notNull(),
        mediaType: mediaTypeEnum('media_type').notNull(),
        position: integer('position').default(0),
        notes: text('notes'),
        title: varchar('title', { length: 255 }),
        posterPath: varchar('poster_path', { length: 255 }),
        releaseDate: varchar('release_date', { length: 255 }),
        voteAverage: real('vote_average'),
        overview: text('overview'),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
    },
    (table) => [
        unique('custom_list_items_custom_list_id_tmdb_id_media_type_unique').on(table.customListId, table.tmdbId, table.mediaType),
        index('custom_list_items_position_index').on(table.position),
    ],
);

export const customListLikes = pgTable(
    'custom_list_likes',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        customListId: bigint('custom_list_id', { mode: 'number' })
            .notNull()
            .references(() => customLists.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        createdAt: ts('created_at'),
    },
    (table) => [unique('custom_list_likes_custom_list_id_user_id_unique').on(table.customListId, table.userId)],
);

export const customListComments = pgTable(
    'custom_list_comments',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        customListId: bigint('custom_list_id', { mode: 'number' })
            .notNull()
            .references(() => customLists.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        content: text('content').notNull(),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
        deletedAt: ts('deleted_at'),
    },
    (table) => [index('custom_list_comments_custom_list_id_created_at_index').on(table.customListId, table.createdAt)],
);

export const customListCommentReplies = pgTable(
    'custom_list_comment_replies',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        customListCommentId: bigint('custom_list_comment_id', { mode: 'number' }).notNull(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        content: text('content').notNull(),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
        deletedAt: ts('deleted_at'),
    },
    (table) => [
        foreignKey({
            name: 'custom_list_comment_replies_custom_list_comment_id_foreign',
            columns: [table.customListCommentId],
            foreignColumns: [customListComments.id],
        }).onDelete('cascade'),
    ],
);

export const customListCollaborators = pgTable(
    'custom_list_collaborators',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        customListId: bigint('custom_list_id', { mode: 'number' })
            .notNull()
            .references(() => customLists.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        role: collaboratorRoleEnum('role').$type<CollaboratorRole>().default('editor'),
        status: collaboratorStatusEnum('status').$type<CollaboratorStatus>().default('pending'),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
    },
    (table) => [unique('custom_list_collaborators_custom_list_id_user_id_unique').on(table.customListId, table.userId)],
);

export const csvImportReports = pgTable('csv_import_reports', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    customListId: bigint('custom_list_id', { mode: 'number' })
        .notNull()
        .references(() => customLists.id, { onDelete: 'cascade' }),
    userId: bigint('user_id', { mode: 'number' })
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    imported: integer('imported').default(0),
    skipped: integer('skipped').default(0),
    failed: integer('failed').default(0),
    report: jsonb('report').$type<Record<string, unknown>>(),
    createdAt: ts('created_at'),
});

/* -------------------------------- activity -------------------------------- */

export const userActivities = pgTable(
    'user_activities',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        activityType: activityTypeEnum('activity_type').$type<ActivityType>().notNull(),
        tmdbId: integer('tmdb_id').notNull(),
        mediaType: activityMediaTypeEnum('media_type').notNull(),
        metadata: jsonb('metadata').$type<Record<string, unknown>>(),
        createdAt: ts('created_at').notNull(),
    },
    (table) => [
        index('user_activities_user_id_created_at_index').on(table.userId, table.createdAt),
        index('user_activities_created_at_index').on(table.createdAt),
    ],
);

export const activityLikes = pgTable(
    'activity_likes',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userActivityId: bigint('user_activity_id', { mode: 'number' })
            .notNull()
            .references(() => userActivities.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        createdAt: ts('created_at'),
    },
    (table) => [unique('activity_likes_user_activity_id_user_id_unique').on(table.userActivityId, table.userId)],
);

export const activityComments = pgTable(
    'activity_comments',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userActivityId: bigint('user_activity_id', { mode: 'number' })
            .notNull()
            .references(() => userActivities.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        body: varchar('body', { length: 500 }).notNull(),
        createdAt: ts('created_at').notNull(),
    },
    (table) => [index('activity_comments_user_activity_id_created_at_index').on(table.userActivityId, table.createdAt)],
);

export const adminActivityLogs = pgTable(
    'admin_activity_logs',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        adminId: bigint('admin_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        action: varchar('action', { length: 255 }).notNull(),
        model: varchar('model', { length: 255 }),
        modelId: bigint('model_id', { mode: 'number' }),
        oldValues: jsonb('old_values').$type<Record<string, unknown>>(),
        newValues: jsonb('new_values').$type<Record<string, unknown>>(),
        ipAddress: varchar('ip_address', { length: 45 }),
        createdAt: ts('created_at').notNull(),
    },
    (table) => [index('admin_activity_logs_admin_id_created_at_index').on(table.adminId, table.createdAt)],
);

/* ---------------------------------- clips ---------------------------------- */

export const clips = pgTable(
    'clips',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbId: integer('tmdb_id').notNull(),
        mediaType: mediaTypeEnum('media_type').notNull(),
        seasonNumber: integer('season_number'),
        episodeNumber: integer('episode_number'),
        title: varchar('title', { length: 255 }).notNull(),
        description: text('description').notNull(),
        videoPath: varchar('video_path', { length: 255 }).notNull(),
        thumbnailPath: varchar('thumbnail_path', { length: 255 }),
        isPublished: boolean('is_published').default(false),
        viewsCount: bigint('views_count', { mode: 'number' }).default(0),
        createdAt: ts('created_at'),
        updatedAt: ts('updated_at'),
        deletedAt: ts('deleted_at'),
    },
    (table) => [
        index('clips_tmdb_id_media_type_index').on(table.tmdbId, table.mediaType),
        index('clips_created_at_index').on(table.createdAt),
    ],
);

export const clipReactions = pgTable(
    'clip_reactions',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        clipId: bigint('clip_id', { mode: 'number' })
            .notNull()
            .references(() => clips.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        type: varchar('type', { length: 255 }).notNull(),
        createdAt: ts('created_at'),
    },
    (table) => [unique('clip_reactions_clip_id_user_id_unique').on(table.clipId, table.userId)],
);

export const clipComments = pgTable(
    'clip_comments',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        clipId: bigint('clip_id', { mode: 'number' })
            .notNull()
            .references(() => clips.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        body: varchar('body', { length: 500 }).notNull(),
        createdAt: ts('created_at').defaultNow(),
    },
    (table) => [index('clip_comments_clip_id_created_at_index').on(table.clipId, table.createdAt)],
);

export const clipBookmarks = pgTable(
    'clip_bookmarks',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        clipId: bigint('clip_id', { mode: 'number' })
            .notNull()
            .references(() => clips.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        createdAt: ts('created_at').defaultNow(),
    },
    (table) => [unique('clip_bookmarks_clip_id_user_id_unique').on(table.clipId, table.userId)],
);

/* ----------------------------------- chat ---------------------------------- */

export const conversations = pgTable('conversations', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    directMessage: boolean('direct_message').default(true),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
});

export const conversationParticipants = pgTable(
    'conversation_participants',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        conversationId: bigint('conversation_id', { mode: 'number' })
            .notNull()
            .references(() => conversations.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        lastReadAt: ts('last_read_at'),
        createdAt: ts('created_at'),
    },
    (table) => [unique('conversation_participants_unique').on(table.conversationId, table.userId)],
);

export const messages = pgTable('messages', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    conversationId: bigint('conversation_id', { mode: 'number' })
        .notNull()
        .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: bigint('sender_id', { mode: 'number' })
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    replyToId: bigint('reply_to_id', { mode: 'number' }),
    body: text('body').notNull(),
    type: varchar('type', { length: 255 }).default('text'),
    data: jsonb('data').$type<Record<string, unknown>>(),
    editedAt: ts('edited_at'),
    deletedAt: ts('deleted_at'),
    createdAt: ts('created_at'),
});

export const messageReactions = pgTable(
    'message_reactions',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        messageId: bigint('message_id', { mode: 'number' })
            .notNull()
            .references(() => messages.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        reaction: varchar('reaction', { length: 50 }).notNull(),
        createdAt: ts('created_at'),
    },
    (table) => [unique('message_reactions_unique').on(table.messageId, table.userId, table.reaction)],
);

/* ------------------------------ gamification ------------------------------- */

export const levels = pgTable('levels', {
    level: integer('level').primaryKey(),
    nextLevelExperience: integer('next_level_experience').notNull(),
});

export const userExperience = pgTable('user_experience', {
    userId: bigint('user_id', { mode: 'number' })
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),
    level: integer('level').default(1).notNull(),
    experiencePoints: integer('experience_points').default(0).notNull(),
    updatedAt: ts('updated_at'),
});

export const experienceAudits = pgTable(
    'experience_audits',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        points: integer('points').notNull(),
        levelledUp: boolean('levelled_up').default(false),
        levelTo: integer('level_to'),
        reason: varchar('reason', { length: 255 }),
        createdAt: ts('created_at'),
    },
    (table) => [index('experience_audits_user_id_index').on(table.userId)],
);

export const achievements = pgTable('achievements', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    isSecret: boolean('is_secret').default(false),
    description: text('description'),
    image: varchar('image', { length: 255 }),
});

export const achievementUser = pgTable(
    'achievement_user',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        achievementId: bigint('achievement_id', { mode: 'number' })
            .notNull()
            .references(() => achievements.id, { onDelete: 'cascade' }),
        progress: integer('progress'),
        earnedAt: ts('earned_at'),
    },
    (table) => [unique('achievement_user_unique').on(table.userId, table.achievementId)],
);

export const streaks = pgTable('streaks', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    count: integer('count').default(1),
    activityAt: ts('activity_at'),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
});

/* -------------------------------- relations -------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
    following: many(follows, { relationName: 'follower' }),
    followers: many(follows, { relationName: 'following' }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
    follower: one(users, { fields: [follows.followerId], references: [users.id], relationName: 'follower' }),
    following: one(users, { fields: [follows.followingId], references: [users.id], relationName: 'following' }),
}));

export const watchlistItemsRelations = relations(watchlistItems, ({ one }) => ({
    user: one(users, { fields: [watchlistItems.userId], references: [users.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
    user: one(users, { fields: [reviews.userId], references: [users.id] }),
    reactions: many(reviewReactions),
    replies: many(reviewReplies),
}));

export const customListsRelations = relations(customLists, ({ one, many }) => ({
    user: one(users, { fields: [customLists.userId], references: [users.id] }),
    items: many(customListItems),
    likes: many(customListLikes),
}));

export const customListItemsRelations = relations(customListItems, ({ one }) => ({
    list: one(customLists, { fields: [customListItems.customListId], references: [customLists.id] }),
}));

export const userActivitiesRelations = relations(userActivities, ({ one, many }) => ({
    user: one(users, { fields: [userActivities.userId], references: [users.id] }),
    likes: many(activityLikes),
    comments: many(activityComments),
}));

export const clipsRelations = relations(clips, ({ one, many }) => ({
    user: one(users, { fields: [clips.userId], references: [users.id] }),
    reactions: many(clipReactions),
    comments: many(clipComments),
    bookmarks: many(clipBookmarks),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
    participants: many(conversationParticipants),
    messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
    conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
    sender: one(users, { fields: [messages.senderId], references: [users.id] }),
    reactions: many(messageReactions),
}));

/* ----------------------------------- types --------------------------------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type CustomList = typeof customLists.$inferSelect;
export type Clip = typeof clips.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
