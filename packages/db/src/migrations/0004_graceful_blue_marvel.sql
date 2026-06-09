PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `stress_predictions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`prediction` text NOT NULL,
	`predicted_class` text,
	`probabilities` text,
	`sample_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);--> statement-breakpoint
CREATE TABLE `stress_download_acknowledgments` (
	`user_id` text PRIMARY KEY NOT NULL,
	`patient_acknowledged_at` text,
	`guardian_acknowledged_at` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);--> statement-breakpoint
PRAGMA foreign_keys=ON;
