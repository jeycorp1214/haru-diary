CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_date` text NOT NULL,
	`title` text,
	`content` text,
	`content_text` text NOT NULL,
	`mood_id` text,
	`weather` text,
	`temp_c` real,
	`location_name` text,
	`lat` real,
	`lng` real,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`mood_id`) REFERENCES `moods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_entries_entry_date` ON `entries` (`entry_date`);--> statement-breakpoint
CREATE INDEX `idx_entries_created_at` ON `entries` (`created_at`);--> statement-breakpoint
CREATE TABLE `entry_tags` (
	`entry_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`entry_id`, `tag_id`),
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_entry_tags_tag_id` ON `entry_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `moods` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`emoji` text NOT NULL,
	`label` text NOT NULL,
	`score` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `moods_key_unique` ON `moods` (`key`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`uri` text NOT NULL,
	`width` integer,
	`height` integer,
	`sort` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_photos_entry_id` ON `photos` (`entry_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);