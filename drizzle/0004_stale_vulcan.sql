ALTER TABLE `materials` MODIFY COLUMN `category` enum('shingles','underlayment','ice_water_shield','plywood','flashing','pipe_flange','ridge_caps','gutters','fascia_soffit','other') NOT NULL DEFAULT 'other';--> statement-breakpoint
ALTER TABLE `materials` MODIFY COLUMN `unitPrice` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `materials` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `materials` ADD `description` text;