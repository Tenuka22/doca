DROP TABLE `credit_transactions`;--> statement-breakpoint
DROP TABLE `user_credits`;--> statement-breakpoint
ALTER TABLE `doctor_plans` ADD `price` integer DEFAULT 5000 NOT NULL;--> statement-breakpoint
ALTER TABLE `doctor_plans` DROP COLUMN `credits`;