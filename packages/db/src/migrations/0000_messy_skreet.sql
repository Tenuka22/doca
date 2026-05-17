CREATE TABLE `doctor_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`bio` text,
	`license_number` text,
	`verified` integer DEFAULT false NOT NULL,
	`permanent` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
