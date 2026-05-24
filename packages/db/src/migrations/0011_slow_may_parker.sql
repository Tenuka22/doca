CREATE TABLE `credit_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`reference_id` text,
	`description` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `doctor_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`credits` integer DEFAULT 1 NOT NULL,
	`duration_minutes` integer NOT NULL,
	`features` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_intents` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`stripe_payment_intent_id` text,
	`amount` integer NOT NULL,
	`platform_fee` integer NOT NULL,
	`doctor_amount` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`stripe_transfer_id` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
