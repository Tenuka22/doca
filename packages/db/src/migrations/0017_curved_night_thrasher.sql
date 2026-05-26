CREATE TABLE `doctor_cashout_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`stripe_transfer_id` text,
	`failure_reason` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `doctor_credits` (
	`doctor_id` text PRIMARY KEY NOT NULL,
	`balance_cents` integer DEFAULT 0 NOT NULL,
	`total_earned_cents` integer DEFAULT 0 NOT NULL,
	`total_cashed_out_cents` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `doctor_weekly_availability` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`is_available` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `doctor_sessions` ADD `doctor_earned_cents` integer;