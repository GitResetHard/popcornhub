import { relations } from 'drizzle-orm';
import {
    bigint,
    boolean,
    char,
    date,
    datetime,
    decimal,
    float,
    foreignKey,
    index,
    int,
    json,
    mysqlEnum,
    mysqlTable,
    smallint,
    text,
    timestamp,
    tinyint,
    unique,
    varchar,
} from 'drizzle-orm/mysql-core';
import type { ActivityType, CollaboratorRole, CollaboratorStatus, ListVisibility, MediaType, ReportStatus } from '@/lib/enums';

/**
 * The application's own schema, designed from the domain of the reference project.
 *
 * Names and shapes are chosen for this app, not inherited from any prior implementation. A
 * one-off import script (out of scope here) is the place to map a previous system onto it.
 */

/* ---------------------------------- users --------------------------------- */

export type NotificationPreferences = {
    follows?: boolean;
    review_replies?: boolean;
    review_reactions?: boolean;
    list_comments?: boolean;
    list_collaborations?: boolean;
};

export const users = mysqlTable('users', {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    username: varchar('username', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    googleId: varchar('google_id', { length: 255 }),
    avatar: varchar('avatar', { length: 255 }),
    bio: text('bio'),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    emailVerifiedAt: timestamp('email_verified_at'),
    isAdmin: boolean('is_admin').default(false),
    bannedAt: timestamp('banned_at'),
    banReason: text('ban_reason'),
    allowDirectMessages: boolean('allow_direct_messages').default(true),
    showPresence: boolean('show_presence').default(true),
    notificationPreferences: json('notification_preferences').$type<NotificationPreferences>(),
    twoFactorSecret: varchar('two_factor_secret', { length: 64 }),
    twoFactorRecoveryCodes: json('two_factor_recovery_codes').$type<string[]>(),
    twoFactorConfirmedAt: timestamp('two_factor_confirmed_at'),
    onboardedAt: timestamp('onboarded_at'),
    lastOnlineAt: timestamp('last_online_at'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
});

export const sessions = mysqlTable(
    'sessions',
    {
        id: char('id', { length: 64 }).primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        ipAddress: varchar('ip_address', { length: 45 }),
        userAgent: text('user_agent'),
        twoFactorConfirmedAt: timestamp('two_factor_confirmed_at'),
        impersonatorId: bigint('impersonator_id', { mode: 'number', unsigned: true }),
        lastActivityAt: timestamp('last_activity_at').notNull(),
        expiresAt: timestamp('expires_at').notNull(),
        createdAt: timestamp('created_at').notNull(),
    },
    (table) => [index('sessions_user_id_index').on(table.userId), index('sessions_expires_at_index').on(table.expiresAt)],
);

export const passwordResetTokens = mysqlTable('password_reset_tokens', {
    email: varchar('email', { length: 255 }).primaryKey(),
    token: varchar('token', { length: 255 }).notNull(),
    createdAt: timestamp('created_at'),
});

export const follows = mysqlTable(
    'follows',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        followerId: bigint('follower_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        followingId: bigint('following_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
    },
    (table) => [
        unique('follows_follower_id_following_id_unique').on(table.followerId, table.followingId),
        index('follows_follower_id_index').on(table.followerId),
        index('follows_following_id_index').on(table.followingId),
    ],
);

export const userBlocks = mysqlTable(
    'user_blocks',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        blockerId: bigint('blocker_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        blockedId: bigint('blocked_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        reason: varchar('reason', { length: 255 }),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
    },
    (table) => [
        unique('user_blocks_blocker_id_blocked_id_unique').on(table.blockerId, table.blockedId),
        index('user_blocks_blocked_id_index').on(table.blockedId),
    ],
);

export const notifications = mysqlTable(
    'notifications',
    {
        id: char('id', { length: 36 }).primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        type: varchar('type', { length: 255 }).notNull(),
        data: json('data').$type<Record<string, unknown>>().notNull(),
        readAt: timestamp('read_at'),
        createdAt: timestamp('created_at'),
    },
    (table) => [index('notifications_user_id_read_at_index').on(table.userId, table.readAt)],
);

/* --------------------------------- tracking -------------------------------- */

export const watchlistItems = mysqlTable(
    'watchlist_items',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbId: int('tmdb_id', { unsigned: true }).notNull(),
        mediaType: mysqlEnum('media_type', ['movie', 'tv']).notNull(),
        status: mysqlEnum('status', ['plan_to_watch', 'watching', 'completed', 'dropped', 'on_hold'])
            .default('plan_to_watch')
            .notNull(),
        title: varchar('title', { length: 255 }),
        overview: text('overview'),
        posterPath: varchar('poster_path', { length: 255 }),
        releaseDate: date('release_date', { mode: 'string' }),
        voteAverage: decimal('vote_average', { precision: 3, scale: 1, mode: 'number' }),
        genreIds: json('genre_ids').$type<number[]>(),
        currentSeason: int('current_season', { unsigned: true }),
        currentEpisode: int('current_episode', { unsigned: true }),
        totalSeasons: int('total_seasons', { unsigned: true }),
        startedAt: timestamp('started_at'),
        completedAt: timestamp('completed_at'),
        notes: text('notes'),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
        deletedAt: timestamp('deleted_at'),
    },
    (table) => [
        unique('watchlist_items_user_id_tmdb_id_media_type_unique').on(table.userId, table.tmdbId, table.mediaType),
        index('watchlist_items_user_id_status_index').on(table.userId, table.status),
        index('watchlist_items_user_id_status_updated_at_index').on(table.userId, table.status, table.updatedAt),
    ],
);

export const favorites = mysqlTable(
    'favorites',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbId: int('tmdb_id', { unsigned: true }).notNull(),
        mediaType: mysqlEnum('media_type', ['movie', 'tv', 'person']).notNull(),
        title: varchar('title', { length: 255 }),
        posterPath: varchar('poster_path', { length: 255 }),
        releaseDate: date('release_date', { mode: 'string' }),
        voteAverage: decimal('vote_average', { precision: 3, scale: 1, mode: 'number' }),
        overview: text('overview'),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
    },
    (table) => [
        unique('favorites_user_id_tmdb_id_media_type_unique').on(table.userId, table.tmdbId, table.mediaType),
        index('favorites_user_id_created_at_index').on(table.userId, table.createdAt),
    ],
);

