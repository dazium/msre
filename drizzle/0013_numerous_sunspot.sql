CREATE TABLE `crewSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`crewId` int NOT NULL,
	`skillName` varchar(100) NOT NULL,
	`skillLevel` enum('beginner','intermediate','expert') NOT NULL DEFAULT 'intermediate',
	`certificationName` varchar(100),
	`certificationNumber` varchar(100),
	`issuedDate` date,
	`expirationDate` date,
	`issuer` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crewSkills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predefinedSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`skillName` varchar(100) NOT NULL,
	`categoryId` int,
	`description` text,
	`isRequired` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `predefinedSkills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skillCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryName` varchar(100) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skillCategories_id` PRIMARY KEY(`id`)
);
