CREATE TABLE `doctor_schedule_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`kind` text NOT NULL,
	`note_kind` text,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`session_id` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `doctor_schedule_entries_session_id_unique` ON `doctor_schedule_entries` (`session_id`);--> statement-breakpoint
CREATE TABLE `doctor_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
