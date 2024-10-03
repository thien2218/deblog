CREATE TABLE `saved_posts` (
   `user_id` text NOT NULL,
   `post_id` text NOT NULL,
   `saved_at` integer DEFAULT (unixepoch()) NOT NULL,
   `is_deleted` integer DEFAULT false,
   PRIMARY KEY(`user_id`, `post_id`),
   FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
   FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);