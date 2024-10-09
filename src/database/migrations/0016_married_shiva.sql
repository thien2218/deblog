CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`pronoun` text DEFAULT 'they/them' NOT NULL,
	`profile_image` text,
	`role` text,
	`bio` text,
	`website` text,
	`country` text,
	`joined_since` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reactions` (
	`user_id` text NOT NULL,
	`target_id` text NOT NULL,
	`target_type` text NOT NULL,
	`reaction` text NOT NULL,
	PRIMARY KEY(`target_id`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `post_tags` ADD `original_tag` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `has_onboarded` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `pronoun`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `profile_image`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `role`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `bio`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `website`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `country`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `joined_since`;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text,
	`post_id` text,
   `parent_id` text,
   `mentions` text,
	`content` text NOT NULL,
	`edited` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE set null,
   FOREIGN KEY (`parent_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE cascade
);