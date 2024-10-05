DROP TABLE IF EXISTS `sessions`;
--> statement-breakpoint
CREATE TABLE `sessions` (
   `id` text PRIMARY KEY NOT NULL,
   `user_id` text NOT NULL,
   `expires_at` integer NOT NULL,
   FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP TABLE IF EXISTS `posts`;
--> statement-breakpoint
CREATE TABLE `posts` (
   `id` text PRIMARY KEY NOT NULL,
   `author_id` text NOT NULL,
   `title` text NOT NULL,
   `description` text,
   `published` integer DEFAULT false NOT NULL,
   `created_at` integer DEFAULT (unixepoch()) NOT NULL,
   `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
   FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE
   set null
);
--> statement-breakpoint
DROP TABLE IF EXISTS `saved_posts`;
--> statement-breakpoint
CREATE TABLE `saved_posts` (
   `user_id` text NOT NULL,
   `post_id` text NOT NULL,
   `saved_at` integer DEFAULT (unixepoch()) NOT NULL,
   PRIMARY KEY(`user_id`, `post_id`),
   FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
   FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
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