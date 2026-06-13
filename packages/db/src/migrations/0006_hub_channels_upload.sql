PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `doctor_hub_channels` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`name` text NOT NULL,
	`handle` text NOT NULL,
	`description` text,
	`avatar_key` text,
	`banner_key` text,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);--> statement-breakpoint
CREATE TABLE `hub_upload_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`doctor_id` text NOT NULL,
	`material_id` text,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`total_size` integer NOT NULL,
	`chunk_size` integer NOT NULL,
	`total_chunks` integer NOT NULL,
	`uploaded_chunks` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`file_key` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);--> statement-breakpoint
ALTER TABLE `doctor_hub_materials` ADD COLUMN `channel_id` text;--> statement-breakpoint
ALTER TABLE `doctor_hub_materials` ADD COLUMN `thumbnail_key` text;--> statement-breakpoint
ALTER TABLE `doctor_hub_materials` ADD COLUMN `file_name` text;--> statement-breakpoint
ALTER TABLE `doctor_hub_materials` ADD COLUMN `mime_type` text;--> statement-breakpoint
ALTER TABLE `doctor_hub_materials` ADD COLUMN `size` integer;--> statement-breakpoint
ALTER TABLE `doctor_hub_materials` ADD COLUMN `duration_seconds` integer;--> statement-breakpoint
ALTER TABLE `doctor_hub_materials` ADD COLUMN `visibility` text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE `doctor_hub_materials` ADD COLUMN `status` text DEFAULT 'uploading' NOT NULL;
