CREATE TABLE `subscriptions` (
   `subscriber` text NOT NULL,
   `subscribe_to` text NOT NULL,
   `subscribed_since` integer DEFAULT (unixepoch()) NOT NULL,
   PRIMARY KEY(`subscriber`, `subscribe_to`),
   FOREIGN KEY (`subscriber`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
   FOREIGN KEY (`subscribe_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
   CHECK(`subscriber` != `subscribe_to`)
);
--> statement-breakpoint
DROP TABLE IF EXISTS `reports`;
--> statement-breakpoint
CREATE TABLE `reports` (
   `reporter` text NOT NULL,
   `reported` text NOT NULL,
   `resource_type` text NOT NULL,
   `reason` text NOT NULL,
   `description` text,
   `reported_at` integer DEFAULT (unixepoch()) NOT NULL,
   PRIMARY KEY(`reporter`, `reported`),
   FOREIGN KEY (`reporter`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);