export const watchedEpisodes = mysqlTable(
    'watched_episodes',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbId: int('tmdb_id', { unsigned: true }).notNull(),
        seasonNumber: int('season_number', { unsigned: true }).notNull(),
        episodeNumber: int('episode_number', { unsigned: true }).notNull(),
        watchedAt: timestamp('watched_at'),
        createdAt: timestamp('created_at'),
    },
    (table) => [
        unique('watched_episodes_unique').on(table.userId, table.tmdbId, table.seasonNumber, table.episodeNumber),
        index('watched_episodes_user_id_tmdb_id_index').on(table.userId, table.tmdbId),
    ],
);

export const watchHistories = mysqlTable(
    'watch_histories',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbId: int('tmdb_id', { unsigned: true }).notNull(),
        mediaType: mysqlEnum('media_type', ['movie', 'tv']).notNull(),
        seasonNumber: int('season_number', { unsigned: true }),
        episodeNumber: int('episode_number', { unsigned: true }),
        title: varchar('title', { length: 255 }),
        posterPath: varchar('poster_path', { length: 255 }),
        progress: int('progress', { unsigned: true }).default(0),
        duration: int('duration', { unsigned: true }).default(0),
        lastWatchedAt: timestamp('last_watched_at').notNull(),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
    },
    (table) => [
        unique('watch_histories_unique').on(table.userId, table.tmdbId, table.mediaType, table.seasonNumber, table.episodeNumber),
    ],
);

