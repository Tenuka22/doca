ALTER TABLE `patient_profiles` ADD `_secured_data` text;--> statement-breakpoint
ALTER TABLE `patient_profiles` ADD `secured` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_profiles` DROP COLUMN `phone`;--> statement-breakpoint
ALTER TABLE `patient_profiles` DROP COLUMN `email`;