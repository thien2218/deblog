CREATE TABLE `contents` (
   `post_id` text PRIMARY KEY NOT NULL,
   `content` text NOT NULL,
   FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `posts`
   RENAME COLUMN `is_published` TO `published`;