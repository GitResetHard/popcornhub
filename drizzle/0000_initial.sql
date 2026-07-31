CREATE TABLE `achievement_user` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`achievement_id` bigint unsigned NOT NULL,
	`progress` int,
	`earned_at` timestamp,
	CONSTRAINT `achievement_user_id` PRIMARY KEY(`id`),
	CONSTRAINT `achievement_user_unique` UNIQUE(`user_id`,`achievement_id`)
);
--> statement-breakpoint
CREATE TABLE `achievements` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`is_secret` boolean DEFAULT false,
	`description` text,
	`image` varchar(255),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activity_comments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_activity_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`body` varchar(500) NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `activity_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activity_likes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_activity_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`created_at` timestamp,
	CONSTRAINT `activity_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `activity_likes_user_activity_id_user_id_unique` UNIQUE(`user_activity_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `admin_activity_logs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`admin_id` bigint unsigned NOT NULL,
	`action` varchar(255) NOT NULL,
	`model` varchar(255),
	`model_id` bigint unsigned,
	`old_values` json,
	`new_values` json,
	`ip_address` varchar(45),
	`created_at` timestamp NOT NULL,
	CONSTRAINT `admin_activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clip_bookmarks` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`clip_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `clip_bookmarks_id` PRIMARY KEY(`id`),
	CONSTRAINT `clip_bookmarks_clip_id_user_id_unique` UNIQUE(`clip_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `clip_comments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`clip_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`body` varchar(500) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `clip_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clip_reactions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`clip_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`type` varchar(255) NOT NULL,
	`created_at` timestamp,
	CONSTRAINT `clip_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `clip_reactions_clip_id_user_id_unique` UNIQUE(`clip_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `clips` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`tmdb_id` int unsigned NOT NULL,
	`media_type` enum('movie','tv') NOT NULL,
	`season_number` int unsigned,
	`episode_number` int unsigned,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`video_path` varchar(255) NOT NULL,
	`thumbnail_path` varchar(255),
	`is_published` boolean DEFAULT false,
	`views_count` bigint unsigned DEFAULT 0,
	`created_at` timestamp,
	`updated_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `clips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collection_badges` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`collection_id` int unsigned NOT NULL,
	`collection_name` varchar(255) NOT NULL,
	`completed_at` datetime NOT NULL,
	`created_at` timestamp,
	CONSTRAINT `collection_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `collection_badges_user_id_collection_id_unique` UNIQUE(`user_id`,`collection_id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_participants` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`conversation_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`last_read_at` timestamp,
	`created_at` timestamp,
	CONSTRAINT `conversation_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversation_participants_unique` UNIQUE(`conversation_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`direct_message` boolean DEFAULT true,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `csv_import_reports` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`custom_list_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`imported` int unsigned DEFAULT 0,
	`skipped` int unsigned DEFAULT 0,
	`failed` int unsigned DEFAULT 0,
	`report` json,
	`created_at` timestamp,
	CONSTRAINT `csv_import_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_list_collaborators` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`custom_list_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`role` enum('editor','viewer') DEFAULT 'editor',
	`status` enum('pending','accepted','rejected') DEFAULT 'pending',
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `custom_list_collaborators_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_list_collaborators_custom_list_id_user_id_unique` UNIQUE(`custom_list_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `custom_list_comment_replies` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`custom_list_comment_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `custom_list_comment_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_list_comments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`custom_list_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `custom_list_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_list_items` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`custom_list_id` bigint unsigned NOT NULL,
	`tmdb_id` int unsigned NOT NULL,
	`media_type` enum('movie','tv') NOT NULL,
	`position` int unsigned DEFAULT 0,
	`notes` text,
	`title` varchar(255),
	`poster_path` varchar(255),
	`release_date` varchar(255),
	`vote_average` float,
	`overview` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `custom_list_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_list_items_custom_list_id_tmdb_id_media_type_unique` UNIQUE(`custom_list_id`,`tmdb_id`,`media_type`)
);
--> statement-breakpoint
CREATE TABLE `custom_list_likes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`custom_list_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`created_at` timestamp,
	CONSTRAINT `custom_list_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_list_likes_custom_list_id_user_id_unique` UNIQUE(`custom_list_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `custom_lists` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`visibility` varchar(255) DEFAULT 'public',
	`items_count` int unsigned DEFAULT 0,
	`likes_count` int unsigned DEFAULT 0,
	`comments_count` int unsigned DEFAULT 0,
	`created_at` timestamp,
	`updated_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `custom_lists_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_lists_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `experience_audits` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`points` int NOT NULL,
	`levelled_up` boolean DEFAULT false,
	`level_to` int,
	`reason` varchar(255),
	`created_at` timestamp,
	CONSTRAINT `experience_audits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`tmdb_id` int unsigned NOT NULL,
	`media_type` enum('movie','tv','person') NOT NULL,
	`title` varchar(255),
	`poster_path` varchar(255),
	`release_date` date,
	`vote_average` decimal(3,1),
	`overview` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorites_user_id_tmdb_id_media_type_unique` UNIQUE(`user_id`,`tmdb_id`,`media_type`)
);
--> statement-breakpoint
CREATE TABLE `follows` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`follower_id` bigint unsigned NOT NULL,
	`following_id` bigint unsigned NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `follows_id` PRIMARY KEY(`id`),
	CONSTRAINT `follows_follower_id_following_id_unique` UNIQUE(`follower_id`,`following_id`)
);
--> statement-breakpoint
CREATE TABLE `levels` (
	`level` int NOT NULL,
	`next_level_experience` int NOT NULL,
	CONSTRAINT `levels_level` PRIMARY KEY(`level`)
);
--> statement-breakpoint
CREATE TABLE `media_mood_tags` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned,
	`tmdb_id` int unsigned NOT NULL,
	`media_type` varchar(10) NOT NULL,
	`mood_tag_id` bigint unsigned NOT NULL,
	`created_at` timestamp,
	CONSTRAINT `media_mood_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_mood_unique` UNIQUE(`user_id`,`tmdb_id`,`media_type`,`mood_tag_id`)
);
--> statement-breakpoint
CREATE TABLE `message_reactions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`message_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`reaction` varchar(50) NOT NULL,
	`created_at` timestamp,
	CONSTRAINT `message_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `message_reactions_unique` UNIQUE(`message_id`,`user_id`,`reaction`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`conversation_id` bigint unsigned NOT NULL,
	`sender_id` bigint unsigned NOT NULL,
	`reply_to_id` bigint unsigned,
	`body` text NOT NULL,
	`type` varchar(255) DEFAULT 'text',
	`data` json,
	`edited_at` timestamp,
	`deleted_at` timestamp,
	`created_at` timestamp,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mood_tags` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`icon` varchar(255),
	`color` varchar(255),
	`created_at` timestamp,
	CONSTRAINT `mood_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `mood_tags_name_unique` UNIQUE(`name`),
	CONSTRAINT `mood_tags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` char(36) NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`type` varchar(255) NOT NULL,
	`data` json NOT NULL,
	`read_at` timestamp,
	`created_at` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`email` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp,
	CONSTRAINT `password_reset_tokens_email` PRIMARY KEY(`email`)
);
--> statement-breakpoint
CREATE TABLE `person_notes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`tmdb_person_id` int unsigned NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `person_notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `person_notes_user_id_tmdb_person_id_unique` UNIQUE(`user_id`,`tmdb_person_id`)
);
--> statement-breakpoint
CREATE TABLE `review_reactions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`review_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`type` varchar(255) NOT NULL,
	`created_at` timestamp,
	CONSTRAINT `review_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_reactions_review_id_user_id_type_unique` UNIQUE(`review_id`,`user_id`,`type`)
);
--> statement-breakpoint
CREATE TABLE `review_replies` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`review_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `review_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_reply_likes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`review_reply_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`created_at` timestamp,
	CONSTRAINT `review_reply_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_reply_likes_review_reply_id_user_id_unique` UNIQUE(`review_reply_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `review_reports` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`review_id` bigint unsigned NOT NULL,
	`reporter_id` bigint unsigned NOT NULL,
	`reason` varchar(255) NOT NULL,
	`details` text,
	`status` varchar(255) DEFAULT 'pending',
	`resolved_by` bigint unsigned,
	`resolution_note` text,
	`resolved_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `review_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`tmdb_id` int unsigned NOT NULL,
	`media_type` enum('movie','tv') NOT NULL,
	`rating` tinyint unsigned NOT NULL,
	`title` varchar(255),
	`content` text,
	`has_spoilers` boolean DEFAULT false,
	`spoiler_tags` json,
	`is_edited` boolean DEFAULT false,
	`created_at` timestamp,
	`updated_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_user_id_tmdb_id_media_type_unique` UNIQUE(`user_id`,`tmdb_id`,`media_type`)
);
--> statement-breakpoint
CREATE TABLE `season_ratings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`tmdb_id` int unsigned NOT NULL,
	`season_number` smallint unsigned NOT NULL,
	`rating` tinyint unsigned NOT NULL,
	`notes` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `season_ratings_id` PRIMARY KEY(`id`),
	CONSTRAINT `season_ratings_user_id_tmdb_id_season_number_unique` UNIQUE(`user_id`,`tmdb_id`,`season_number`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` char(64) NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`two_factor_confirmed_at` timestamp,
	`impersonator_id` bigint unsigned,
	`last_activity_at` timestamp NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `streaks` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`count` int DEFAULT 1,
	`activity_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `streaks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_activities` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`activity_type` enum('added_to_watchlist','rated','reviewed','completed','started_watching','updated_status') NOT NULL,
	`tmdb_id` int unsigned NOT NULL,
	`media_type` enum('movie','tv','episode','person','collection','list') NOT NULL,
	`metadata` json,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `user_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_blocks` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`blocker_id` bigint unsigned NOT NULL,
	`blocked_id` bigint unsigned NOT NULL,
	`reason` varchar(255),
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `user_blocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_blocks_blocker_id_blocked_id_unique` UNIQUE(`blocker_id`,`blocked_id`)
);
--> statement-breakpoint
CREATE TABLE `user_experience` (
	`user_id` bigint unsigned NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`experience_points` int NOT NULL DEFAULT 0,
	`updated_at` timestamp,
	CONSTRAINT `user_experience_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`username` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`google_id` varchar(255),
	`avatar` varchar(255),
	`bio` text,
	`password_hash` varchar(255) NOT NULL,
	`email_verified_at` timestamp,
	`is_admin` boolean DEFAULT false,
	`banned_at` timestamp,
	`ban_reason` text,
	`allow_direct_messages` boolean DEFAULT true,
	`show_presence` boolean DEFAULT true,
	`notification_preferences` json,
	`two_factor_secret` varchar(64),
	`two_factor_recovery_codes` json,
	`two_factor_confirmed_at` timestamp,
	`onboarded_at` timestamp,
	`last_online_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watch_histories` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`tmdb_id` int unsigned NOT NULL,
	`media_type` enum('movie','tv') NOT NULL,
	`season_number` int unsigned,
	`episode_number` int unsigned,
	`title` varchar(255),
	`poster_path` varchar(255),
	`progress` int unsigned DEFAULT 0,
	`duration` int unsigned DEFAULT 0,
	`last_watched_at` timestamp NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `watch_histories_id` PRIMARY KEY(`id`),
	CONSTRAINT `watch_histories_unique` UNIQUE(`user_id`,`tmdb_id`,`media_type`,`season_number`,`episode_number`)
);
--> statement-breakpoint
CREATE TABLE `watched_episodes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`tmdb_id` int unsigned NOT NULL,
	`season_number` int unsigned NOT NULL,
	`episode_number` int unsigned NOT NULL,
	`watched_at` timestamp,
	`created_at` timestamp,
	CONSTRAINT `watched_episodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `watched_episodes_unique` UNIQUE(`user_id`,`tmdb_id`,`season_number`,`episode_number`)
);
--> statement-breakpoint
CREATE TABLE `watchlist_items` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`tmdb_id` int unsigned NOT NULL,
	`media_type` enum('movie','tv') NOT NULL,
	`status` enum('plan_to_watch','watching','completed','dropped','on_hold') NOT NULL DEFAULT 'plan_to_watch',
	`title` varchar(255),
	`overview` text,
	`poster_path` varchar(255),
	`release_date` date,
	`vote_average` decimal(3,1),
	`genre_ids` json,
	`current_season` int unsigned,
	`current_episode` int unsigned,
	`total_seasons` int unsigned,
	`started_at` timestamp,
	`completed_at` timestamp,
	`notes` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `watchlist_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `watchlist_items_user_id_tmdb_id_media_type_unique` UNIQUE(`user_id`,`tmdb_id`,`media_type`)
);
--> statement-breakpoint
ALTER TABLE `achievement_user` ADD CONSTRAINT `achievement_user_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `achievement_user` ADD CONSTRAINT `achievement_user_achievement_id_achievements_id_fk` FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_comments` ADD CONSTRAINT `activity_comments_user_activity_id_user_activities_id_fk` FOREIGN KEY (`user_activity_id`) REFERENCES `user_activities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_comments` ADD CONSTRAINT `activity_comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_likes` ADD CONSTRAINT `activity_likes_user_activity_id_user_activities_id_fk` FOREIGN KEY (`user_activity_id`) REFERENCES `user_activities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_likes` ADD CONSTRAINT `activity_likes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_activity_logs` ADD CONSTRAINT `admin_activity_logs_admin_id_users_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clip_bookmarks` ADD CONSTRAINT `clip_bookmarks_clip_id_clips_id_fk` FOREIGN KEY (`clip_id`) REFERENCES `clips`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clip_bookmarks` ADD CONSTRAINT `clip_bookmarks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clip_comments` ADD CONSTRAINT `clip_comments_clip_id_clips_id_fk` FOREIGN KEY (`clip_id`) REFERENCES `clips`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clip_comments` ADD CONSTRAINT `clip_comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clip_reactions` ADD CONSTRAINT `clip_reactions_clip_id_clips_id_fk` FOREIGN KEY (`clip_id`) REFERENCES `clips`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clip_reactions` ADD CONSTRAINT `clip_reactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clips` ADD CONSTRAINT `clips_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collection_badges` ADD CONSTRAINT `collection_badges_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_participants` ADD CONSTRAINT `conversation_participants_conversation_id_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_participants` ADD CONSTRAINT `conversation_participants_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `csv_import_reports` ADD CONSTRAINT `csv_import_reports_custom_list_id_custom_lists_id_fk` FOREIGN KEY (`custom_list_id`) REFERENCES `custom_lists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `csv_import_reports` ADD CONSTRAINT `csv_import_reports_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_list_collaborators` ADD CONSTRAINT `custom_list_collaborators_custom_list_id_custom_lists_id_fk` FOREIGN KEY (`custom_list_id`) REFERENCES `custom_lists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_list_collaborators` ADD CONSTRAINT `custom_list_collaborators_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_list_comment_replies` ADD CONSTRAINT `custom_list_comment_replies_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_list_comment_replies` ADD CONSTRAINT `custom_list_comment_replies_custom_list_comment_id_foreign` FOREIGN KEY (`custom_list_comment_id`) REFERENCES `custom_list_comments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_list_comments` ADD CONSTRAINT `custom_list_comments_custom_list_id_custom_lists_id_fk` FOREIGN KEY (`custom_list_id`) REFERENCES `custom_lists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_list_comments` ADD CONSTRAINT `custom_list_comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_list_items` ADD CONSTRAINT `custom_list_items_custom_list_id_custom_lists_id_fk` FOREIGN KEY (`custom_list_id`) REFERENCES `custom_lists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_list_likes` ADD CONSTRAINT `custom_list_likes_custom_list_id_custom_lists_id_fk` FOREIGN KEY (`custom_list_id`) REFERENCES `custom_lists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_list_likes` ADD CONSTRAINT `custom_list_likes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_lists` ADD CONSTRAINT `custom_lists_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `experience_audits` ADD CONSTRAINT `experience_audits_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `follows` ADD CONSTRAINT `follows_follower_id_users_id_fk` FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `follows` ADD CONSTRAINT `follows_following_id_users_id_fk` FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_mood_tags` ADD CONSTRAINT `media_mood_tags_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_mood_tags` ADD CONSTRAINT `media_mood_tags_mood_tag_id_mood_tags_id_fk` FOREIGN KEY (`mood_tag_id`) REFERENCES `mood_tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_reactions` ADD CONSTRAINT `message_reactions_message_id_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_reactions` ADD CONSTRAINT `message_reactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `person_notes` ADD CONSTRAINT `person_notes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_reactions` ADD CONSTRAINT `review_reactions_review_id_reviews_id_fk` FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_reactions` ADD CONSTRAINT `review_reactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_replies` ADD CONSTRAINT `review_replies_review_id_reviews_id_fk` FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_replies` ADD CONSTRAINT `review_replies_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_reply_likes` ADD CONSTRAINT `review_reply_likes_review_reply_id_review_replies_id_fk` FOREIGN KEY (`review_reply_id`) REFERENCES `review_replies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_reply_likes` ADD CONSTRAINT `review_reply_likes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_reports` ADD CONSTRAINT `review_reports_review_id_reviews_id_fk` FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_reports` ADD CONSTRAINT `review_reports_reporter_id_users_id_fk` FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_reports` ADD CONSTRAINT `review_reports_resolved_by_users_id_fk` FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `season_ratings` ADD CONSTRAINT `season_ratings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `streaks` ADD CONSTRAINT `streaks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_activities` ADD CONSTRAINT `user_activities_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_blocks` ADD CONSTRAINT `user_blocks_blocker_id_users_id_fk` FOREIGN KEY (`blocker_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_blocks` ADD CONSTRAINT `user_blocks_blocked_id_users_id_fk` FOREIGN KEY (`blocked_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_experience` ADD CONSTRAINT `user_experience_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watch_histories` ADD CONSTRAINT `watch_histories_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watched_episodes` ADD CONSTRAINT `watched_episodes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchlist_items` ADD CONSTRAINT `watchlist_items_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_comments_user_activity_id_created_at_index` ON `activity_comments` (`user_activity_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `admin_activity_logs_admin_id_created_at_index` ON `admin_activity_logs` (`admin_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `clip_comments_clip_id_created_at_index` ON `clip_comments` (`clip_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `clips_tmdb_id_media_type_index` ON `clips` (`tmdb_id`,`media_type`);--> statement-breakpoint
CREATE INDEX `clips_created_at_index` ON `clips` (`created_at`);--> statement-breakpoint
CREATE INDEX `custom_list_comments_custom_list_id_created_at_index` ON `custom_list_comments` (`custom_list_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `custom_list_items_position_index` ON `custom_list_items` (`position`);--> statement-breakpoint
CREATE INDEX `custom_lists_user_id_visibility_index` ON `custom_lists` (`user_id`,`visibility`);--> statement-breakpoint
CREATE INDEX `experience_audits_user_id_index` ON `experience_audits` (`user_id`);--> statement-breakpoint
CREATE INDEX `favorites_user_id_created_at_index` ON `favorites` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `follows_follower_id_index` ON `follows` (`follower_id`);--> statement-breakpoint
CREATE INDEX `follows_following_id_index` ON `follows` (`following_id`);--> statement-breakpoint
CREATE INDEX `notifications_user_id_read_at_index` ON `notifications` (`user_id`,`read_at`);--> statement-breakpoint
CREATE INDEX `review_reports_review_id_status_index` ON `review_reports` (`review_id`,`status`);--> statement-breakpoint
CREATE INDEX `review_reports_reporter_id_index` ON `review_reports` (`reporter_id`);--> statement-breakpoint
CREATE INDEX `reviews_tmdb_id_media_type_index` ON `reviews` (`tmdb_id`,`media_type`);--> statement-breakpoint
CREATE INDEX `reviews_created_at_index` ON `reviews` (`created_at`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_index` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_at_index` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `user_activities_user_id_created_at_index` ON `user_activities` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `user_activities_created_at_index` ON `user_activities` (`created_at`);--> statement-breakpoint
CREATE INDEX `user_blocks_blocked_id_index` ON `user_blocks` (`blocked_id`);--> statement-breakpoint
CREATE INDEX `watched_episodes_user_id_tmdb_id_index` ON `watched_episodes` (`user_id`,`tmdb_id`);--> statement-breakpoint
CREATE INDEX `watchlist_items_user_id_status_index` ON `watchlist_items` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `watchlist_items_user_id_status_updated_at_index` ON `watchlist_items` (`user_id`,`status`,`updated_at`);