export const seasonRatings = mysqlTable(
    'season_ratings',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbId: int('tmdb_id', { unsigned: true }).notNull(),
        seasonNumber: smallint('season_number', { unsigned: true }).notNull(),
        rating: tinyint('rating', { unsigned: true }).notNull(),
        notes: text('notes'),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
    },
    (table) => [unique('season_ratings_user_id_tmdb_id_season_number_unique').on(table.userId, table.tmdbId, table.seasonNumber)],
);

export const personNotes = mysqlTable(
    'person_notes',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbPersonId: int('tmdb_person_id', { unsigned: true }).notNull(),
        content: text('content').notNull(),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
    },
    (table) => [unique('person_notes_user_id_tmdb_person_id_unique').on(table.userId, table.tmdbPersonId)],
);

export const collectionBadges = mysqlTable(
    'collection_badges',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        collectionId: int('collection_id', { unsigned: true }).notNull(),
        collectionName: varchar('collection_name', { length: 255 }).notNull(),
        completedAt: datetime('completed_at').notNull(),
        createdAt: timestamp('created_at'),
    },
    (table) => [unique('collection_badges_user_id_collection_id_unique').on(table.userId, table.collectionId)],
);

export const moodTags = mysqlTable(
    'mood_tags',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        name: varchar('name', { length: 255 }).notNull(),
        slug: varchar('slug', { length: 255 }).notNull(),
        icon: varchar('icon', { length: 255 }),
        color: varchar('color', { length: 255 }),
        createdAt: timestamp('created_at'),
    },
    (table) => [unique('mood_tags_name_unique').on(table.name), unique('mood_tags_slug_unique').on(table.slug)],
);

export const mediaMoodTags = mysqlTable(
    'media_mood_tags',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true }).references(() => users.id, { onDelete: 'set null' }),
        tmdbId: int('tmdb_id', { unsigned: true }).notNull(),
        mediaType: varchar('media_type', { length: 10 }).$type<MediaType>().notNull(),
        moodTagId: bigint('mood_tag_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => moodTags.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at'),
    },
    (table) => [unique('media_mood_unique').on(table.userId, table.tmdbId, table.mediaType, table.moodTagId)],
);

/* --------------------------------- reviews --------------------------------- */

export const reviews = mysqlTable(
    'reviews',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbId: int('tmdb_id', { unsigned: true }).notNull(),
        mediaType: mysqlEnum('media_type', ['movie', 'tv']).notNull(),
        rating: tinyint('rating', { unsigned: true }).notNull(),
        title: varchar('title', { length: 255 }),
        content: text('content'),
        hasSpoilers: boolean('has_spoilers').default(false),
        spoilerTags: json('spoiler_tags').$type<string[]>(),
        isEdited: boolean('is_edited').default(false),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
        deletedAt: timestamp('deleted_at'),
    },
    (table) => [
        unique('reviews_user_id_tmdb_id_media_type_unique').on(table.userId, table.tmdbId, table.mediaType),
        index('reviews_tmdb_id_media_type_index').on(table.tmdbId, table.mediaType),
        index('reviews_created_at_index').on(table.createdAt),
    ],
);

export const reviewReactions = mysqlTable(
    'review_reactions',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        reviewId: bigint('review_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => reviews.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        type: varchar('type', { length: 255 }).notNull(),
        createdAt: timestamp('created_at'),
    },
    (table) => [unique('review_reactions_review_id_user_id_type_unique').on(table.reviewId, table.userId, table.type)],
);

export const reviewReplies = mysqlTable('review_replies', {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    reviewId: bigint('review_id', { mode: 'number', unsigned: true })
        .notNull()
        .references(() => reviews.id, { onDelete: 'cascade' }),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
    deletedAt: timestamp('deleted_at'),
});

export const reviewReplyLikes = mysqlTable(
    'review_reply_likes',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        reviewReplyId: bigint('review_reply_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => reviewReplies.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at'),
    },
    (table) => [unique('review_reply_likes_review_reply_id_user_id_unique').on(table.reviewReplyId, table.userId)],
);

