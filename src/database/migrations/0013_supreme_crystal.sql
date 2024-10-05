CREATE TABLE `post_series` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`series_id` text NOT NULL,
	`order` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP TRIGGER IF EXISTS `check_published_post`;
--> statement-breakpoint
CREATE TABLE `new_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text,
	`title` text NOT NULL,
	`description` text,
	`published` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `new_posts` SELECT `id`, `author_id`, `title`, `description`, `published`, `created_at`, `updated_at` FROM `posts`;
--> statement-breakpoint
DROP TABLE `posts`;
--> statement-breakpoint
ALTER TABLE `new_posts` RENAME TO `posts`;
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_title_unique` ON `posts` (`title`);
--> statement-breakpoint
CREATE UNIQUE INDEX `series_order_unique` ON `post_series` (`post_id`,`series_id`,`order`);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `check_published_post` BEFORE
INSERT ON `saved_posts` FOR EACH ROW BEGIN
SELECT CASE
      WHEN (
         SELECT `published`
         from `posts`
         WHERE `id` = NEW.`post_id`
      ) = 0 THEN RAISE (
         ABORT,
         'Cannot save unpublished post'
      )
   END;
END;