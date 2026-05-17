ALTER TABLE `guardian_profiles` ADD `clerk_user_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `guardian_email_unique` ON `guardian_profiles` (`email`);--> statement-breakpoint
ALTER TABLE `patient_profiles` ADD `email` text;--> statement-breakpoint
ALTER TABLE `patient_profiles` ADD `guardian_email` text;--> statement-breakpoint
ALTER TABLE `patient_profiles` ADD `guardian_phone` text;--> statement-breakpoint
ALTER TABLE `patient_profiles` ADD `guardian_request_status` text;