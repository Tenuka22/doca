PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_doctor_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`plan_id` text,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payout_status` text DEFAULT 'none' NOT NULL,
	`payout_transfer_id` text,
	`payout_amount` integer,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_doctor_sessions`("id", "doctor_id", "patient_id", "plan_id", "start_at", "end_at", "status", "payout_status", "payout_transfer_id", "payout_amount", "created_at", "updated_at") SELECT "id", "doctor_id", "patient_id", "plan_id", "start_at", "end_at", "status", "payout_status", "payout_transfer_id", "payout_amount", "created_at", "updated_at" FROM `doctor_sessions`;--> statement-breakpoint
DROP TABLE `doctor_sessions`;--> statement-breakpoint
ALTER TABLE `__new_doctor_sessions` RENAME TO `doctor_sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;