CREATE TABLE `activityLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerId` int,
	`projectId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`location` text,
	`type` enum('estimate','inspection','consultation','job_start','follow_up','other') NOT NULL DEFAULT 'other',
	`status` enum('scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20) NOT NULL,
	`address` text,
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(20),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`status` enum('lead','contacted','qualified','proposal_sent','won','lost') NOT NULL DEFAULT 'lead',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estimateLineItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`estimateId` int NOT NULL,
	`description` text NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`total` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `estimateLineItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estimates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int NOT NULL,
	`customerId` int NOT NULL,
	`estimateNumber` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`subtotal` decimal(10,2) NOT NULL,
	`tax` decimal(10,2) DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`status` enum('draft','sent','accepted','rejected','expired') NOT NULL DEFAULT 'draft',
	`validUntil` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `estimates_id` PRIMARY KEY(`id`),
	CONSTRAINT `estimates_estimateNumber_unique` UNIQUE(`estimateNumber`)
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`customerId` int,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`mimeType` varchar(100),
	`caption` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`address` text,
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(20),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`status` enum('lead','scheduled','in_progress','completed','on_hold','cancelled') NOT NULL DEFAULT 'lead',
	`startDate` date,
	`endDate` date,
	`estimatedValue` decimal(10,2),
	`actualValue` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);