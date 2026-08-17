ALTER TABLE `appointments` MODIFY COLUMN `type` enum('estimate','inspection','consultation','job_start','follow_up','work_order','other') NOT NULL DEFAULT 'other';--> statement-breakpoint
ALTER TABLE `appointments` ADD `workOrderId` int;--> statement-breakpoint
ALTER TABLE `appointments` ADD `crewId` int;--> statement-breakpoint
ALTER TABLE `photos` ADD `workOrderId` int;--> statement-breakpoint
ALTER TABLE `workOrderAssignments` ADD `appointmentId` int;