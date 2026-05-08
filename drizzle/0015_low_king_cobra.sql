CREATE TABLE `crewMemberSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`crewMemberId` int NOT NULL,
	`skillName` varchar(100) NOT NULL,
	`certificationNumber` varchar(100),
	`expirationDate` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crewMemberSkills_id` PRIMARY KEY(`id`)
);
