CREATE TABLE `invoiceLineItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`workOrderScopeId` int,
	`description` text NOT NULL,
	`quantity` decimal(12,2) NOT NULL,
	`unit` varchar(40),
	`unitPrice` decimal(12,2) NOT NULL,
	`total` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoiceLineItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `projectId` int;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `customerId` int;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `status` enum('draft','sent','viewed','partially_paid','paid','overdue','disputed','written_off','cancelled') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `stripePaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `currency` varchar(3) NOT NULL DEFAULT 'CAD';--> statement-breakpoint
ALTER TABLE `invoices` ADD `companyId` int;--> statement-breakpoint
ALTER TABLE `invoices` ADD `workOrderId` int;--> statement-breakpoint
ALTER TABLE `payments` ADD `paymentDate` date;--> statement-breakpoint
ALTER TABLE `payments` ADD `referenceNumber` varchar(100);--> statement-breakpoint
CREATE INDEX `invoice_line_items_invoice_idx` ON `invoiceLineItems` (`invoiceId`);