CREATE TABLE `changeOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workOrderId` int NOT NULL,
	`number` varchar(64) NOT NULL,
	`description` text NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`status` enum('draft','submitted','approved','rejected','invoiced') NOT NULL DEFAULT 'draft',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `changeOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `change_orders_work_order_number_unique` UNIQUE(`workOrderId`,`number`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`legalName` varchar(255),
	`accountType` enum('partner','direct_customer') NOT NULL DEFAULT 'partner',
	`classification` varchar(120),
	`email` varchar(320),
	`phone` varchar(30),
	`website` varchar(500),
	`address` text,
	`city` varchar(100),
	`province` varchar(100),
	`postalCode` varchar(20),
	`preferredContactMethod` enum('phone','email','text','in_person') NOT NULL DEFAULT 'email',
	`paymentTerms` enum('due_on_receipt','net_7','net_15','net_30','net_45','net_60','custom') NOT NULL DEFAULT 'net_30',
	`standardLabourRate` decimal(10,2),
	`areasServed` text,
	`typicalWorkRequested` text,
	`contractInformation` text,
	`insuranceRequirements` text,
	`wsibRequirements` text,
	`safetyRequirements` text,
	`requiredDocumentation` text,
	`specialInstructions` text,
	`notes` text,
	`status` enum('active','inactive','on_hold') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companyContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`role` enum('owner','project_manager','site_supervisor','dispatcher','estimator','accounts_payable','accounts_receivable','safety_coordinator','other') NOT NULL DEFAULT 'other',
	`position` varchar(120),
	`phone` varchar(30),
	`mobile` varchar(30),
	`email` varchar(320),
	`preferredContactMethod` enum('phone','email','text','in_person') NOT NULL DEFAULT 'email',
	`notes` text,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companyContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companyNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`userId` int NOT NULL,
	`noteType` enum('general','communication','financial','operations','safety','dispute') NOT NULL DEFAULT 'general',
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companyNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int,
	`jobSiteId` int,
	`workOrderId` int,
	`documentType` enum('contract','purchase_order','drawing','blueprint','specification','safety_document','insurance_certificate','wsib_wcb_certificate','invoice','receipt','completion_document','email_pdf','photo','other') NOT NULL DEFAULT 'other',
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`mimeType` varchar(150) NOT NULL,
	`revisionNumber` varchar(64),
	`revisionNotes` text,
	`notes` text,
	`uploadedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobSites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(255),
	`address` text NOT NULL,
	`city` varchar(100),
	`province` varchar(100),
	`postalCode` varchar(20),
	`propertyType` enum('residential','commercial','industrial','multi_residential','institutional','other') NOT NULL DEFAULT 'residential',
	`siteContactName` varchar(200),
	`siteContactPhone` varchar(30),
	`accessInstructions` text,
	`parkingInformation` text,
	`roofInformation` text,
	`safetyHazards` text,
	`requiredEquipment` text,
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobSites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workOrderAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workOrderId` int NOT NULL,
	`crewId` int NOT NULL,
	`assignedByUserId` int NOT NULL,
	`status` enum('assigned','accepted','in_progress','completed','cancelled') NOT NULL DEFAULT 'assigned',
	`scheduledStart` timestamp,
	`scheduledEnd` timestamp,
	`actualStart` timestamp,
	`actualCompletion` timestamp,
	`labourHours` decimal(10,2),
	`productionQuantity` decimal(12,2),
	`productionUnit` varchar(40),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workOrderAssignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `work_order_assignments_unique` UNIQUE(`workOrderId`,`crewId`)
);
--> statement-breakpoint
CREATE TABLE `workOrderCompletions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workOrderId` int NOT NULL,
	`completedByUserId` int NOT NULL,
	`completionDate` timestamp NOT NULL,
	`completedScope` text NOT NULL,
	`quantityCompleted` decimal(12,2),
	`quantityUnit` varchar(40),
	`labourHours` decimal(10,2),
	`productionQuantity` decimal(12,2),
	`productionUnit` varchar(40),
	`materialsUsed` text,
	`deficiencies` text,
	`signOffName` varchar(200),
	`crewNotes` text,
	`officeNotes` text,
	`callbackRequired` boolean NOT NULL DEFAULT false,
	`callbackDetails` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workOrderCompletions_id` PRIMARY KEY(`id`),
	CONSTRAINT `work_order_completions_order_unique` UNIQUE(`workOrderId`)
);
--> statement-breakpoint
CREATE TABLE `workOrderScopes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workOrderId` int NOT NULL,
	`category` enum('tear_off','shingle_installation','flat_roofing','repair','flashing','ventilation','ice_water_protection','underlayment','metal_work','skylight','soffit_fascia','eavestrough','emergency_repair','snow_work','other') NOT NULL DEFAULT 'other',
	`description` text NOT NULL,
	`quantity` decimal(12,2),
	`unit` varchar(40),
	`completedQuantity` decimal(12,2),
	`isCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workOrderScopes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workOrderStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workOrderId` int NOT NULL,
	`changedByUserId` int NOT NULL,
	`fromStatus` varchar(40),
	`toStatus` varchar(40) NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workOrderStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int NOT NULL,
	`jobSiteId` int NOT NULL,
	`contactId` int,
	`projectId` int,
	`workOrderNumber` varchar(64) NOT NULL,
	`purchaseOrderNumber` varchar(100),
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`requestedStartDate` date,
	`deadline` date,
	`scheduledStartDate` date,
	`scheduledEndDate` date,
	`jobType` enum('tear_off','shingle_installation','flat_roofing','repair','flashing','ventilation','ice_water_protection','underlayment','metal_work','skylight','soffit_fascia','eavestrough','emergency_repair','snow_work','other') NOT NULL DEFAULT 'other',
	`scopeSummary` text NOT NULL,
	`materialsSummary` text,
	`labourRequirements` text,
	`crewRequirements` text,
	`specialInstructions` text,
	`estimatedValue` decimal(12,2),
	`agreedPrice` decimal(12,2),
	`additionalCharges` decimal(12,2) NOT NULL DEFAULT '0.00',
	`taxRate` decimal(5,2) NOT NULL DEFAULT '13.00',
	`status` enum('new','reviewed','accepted','scheduled','assigned','in_progress','waiting','completed','ready_for_invoice','invoiced','partially_paid','paid','closed','cancelled','on_hold','disputed','callback_required') NOT NULL DEFAULT 'new',
	`statusReason` text,
	`createdByUserId` int NOT NULL,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `work_orders_user_number_unique` UNIQUE(`userId`,`workOrderNumber`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','office_manager','project_manager','crew_leader','worker','accounting') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `change_orders_work_order_idx` ON `changeOrders` (`workOrderId`,`status`);--> statement-breakpoint
CREATE INDEX `companies_user_idx` ON `companies` (`userId`);--> statement-breakpoint
CREATE INDEX `companies_type_status_idx` ON `companies` (`userId`,`accountType`,`status`);--> statement-breakpoint
CREATE INDEX `company_contacts_company_idx` ON `companyContacts` (`companyId`);--> statement-breakpoint
CREATE INDEX `company_contacts_active_idx` ON `companyContacts` (`companyId`,`status`);--> statement-breakpoint
CREATE INDEX `company_notes_company_idx` ON `companyNotes` (`companyId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `documents_company_idx` ON `documents` (`companyId`);--> statement-breakpoint
CREATE INDEX `documents_site_idx` ON `documents` (`jobSiteId`);--> statement-breakpoint
CREATE INDEX `documents_work_order_idx` ON `documents` (`workOrderId`);--> statement-breakpoint
CREATE INDEX `job_sites_company_idx` ON `jobSites` (`companyId`);--> statement-breakpoint
CREATE INDEX `work_order_assignments_crew_status_idx` ON `workOrderAssignments` (`crewId`,`status`);--> statement-breakpoint
CREATE INDEX `work_order_scopes_order_idx` ON `workOrderScopes` (`workOrderId`);--> statement-breakpoint
CREATE INDEX `work_order_status_history_order_idx` ON `workOrderStatusHistory` (`workOrderId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `work_orders_company_idx` ON `workOrders` (`companyId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `work_orders_site_idx` ON `workOrders` (`jobSiteId`);--> statement-breakpoint
CREATE INDEX `work_orders_status_deadline_idx` ON `workOrders` (`userId`,`status`,`deadline`);