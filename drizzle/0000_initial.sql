CREATE TYPE "public"."activity_media_type" AS ENUM('movie', 'tv', 'episode', 'person', 'collection', 'list');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('added_to_watchlist', 'rated', 'reviewed', 'completed', 'started_watching', 'updated_status');--> statement-breakpoint
CREATE TYPE "public"."collaborator_role" AS ENUM('editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."collaborator_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."favorite_media_type" AS ENUM('movie', 'tv', 'person');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('movie', 'tv');--> statement-breakpoint
CREATE TYPE "public"."watchlist_status" AS ENUM('plan_to_watch', 'watching', 'completed', 'dropped', 'on_hold');--> statement-breakpoint
CREATE TABLE "achievement_user" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"achievement_id" bigint NOT NULL,
	"progress" integer,
	"earned_at" timestamp with time zone,
	CONSTRAINT "achievement_user_unique" UNIQUE("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_secret" boolean DEFAULT false,
	"description" text,
	"image" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "activity_comments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_activity_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"body" varchar(500) NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_likes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_activity_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"created_at" timestamp with time zone,
	CONSTRAINT "activity_likes_user_activity_id_user_id_unique" UNIQUE("user_activity_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "admin_activity_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"admin_id" bigint NOT NULL,
	"action" varchar(255) NOT NULL,
	"model" varchar(255),
	"model_id" bigint,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clip_bookmarks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"clip_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "clip_bookmarks_clip_id_user_id_unique" UNIQUE("clip_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "clip_comments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"clip_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"body" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clip_reactions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"clip_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"type" varchar(255) NOT NULL,
	"created_at" timestamp with time zone,
	CONSTRAINT "clip_reactions_clip_id_user_id_unique" UNIQUE("clip_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "clips" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"tmdb_id" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"season_number" integer,
	"episode_number" integer,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"video_path" varchar(255) NOT NULL,
	"thumbnail_path" varchar(255),
	"is_published" boolean DEFAULT false,
	"views_count" bigint DEFAULT 0,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "collection_badges" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"collection_id" integer NOT NULL,
	"collection_name" varchar(255) NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone,
	CONSTRAINT "collection_badges_user_id_collection_id_unique" UNIQUE("user_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"conversation_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"last_read_at" timestamp with time zone,
	"created_at" timestamp with time zone,
	CONSTRAINT "conversation_participants_unique" UNIQUE("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"direct_message" boolean DEFAULT true,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "csv_import_reports" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"custom_list_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"imported" integer DEFAULT 0,
	"skipped" integer DEFAULT 0,
	"failed" integer DEFAULT 0,
	"report" jsonb,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "custom_list_collaborators" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"custom_list_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"role" "collaborator_role" DEFAULT 'editor',
	"status" "collaborator_status" DEFAULT 'pending',
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "custom_list_collaborators_custom_list_id_user_id_unique" UNIQUE("custom_list_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "custom_list_comment_replies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"custom_list_comment_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "custom_list_comments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"custom_list_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "custom_list_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"custom_list_id" bigint NOT NULL,
	"tmdb_id" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"position" integer DEFAULT 0,
	"notes" text,
	"title" varchar(255),
	"poster_path" varchar(255),
	"release_date" varchar(255),
	"vote_average" real,
	"overview" text,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "custom_list_items_custom_list_id_tmdb_id_media_type_unique" UNIQUE("custom_list_id","tmdb_id","media_type")
);
--> statement-breakpoint
CREATE TABLE "custom_list_likes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"custom_list_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"created_at" timestamp with time zone,
	CONSTRAINT "custom_list_likes_custom_list_id_user_id_unique" UNIQUE("custom_list_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "custom_lists" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"visibility" varchar(255) DEFAULT 'public',
	"items_count" integer DEFAULT 0,
	"likes_count" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "custom_lists_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "experience_audits" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"points" integer NOT NULL,
	"levelled_up" boolean DEFAULT false,
	"level_to" integer,
	"reason" varchar(255),
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"tmdb_id" integer NOT NULL,
	"media_type" "favorite_media_type" NOT NULL,
	"title" varchar(255),
	"poster_path" varchar(255),
	"release_date" date,
	"vote_average" real,
	"overview" text,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "favorites_user_id_tmdb_id_media_type_unique" UNIQUE("user_id","tmdb_id","media_type")
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"follower_id" bigint NOT NULL,
	"following_id" bigint NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "follows_follower_id_following_id_unique" UNIQUE("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "levels" (
	"level" integer PRIMARY KEY NOT NULL,
	"next_level_experience" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_mood_tags" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"tmdb_id" integer NOT NULL,
	"media_type" varchar(10) NOT NULL,
	"mood_tag_id" bigint NOT NULL,
	"created_at" timestamp with time zone,
	CONSTRAINT "media_mood_unique" UNIQUE("user_id","tmdb_id","media_type","mood_tag_id")
);
--> statement-breakpoint
CREATE TABLE "message_reactions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"message_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"reaction" varchar(50) NOT NULL,
	"created_at" timestamp with time zone,
	CONSTRAINT "message_reactions_unique" UNIQUE("message_id","user_id","reaction")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"conversation_id" bigint NOT NULL,
	"sender_id" bigint NOT NULL,
	"reply_to_id" bigint,
	"body" text NOT NULL,
	"type" varchar(255) DEFAULT 'text',
	"data" jsonb,
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mood_tags" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"icon" varchar(255),
	"color" varchar(255),
	"created_at" timestamp with time zone,
	CONSTRAINT "mood_tags_name_unique" UNIQUE("name"),
	CONSTRAINT "mood_tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" char(36) PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"type" varchar(255) NOT NULL,
	"data" jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"email" varchar(255) PRIMARY KEY NOT NULL,
	"token" varchar(255) NOT NULL,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "person_notes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"tmdb_person_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "person_notes_user_id_tmdb_person_id_unique" UNIQUE("user_id","tmdb_person_id")
);
--> statement-breakpoint
CREATE TABLE "review_reactions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"review_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"type" varchar(255) NOT NULL,
	"created_at" timestamp with time zone,
	CONSTRAINT "review_reactions_review_id_user_id_type_unique" UNIQUE("review_id","user_id","type")
);
--> statement-breakpoint
CREATE TABLE "review_replies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"review_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "review_reply_likes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"review_reply_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"created_at" timestamp with time zone,
	CONSTRAINT "review_reply_likes_review_reply_id_user_id_unique" UNIQUE("review_reply_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "review_reports" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"review_id" bigint NOT NULL,
	"reporter_id" bigint NOT NULL,
	"reason" varchar(255) NOT NULL,
	"details" text,
	"status" varchar(255) DEFAULT 'pending',
	"resolved_by" bigint,
	"resolution_note" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"tmdb_id" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"rating" smallint NOT NULL,
	"title" varchar(255),
	"content" text,
	"has_spoilers" boolean DEFAULT false,
	"spoiler_tags" jsonb,
	"is_edited" boolean DEFAULT false,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "reviews_user_id_tmdb_id_media_type_unique" UNIQUE("user_id","tmdb_id","media_type")
);
--> statement-breakpoint
CREATE TABLE "season_ratings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"tmdb_id" integer NOT NULL,
	"season_number" smallint NOT NULL,
	"rating" smallint NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "season_ratings_user_id_tmdb_id_season_number_unique" UNIQUE("user_id","tmdb_id","season_number")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" char(64) PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"two_factor_confirmed_at" timestamp with time zone,
	"impersonator_id" bigint,
	"last_activity_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streaks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"count" integer DEFAULT 1,
	"activity_at" timestamp with time zone,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_activities" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"tmdb_id" integer NOT NULL,
	"media_type" "activity_media_type" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_blocks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"blocker_id" bigint NOT NULL,
	"blocked_id" bigint NOT NULL,
	"reason" varchar(255),
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "user_blocks_blocker_id_blocked_id_unique" UNIQUE("blocker_id","blocked_id")
);
--> statement-breakpoint
CREATE TABLE "user_experience" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"experience_points" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"google_id" varchar(255),
	"avatar" varchar(255),
	"bio" text,
	"password_hash" varchar(255) NOT NULL,
	"email_verified_at" timestamp with time zone,
	"is_admin" boolean DEFAULT false,
	"banned_at" timestamp with time zone,
	"ban_reason" text,
	"allow_direct_messages" boolean DEFAULT true,
	"show_presence" boolean DEFAULT true,
	"notification_preferences" jsonb,
	"two_factor_secret" varchar(64),
	"two_factor_recovery_codes" jsonb,
	"two_factor_confirmed_at" timestamp with time zone,
	"onboarded_at" timestamp with time zone,
	"last_online_at" timestamp with time zone,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "watch_histories" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"tmdb_id" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"season_number" integer,
	"episode_number" integer,
	"title" varchar(255),
	"poster_path" varchar(255),
	"progress" integer DEFAULT 0,
	"duration" integer DEFAULT 0,
	"last_watched_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "watch_histories_unique" UNIQUE("user_id","tmdb_id","media_type","season_number","episode_number")
);
--> statement-breakpoint
CREATE TABLE "watched_episodes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"tmdb_id" integer NOT NULL,
	"season_number" integer NOT NULL,
	"episode_number" integer NOT NULL,
	"watched_at" timestamp with time zone,
	"created_at" timestamp with time zone,
	CONSTRAINT "watched_episodes_unique" UNIQUE("user_id","tmdb_id","season_number","episode_number")
);
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"tmdb_id" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"status" "watchlist_status" DEFAULT 'plan_to_watch' NOT NULL,
	"title" varchar(255),
	"overview" text,
	"poster_path" varchar(255),
	"release_date" date,
	"vote_average" real,
	"genre_ids" jsonb,
	"current_season" integer,
	"current_episode" integer,
	"total_seasons" integer,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "watchlist_items_user_id_tmdb_id_media_type_unique" UNIQUE("user_id","tmdb_id","media_type")
);
--> statement-breakpoint
ALTER TABLE "achievement_user" ADD CONSTRAINT "achievement_user_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_user" ADD CONSTRAINT "achievement_user_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comments" ADD CONSTRAINT "activity_comments_user_activity_id_user_activities_id_fk" FOREIGN KEY ("user_activity_id") REFERENCES "public"."user_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comments" ADD CONSTRAINT "activity_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_likes" ADD CONSTRAINT "activity_likes_user_activity_id_user_activities_id_fk" FOREIGN KEY ("user_activity_id") REFERENCES "public"."user_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_likes" ADD CONSTRAINT "activity_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clip_bookmarks" ADD CONSTRAINT "clip_bookmarks_clip_id_clips_id_fk" FOREIGN KEY ("clip_id") REFERENCES "public"."clips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clip_bookmarks" ADD CONSTRAINT "clip_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clip_comments" ADD CONSTRAINT "clip_comments_clip_id_clips_id_fk" FOREIGN KEY ("clip_id") REFERENCES "public"."clips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clip_comments" ADD CONSTRAINT "clip_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clip_reactions" ADD CONSTRAINT "clip_reactions_clip_id_clips_id_fk" FOREIGN KEY ("clip_id") REFERENCES "public"."clips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clip_reactions" ADD CONSTRAINT "clip_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_badges" ADD CONSTRAINT "collection_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_import_reports" ADD CONSTRAINT "csv_import_reports_custom_list_id_custom_lists_id_fk" FOREIGN KEY ("custom_list_id") REFERENCES "public"."custom_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_import_reports" ADD CONSTRAINT "csv_import_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_list_collaborators" ADD CONSTRAINT "custom_list_collaborators_custom_list_id_custom_lists_id_fk" FOREIGN KEY ("custom_list_id") REFERENCES "public"."custom_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_list_collaborators" ADD CONSTRAINT "custom_list_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_list_comment_replies" ADD CONSTRAINT "custom_list_comment_replies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_list_comment_replies" ADD CONSTRAINT "custom_list_comment_replies_custom_list_comment_id_foreign" FOREIGN KEY ("custom_list_comment_id") REFERENCES "public"."custom_list_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_list_comments" ADD CONSTRAINT "custom_list_comments_custom_list_id_custom_lists_id_fk" FOREIGN KEY ("custom_list_id") REFERENCES "public"."custom_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_list_comments" ADD CONSTRAINT "custom_list_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_list_items" ADD CONSTRAINT "custom_list_items_custom_list_id_custom_lists_id_fk" FOREIGN KEY ("custom_list_id") REFERENCES "public"."custom_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_list_likes" ADD CONSTRAINT "custom_list_likes_custom_list_id_custom_lists_id_fk" FOREIGN KEY ("custom_list_id") REFERENCES "public"."custom_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_list_likes" ADD CONSTRAINT "custom_list_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_lists" ADD CONSTRAINT "custom_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_audits" ADD CONSTRAINT "experience_audits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_mood_tags" ADD CONSTRAINT "media_mood_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_mood_tags" ADD CONSTRAINT "media_mood_tags_mood_tag_id_mood_tags_id_fk" FOREIGN KEY ("mood_tag_id") REFERENCES "public"."mood_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_notes" ADD CONSTRAINT "person_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_reply_likes" ADD CONSTRAINT "review_reply_likes_review_reply_id_review_replies_id_fk" FOREIGN KEY ("review_reply_id") REFERENCES "public"."review_replies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_reply_likes" ADD CONSTRAINT "review_reply_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_ratings" ADD CONSTRAINT "season_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_experience" ADD CONSTRAINT "user_experience_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_histories" ADD CONSTRAINT "watch_histories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watched_episodes" ADD CONSTRAINT "watched_episodes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_comments_user_activity_id_created_at_index" ON "activity_comments" USING btree ("user_activity_id","created_at");--> statement-breakpoint
CREATE INDEX "admin_activity_logs_admin_id_created_at_index" ON "admin_activity_logs" USING btree ("admin_id","created_at");--> statement-breakpoint
CREATE INDEX "clip_comments_clip_id_created_at_index" ON "clip_comments" USING btree ("clip_id","created_at");--> statement-breakpoint
CREATE INDEX "clips_tmdb_id_media_type_index" ON "clips" USING btree ("tmdb_id","media_type");--> statement-breakpoint
CREATE INDEX "clips_created_at_index" ON "clips" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "custom_list_comments_custom_list_id_created_at_index" ON "custom_list_comments" USING btree ("custom_list_id","created_at");--> statement-breakpoint
CREATE INDEX "custom_list_items_position_index" ON "custom_list_items" USING btree ("position");--> statement-breakpoint
CREATE INDEX "custom_lists_user_id_visibility_index" ON "custom_lists" USING btree ("user_id","visibility");--> statement-breakpoint
CREATE INDEX "experience_audits_user_id_index" ON "experience_audits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "favorites_user_id_created_at_index" ON "favorites" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "follows_follower_id_index" ON "follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "follows_following_id_index" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_read_at_index" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "review_reports_review_id_status_index" ON "review_reports" USING btree ("review_id","status");--> statement-breakpoint
CREATE INDEX "review_reports_reporter_id_index" ON "review_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "reviews_tmdb_id_media_type_index" ON "reviews" USING btree ("tmdb_id","media_type");--> statement-breakpoint
CREATE INDEX "reviews_created_at_index" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_index" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_index" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_activities_user_id_created_at_index" ON "user_activities" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "user_activities_created_at_index" ON "user_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_blocks_blocked_id_index" ON "user_blocks" USING btree ("blocked_id");--> statement-breakpoint
CREATE INDEX "watched_episodes_user_id_tmdb_id_index" ON "watched_episodes" USING btree ("user_id","tmdb_id");--> statement-breakpoint
CREATE INDEX "watchlist_items_user_id_status_index" ON "watchlist_items" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "watchlist_items_user_id_status_updated_at_index" ON "watchlist_items" USING btree ("user_id","status","updated_at");