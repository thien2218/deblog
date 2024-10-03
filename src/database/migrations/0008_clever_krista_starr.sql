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
CREATE TABLE `reports` (
	`reporter_id` text NOT NULL,
	`reported_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`reason` text NOT NULL,
	`description` text,
	`reported_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`reporter_id`, `reported_id`),
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
