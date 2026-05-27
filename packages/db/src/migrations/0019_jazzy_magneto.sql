CREATE TABLE `session_attendance_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`participant_type` text NOT NULL,
	`event` text NOT NULL,
	`timestamp` text NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `session_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`captured_at` text NOT NULL,
	`image_url` text,
	`image_data` text,
	`participant_type` text NOT NULL,
	`reason` text NOT NULL
);
