CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`estimateId` int,
	`projectId` int NOT NULL,
	`customerId` int NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`issueDate` date NOT NULL,
	`dueDate` date NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`tax` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`amountPaid` decimal(10,2) NOT NULL DEFAULT '0',
	`status` enum('draft','sent','viewed','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
ALTER TABLE `projects` DROP COLUMN `crewId`;