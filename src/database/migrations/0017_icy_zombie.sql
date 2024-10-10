DROP TABLE `profiles`;--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`pronoun` text NOT NULL,
	`profile_image` text,
	`work` text,
	`bio` text,
	`website` text,
	`country` text,
	`joined_since` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `posts` ADD `cover_image` text;--> statement-breakpoint
ALTER TABLE `users` ADD `providers` text DEFAULT '["email"]' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `provider`;