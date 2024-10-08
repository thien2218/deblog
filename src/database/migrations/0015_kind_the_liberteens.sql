DROP INDEX IF EXISTS `post_order_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `series_order_unique` ON `post_series` (`series_id`,`order`);