CREATE TABLE `damagePhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`damageId` int NOT NULL,
	`photoId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `damagePhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `damages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int NOT NULL,
	`customerId` int NOT NULL,
	`category` enum('missing_shingles','flashing_damage','leaks','sagging','rot','moss_algae','hail_damage','wind_damage','other') NOT NULL,
	`description` text NOT NULL,
	`severity` enum('minor','moderate','severe') NOT NULL DEFAULT 'moderate',
	`location` varchar(255),
	`estimatedCost` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `damages_id` PRIMARY KEY(`id`)
);
