CREATE TABLE `new_post_series` (
	`series_id` text NOT NULL,
	`post_id` text NOT NULL,
	`order` integer NOT NULL,
   PRIMARY KEY(`post_id`, `series_id`),
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `new_post_series` SELECT `series_id`, `post_id`, `order` FROM `post_series`;--> statement-breakpoint
DROP TABLE `post_series`;--> statement-breakpoint
ALTER TABLE `new_post_series` RENAME TO `post_series`;--> statement-breakpoint
CREATE UNIQUE INDEX `post_order_unique` ON `post_series` (`post_id`,`order`);