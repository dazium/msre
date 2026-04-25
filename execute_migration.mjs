import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

try {
  console.log('Executing migration: Creating crews table...');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`crews\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`name\` varchar(100) NOT NULL,
      \`description\` text,
      \`crewLead\` varchar(100),
      \`phone\` varchar(20),
      \`email\` varchar(320),
      \`status\` enum('active','inactive') NOT NULL DEFAULT 'active',
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`crews_id\` PRIMARY KEY(\`id\`)
    )
  `);
  console.log('✓ Crews table created');

  console.log('Adding crewId column to projects table...');
  await connection.query(`
    ALTER TABLE \`projects\` ADD COLUMN IF NOT EXISTS \`crewId\` int
  `);
  console.log('✓ crewId column added to projects');

  console.log('✓ Migration completed successfully');
  process.exit(0);
} catch (err) {
  console.error('✗ Migration failed:', err.message);
  process.exit(1);
} finally {
  await connection.end();
}
