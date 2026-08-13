CREATE TABLE `inspectionItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inspectionId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`label` varchar(255) NOT NULL,
	`status` enum('pending','pass','attention','fail','not_applicable') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspectionItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int NOT NULL,
	`customerId` int NOT NULL,
	`status` enum('draft','in_progress','completed') NOT NULL DEFAULT 'draft',
	`inspectorName` varchar(150),
	`inspectedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspections_id` PRIMARY KEY(`id`)
);
