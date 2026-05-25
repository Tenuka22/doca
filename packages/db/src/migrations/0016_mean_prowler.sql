CREATE TABLE `credit_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`session_id` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_credits` (
	`user_id` text PRIMARY KEY NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
DROP TABLE `payment_intents`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_doctor_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`plan_id` text,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`credit_cost` integer NOT NULL,
	`payout_status` text DEFAULT 'none' NOT NULL,
	`payout_transfer_id` text,
	`payout_amount` integer,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_doctor_sessions`("id", "doctor_id", "patient_id", "plan_id", "start_at", "end_at", "status", "credit_cost", "payout_status", "payout_transfer_id", "payout_amount", "created_at", "updated_at") SELECT "id", "doctor_id", "patient_id", "plan_id", "start_at", "end_at", "status", "credit_cost", "payout_status", "payout_transfer_id", "payout_amount", "created_at", "updated_at" FROM `doctor_sessions`;--> statement-breakpoint
DROP TABLE `doctor_sessions`;--> statement-breakpoint
ALTER TABLE `__new_doctor_sessions` RENAME TO `doctor_sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;