CREATE TABLE `branches` (
	`id` text PRIMARY KEY NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text DEFAULT '' NOT NULL,
	`address_ar` text NOT NULL,
	`address_en` text DEFAULT '' NOT NULL,
	`phone` text NOT NULL,
	`map_url` text NOT NULL,
	`hours_json` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `dining_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`branch_id` text NOT NULL,
	`table_number` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`subtotal_mils` integer DEFAULT 0 NOT NULL,
	`tax_mils` integer DEFAULT 0 NOT NULL,
	`total_mils` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`closed_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dining_sessions_token_uidx` ON `dining_sessions` (`token`);--> statement-breakpoint
CREATE INDEX `dining_sessions_table_idx` ON `dining_sessions` (`branch_id`,`table_number`,`status`);--> statement-breakpoint
CREATE TABLE `event_log` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_json` text DEFAULT '{}' NOT NULL,
	`actor` text DEFAULT 'system' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `event_log_entity_idx` ON `event_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `event_log_created_idx` ON `event_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `menu_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text DEFAULT '' NOT NULL,
	`sort_order` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `menu_categories_order_idx` ON `menu_categories` (`sort_order`);--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text DEFAULT '' NOT NULL,
	`price_mils` integer NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`note_ar` text DEFAULT '' NOT NULL,
	`note_en` text DEFAULT '' NOT NULL,
	`source_ambiguous` integer DEFAULT false NOT NULL,
	`available` integer DEFAULT true NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `menu_items_category_idx` ON `menu_items` (`category_id`);--> statement-breakpoint
CREATE INDEX `menu_items_available_idx` ON `menu_items` (`available`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`menu_item_id` text NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text DEFAULT '' NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_mils` integer NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_status_idx` ON `order_items` (`status`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`session_id` text,
	`branch_id` text NOT NULL,
	`order_type` text NOT NULL,
	`table_number` integer,
	`customer_name` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`round_number` integer DEFAULT 1 NOT NULL,
	`subtotal_mils` integer NOT NULL,
	`tax_mils` integer NOT NULL,
	`total_mils` integer NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_public_id_uidx` ON `orders` (`public_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_idempotency_uidx` ON `orders` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `orders_status_created_idx` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_session_idx` ON `orders` (`session_id`,`round_number`);--> statement-breakpoint
CREATE TABLE `service_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`idempotency_key` text NOT NULL,
	`session_id` text NOT NULL,
	`table_number` integer NOT NULL,
	`request_type` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`acknowledged_at` text,
	`on_way_at` text,
	`completed_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_requests_idempotency_uidx` ON `service_requests` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `service_requests_status_created_idx` ON `service_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `site_content` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff_roles` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `uploaded_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