export const reviewReports = mysqlTable(
    'review_reports',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        reviewId: bigint('review_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => reviews.id, { onDelete: 'cascade' }),
        reporterId: bigint('reporter_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        reason: varchar('reason', { length: 255 }).notNull(),
        details: text('details'),
        status: varchar('status', { length: 255 }).$type<ReportStatus>().default('pending'),
        resolvedBy: bigint('resolved_by', { mode: 'number', unsigned: true }).references(() => users.id, { onDelete: 'set null' }),
        resolutionNote: text('resolution_note'),
        resolvedAt: timestamp('resolved_at'),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
    },
    (table) => [
        index('review_reports_review_id_status_index').on(table.reviewId, table.status),
        index('review_reports_reporter_id_index').on(table.reporterId),
    ],
);

/* ---------------------------------- lists ---------------------------------- */

export const customLists = mysqlTable(
    'custom_lists',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 255 }).notNull(),
        slug: varchar('slug', { length: 255 }).notNull(),
        description: text('description'),
        visibility: varchar('visibility', { length: 255 }).$type<ListVisibility>().default('public'),
        itemsCount: int('items_count', { unsigned: true }).default(0),
        likesCount: int('likes_count', { unsigned: true }).default(0),
        commentsCount: int('comments_count', { unsigned: true }).default(0),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
        deletedAt: timestamp('deleted_at'),
    },
    (table) => [
        unique('custom_lists_slug_unique').on(table.slug),
        index('custom_lists_user_id_visibility_index').on(table.userId, table.visibility),
    ],
);

export const customListItems = mysqlTable(
    'custom_list_items',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        customListId: bigint('custom_list_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => customLists.id, { onDelete: 'cascade' }),
        tmdbId: int('tmdb_id', { unsigned: true }).notNull(),
        mediaType: mysqlEnum('media_type', ['movie', 'tv']).notNull(),
        position: int('position', { unsigned: true }).default(0),
        notes: text('notes'),
        title: varchar('title', { length: 255 }),
        posterPath: varchar('poster_path', { length: 255 }),
        releaseDate: varchar('release_date', { length: 255 }),
        voteAverage: float('vote_average'),
        overview: text('overview'),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
    },
    (table) => [
        unique('custom_list_items_custom_list_id_tmdb_id_media_type_unique').on(table.customListId, table.tmdbId, table.mediaType),
        index('custom_list_items_position_index').on(table.position),
    ],
);

export const customListLikes = mysqlTable(
    'custom_list_likes',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        customListId: bigint('custom_list_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => customLists.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at'),
    },
    (table) => [unique('custom_list_likes_custom_list_id_user_id_unique').on(table.customListId, table.userId)],
);

export const customListComments = mysqlTable(
    'custom_list_comments',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        customListId: bigint('custom_list_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => customLists.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        content: text('content').notNull(),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
        deletedAt: timestamp('deleted_at'),
    },
    (table) => [index('custom_list_comments_custom_list_id_created_at_index').on(table.customListId, table.createdAt)],
);

export const customListCommentReplies = mysqlTable(
    'custom_list_comment_replies',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        customListCommentId: bigint('custom_list_comment_id', { mode: 'number', unsigned: true }).notNull(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        content: text('content').notNull(),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
        deletedAt: timestamp('deleted_at'),
    },
    (table) => [
        // Named explicitly because the generated name exceeds MySQL's 64-character limit.
        foreignKey({
            name: 'custom_list_comment_replies_custom_list_comment_id_foreign',
            columns: [table.customListCommentId],
            foreignColumns: [customListComments.id],
        }).onDelete('cascade'),
    ],
);

