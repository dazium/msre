CREATE TABLE `customerNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerId` int NOT NULL,
	`noteType` enum('call','email','meeting','follow_up','general','quote_sent','contract_signed') NOT NULL DEFAULT 'general',
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `companyName` varchar(255);--> statement-breakpoint
ALTER TABLE `customers` ADD `preferredContactMethod` enum('phone','email','text','in_person') DEFAULT 'phone';--> statement-breakpoint
ALTER TABLE `customers` ADD `roofType` varchar(100);--> statement-breakpoint
ALTER TABLE `customers` ADD `serviceHistory` text;