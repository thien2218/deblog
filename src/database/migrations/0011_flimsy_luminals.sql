CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text,
	`post_id` text,
	`content` text NOT NULL,
	`edited` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`series_id` text,
	`series_order` integer,
	`author_id` text,
	`title` text NOT NULL,
	`description` text,
	`published` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`reporter` text NOT NULL,
	`reported` text NOT NULL,
	`resource_type` text NOT NULL,
	`reason` text NOT NULL,
	`description` text,
	`reported_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`reporter`, `reported`),
	FOREIGN KEY (`reporter`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
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
CREATE TABLE `series` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text,
	`title` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_post_added_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`subscriber` text NOT NULL,
	`subscribe_to` text NOT NULL,
	`subscribed_since` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`subscriber`, `subscribe_to`),
	FOREIGN KEY (`subscriber`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subscribe_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`provider` text DEFAULT 'email' NOT NULL,
	`encrypted_password` text,
	`email_verified` integer DEFAULT false NOT NULL,
	`name` text NOT NULL,
	`pronoun` text DEFAULT 'they/them' NOT NULL,
	`profile_image` text,
	`role` text,
	`bio` text,
	`website` text,
	`country` text,
	`joined_since` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_title_unique` ON `posts` (`title`);--> statement-breakpoint
CREATE UNIQUE INDEX `series_order_unique` ON `posts` (`series_id`,`series_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `series_title_unique` ON `series` (`title`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
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