export const customListCollaborators = mysqlTable(
    'custom_list_collaborators',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        customListId: bigint('custom_list_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => customLists.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        role: mysqlEnum('role', ['editor', 'viewer']).$type<CollaboratorRole>().default('editor'),
        status: mysqlEnum('status', ['pending', 'accepted', 'rejected']).$type<CollaboratorStatus>().default('pending'),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
    },
    (table) => [unique('custom_list_collaborators_custom_list_id_user_id_unique').on(table.customListId, table.userId)],
);

export const csvImportReports = mysqlTable('csv_import_reports', {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    customListId: bigint('custom_list_id', { mode: 'number', unsigned: true })
        .notNull()
        .references(() => customLists.id, { onDelete: 'cascade' }),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    imported: int('imported', { unsigned: true }).default(0),
    skipped: int('skipped', { unsigned: true }).default(0),
    failed: int('failed', { unsigned: true }).default(0),
    report: json('report').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at'),
});

/* -------------------------------- activity -------------------------------- */

export const userActivities = mysqlTable(
    'user_activities',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        activityType: mysqlEnum('activity_type', [
            'added_to_watchlist',
            'rated',
            'reviewed',
            'completed',
            'started_watching',
            'updated_status',
        ])
            .$type<ActivityType>()
            .notNull(),
        tmdbId: int('tmdb_id', { unsigned: true }).notNull(),
        mediaType: mysqlEnum('media_type', ['movie', 'tv', 'episode', 'person', 'collection', 'list']).notNull(),
        metadata: json('metadata').$type<Record<string, unknown>>(),
        createdAt: timestamp('created_at').notNull(),
    },
    (table) => [
        index('user_activities_user_id_created_at_index').on(table.userId, table.createdAt),
        index('user_activities_created_at_index').on(table.createdAt),
    ],
);

export const activityLikes = mysqlTable(
    'activity_likes',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userActivityId: bigint('user_activity_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => userActivities.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at'),
    },
    (table) => [unique('activity_likes_user_activity_id_user_id_unique').on(table.userActivityId, table.userId)],
);

export const activityComments = mysqlTable(
    'activity_comments',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userActivityId: bigint('user_activity_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => userActivities.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        body: varchar('body', { length: 500 }).notNull(),
        createdAt: timestamp('created_at').notNull(),
    },
    (table) => [index('activity_comments_user_activity_id_created_at_index').on(table.userActivityId, table.createdAt)],
);

export const adminActivityLogs = mysqlTable(
    'admin_activity_logs',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        adminId: bigint('admin_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        action: varchar('action', { length: 255 }).notNull(),
        model: varchar('model', { length: 255 }),
        modelId: bigint('model_id', { mode: 'number', unsigned: true }),
        oldValues: json('old_values').$type<Record<string, unknown>>(),
        newValues: json('new_values').$type<Record<string, unknown>>(),
        ipAddress: varchar('ip_address', { length: 45 }),
        createdAt: timestamp('created_at').notNull(),
    },
    (table) => [index('admin_activity_logs_admin_id_created_at_index').on(table.adminId, table.createdAt)],
);

/* ---------------------------------- clips ---------------------------------- */

export const clips = mysqlTable(
    'clips',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tmdbId: int('tmdb_id', { unsigned: true }).notNull(),
        mediaType: mysqlEnum('media_type', ['movie', 'tv']).notNull(),
        seasonNumber: int('season_number', { unsigned: true }),
        episodeNumber: int('episode_number', { unsigned: true }),
        title: varchar('title', { length: 255 }).notNull(),
        description: text('description').notNull(),
        videoPath: varchar('video_path', { length: 255 }).notNull(),
        thumbnailPath: varchar('thumbnail_path', { length: 255 }),
        isPublished: boolean('is_published').default(false),
        viewsCount: bigint('views_count', { mode: 'number', unsigned: true }).default(0),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at'),
        deletedAt: timestamp('deleted_at'),
    },
    (table) => [
        index('clips_tmdb_id_media_type_index').on(table.tmdbId, table.mediaType),
        index('clips_created_at_index').on(table.createdAt),
    ],
);

