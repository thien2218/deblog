ALTER TABLE `users` RENAME COLUMN `created_at` TO `joined_since`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `updated_at`;