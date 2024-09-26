ALTER TABLE `users` RENAME COLUMN `title` TO `role`;--> statement-breakpoint
ALTER TABLE `posts` ADD `description` text;--> statement-breakpoint
ALTER TABLE `posts` DROP COLUMN `summary`;