export const clipReactions = mysqlTable(
    'clip_reactions',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        clipId: bigint('clip_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => clips.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        type: varchar('type', { length: 255 }).notNull(),
        createdAt: timestamp('created_at'),
    },
    (table) => [unique('clip_reactions_clip_id_user_id_unique').on(table.clipId, table.userId)],
);

export const clipComments = mysqlTable(
    'clip_comments',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        clipId: bigint('clip_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => clips.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        body: varchar('body', { length: 500 }).notNull(),
        createdAt: timestamp('created_at').defaultNow(),
    },
    (table) => [index('clip_comments_clip_id_created_at_index').on(table.clipId, table.createdAt)],
);

export const clipBookmarks = mysqlTable(
    'clip_bookmarks',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        clipId: bigint('clip_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => clips.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at').defaultNow(),
    },
    (table) => [unique('clip_bookmarks_clip_id_user_id_unique').on(table.clipId, table.userId)],
);

/* ----------------------------------- chat ---------------------------------- */

export const conversations = mysqlTable('conversations', {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    directMessage: boolean('direct_message').default(true),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
});

export const conversationParticipants = mysqlTable(
    'conversation_participants',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        conversationId: bigint('conversation_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => conversations.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        lastReadAt: timestamp('last_read_at'),
        createdAt: timestamp('created_at'),
    },
    (table) => [unique('conversation_participants_unique').on(table.conversationId, table.userId)],
);

export const messages = mysqlTable('messages', {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    conversationId: bigint('conversation_id', { mode: 'number', unsigned: true })
        .notNull()
        .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: bigint('sender_id', { mode: 'number', unsigned: true })
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    replyToId: bigint('reply_to_id', { mode: 'number', unsigned: true }),
    body: text('body').notNull(),
    type: varchar('type', { length: 255 }).default('text'),
    data: json('data').$type<Record<string, unknown>>(),
    editedAt: timestamp('edited_at'),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at'),
});

export const messageReactions = mysqlTable(
    'message_reactions',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        messageId: bigint('message_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => messages.id, { onDelete: 'cascade' }),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        reaction: varchar('reaction', { length: 50 }).notNull(),
        createdAt: timestamp('created_at'),
    },
    (table) => [unique('message_reactions_unique').on(table.messageId, table.userId, table.reaction)],
);

/* ------------------------------ gamification ------------------------------- */

export const levels = mysqlTable('levels', {
    level: int('level').primaryKey(),
    nextLevelExperience: int('next_level_experience').notNull(),
});

export const userExperience = mysqlTable('user_experience', {
    userId: bigint('user_id', { mode: 'number', unsigned: true })
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),
    level: int('level').default(1).notNull(),
    experiencePoints: int('experience_points').default(0).notNull(),
    updatedAt: timestamp('updated_at'),
});

export const experienceAudits = mysqlTable(
    'experience_audits',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        points: int('points').notNull(),
        levelledUp: boolean('levelled_up').default(false),
        levelTo: int('level_to'),
        reason: varchar('reason', { length: 255 }),
        createdAt: timestamp('created_at'),
    },
    (table) => [index('experience_audits_user_id_index').on(table.userId)],
);

export const achievements = mysqlTable('achievements', {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    isSecret: boolean('is_secret').default(false),
    description: text('description'),
    image: varchar('image', { length: 255 }),
});

export const achievementUser = mysqlTable(
    'achievement_user',
    {
        id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
        userId: bigint('user_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        achievementId: bigint('achievement_id', { mode: 'number', unsigned: true })
            .notNull()
            .references(() => achievements.id, { onDelete: 'cascade' }),
        progress: int('progress'),
        earnedAt: timestamp('earned_at'),
    },
    (table) => [unique('achievement_user_unique').on(table.userId, table.achievementId)],
);

export const streaks = mysqlTable('streaks', {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    count: int('count').default(1),
    activityAt: timestamp('activity_at'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
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
