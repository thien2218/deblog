ALTER TABLE `sessions`
   RENAME TO `sessions_old`;
--> statement-breakpoint
CREATE TABLE `sessions` (
   `id` text PRIMARY KEY NOT NULL,
   `user_id` text NOT NULL,
   `expires_at` integer NOT NULL,
   FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP TABLE `sessions_old`;
-->
ALTER TABLE `posts`
   RENAME TO `posts_old`;
--> statement-breakpoint
CREATE TABLE `posts` (
   `id` text PRIMARY KEY NOT NULL,
   `author_id` text NOT NULL,
   `title` text NOT NULL,
   `summary` text NOT NULL,
   `markdown_url` text NOT NULL,
   `created_at` integer DEFAULT (unixepoch()) NOT NULL,
   `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
   FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE
   set null
);
--> statement-breakpoint
DROP TABLE `posts_old`;
--> statement-breakpoint
ALTER TABLE `saved_posts`
   RENAME TO `saved_posts_old`;
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
DROP TABLE `saved_posts_old`;