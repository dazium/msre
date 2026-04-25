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
  console.log('Checking projects table schema...');
  const [rows] = await connection.query('DESCRIBE projects');
  console.log('Projects table columns:');
  rows.forEach(row => {
    console.log(`  - ${row.Field}: ${row.Type}`);
  });
  
  console.log('\nChecking crews table...');
  const [crewRows] = await connection.query('DESCRIBE crews');
  console.log('Crews table columns:');
  crewRows.forEach(row => {
    console.log(`  - ${row.Field}: ${row.Type}`);
  });
} catch (err) {
  console.error('✗ Error:', err.message);
} finally {
  await connection.end();
}
