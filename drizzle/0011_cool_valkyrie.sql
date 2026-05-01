CREATE TABLE `invoiceTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`companyName` varchar(255) NOT NULL,
	`companyLogo` text,
	`companyPhone` varchar(20),
	`companyEmail` varchar(320),
	`companyAddress` text,
	`primaryColor` varchar(7) NOT NULL DEFAULT '#1a3a52',
	`secondaryColor` varchar(7) NOT NULL DEFAULT '#ffffff',
	`accentColor` varchar(7) NOT NULL DEFAULT '#4a90e2',
	`footerText` text,
	`paymentTerms` text,
	`includeCompanyLogo` boolean NOT NULL DEFAULT true,
	`includeCompanyInfo` boolean NOT NULL DEFAULT true,
	`includePaymentTerms` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoiceTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `crewId` int;