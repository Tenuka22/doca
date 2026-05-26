ALTER TABLE `doctor_plans` ADD `credit_cost` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `doctor_plans` DROP COLUMN `price`;