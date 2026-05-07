CREATE TABLE `crewMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`crewId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`role` varchar(100) NOT NULL,
	`phone` varchar(20),
	`email` varchar(320),
	`joinDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crewMembers_id` PRIMARY KEY(`id`)
);
