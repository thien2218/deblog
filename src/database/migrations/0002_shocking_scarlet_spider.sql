ALTER TABLE `users` DROP COLUMN `provider`;
--> statement-breakpoint
ALTER TABLE `users`
ADD `provider` text DEFAULT 'email' NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `email_verified`;
--> statement-breakpoint
ALTER TABLE `users`
ADD `email_verified` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `posts`
ADD `is_published` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `posts` DROP COLUMN `markdown_url`;