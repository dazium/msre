import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

const CUSTOMERS = [
  {
    userId: 1,
    firstName: "John",
    lastName: "Doe",
    phone: "519-555-1234",
    email: "john.doe@example.com",
    address: "123 Main Street",
    city: "Windsor",
    state: "ON",
    zipCode: "N8X 1A1",
    latitude: 42.3149,
    longitude: -83.0364,
    status: "qualified",
    notes: "Regular customer, roof replacement needed",
  },
  {
    userId: 1,
    firstName: "Alice",
    lastName: "Smith",
    phone: "519-555-5678",
    email: "alice.smith@example.com",
    address: "456 Oak Avenue",
    city: "Windsor",
    state: "ON",
    zipCode: "N8Y 2B2",
    latitude: 42.3200,
    longitude: -83.0450,
    status: "qualified",
    notes: "New customer, interested in gutter cleaning",
  },
  {
    userId: 1,
    firstName: "Bob",
    lastName: "Johnson",
    phone: "519-555-9012",
    email: "bob.johnson@example.com",
    address: "789 Elm Street",
    city: "Windsor",
    state: "ON",
    zipCode: "N8Z 3C3",
    latitude: 42.3100,
    longitude: -83.0300,
    status: "lead",
    notes: "Referred by John Doe, pending estimate",
  },
  {
    userId: 1,
    firstName: "Carol",
    lastName: "Williams",
    phone: "519-555-3456",
    email: "carol.williams@example.com",
    address: "321 Pine Road",
    city: "Windsor",
    state: "ON",
    zipCode: "N8W 4D4",
    latitude: 42.3250,
    longitude: -83.0500,
    status: "qualified",
    notes: "Commercial property, multi-unit building",
  },
  {
    userId: 1,
    firstName: "David",
    lastName: "Brown",
    phone: "519-555-7890",
    email: "david.brown@example.com",
    address: "654 Maple Drive",
    city: "Windsor",
    state: "ON",
    zipCode: "N8V 5E5",
    latitude: 42.3175,
    longitude: -83.0375,
    status: "qualified",
    notes: "Interested in roof inspection and maintenance plan",
  },
];

const PROJECTS = [
  {
    userId: 1,
    customerId: 1,
    title: "Roof Replacement - Main Street",
    description: "Complete roof replacement with new shingles and underlayment",
    status: "in_progress",
    startDate: new Date("2026-04-01"),
    estimatedEndDate: new Date("2026-04-15"),
    address: "123 Main Street, Windsor, ON N8X 1A1",
    latitude: 42.3149,
    longitude: -83.0364,
    squareFootage: 2500,
    estimatedCost: 7500,
    notes: "Customer approved estimate on March 28",
  },
  {
    userId: 1,
    customerId: 2,
    title: "Gutter Cleaning & Repair",
    description: "Clean gutters and repair damaged sections",
    status: "scheduled",
    startDate: new Date("2026-04-20"),
    estimatedEndDate: new Date("2026-04-20"),
    address: "456 Oak Avenue, Windsor, ON N8Y 2B2",
    latitude: 42.3200,
    longitude: -83.0450,
    squareFootage: 0,
    estimatedCost: 500,
    notes: "Scheduled for next week",
  },
];

async function seed() {
  let connection;
  try {
    console.log("🌱 Starting database seed...");

    // Parse DATABASE_URL
    const dbUrl = new URL(process.env.DATABASE_URL);
    const config = {
      host: dbUrl.hostname,
      user: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.slice(1),
      port: dbUrl.port || 3306,
      ssl: {},
    };

    connection = await mysql.createConnection(config);

    // Insert customers
    for (const customer of CUSTOMERS) {
      await connection.execute(
        `INSERT INTO customers (userId, firstName, lastName, phone, email, address, city, state, zipCode, latitude, longitude, status, notes, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          customer.userId,
          customer.firstName,
          customer.lastName,
          customer.phone,
          customer.email,
          customer.address,
          customer.city,
          customer.state,
          customer.zipCode,
          customer.latitude,
          customer.longitude,
          customer.status,
          customer.notes,
        ]
      );
      console.log(`✅ Created customer: ${customer.firstName} ${customer.lastName}`);
    }

    // Insert projects
    for (const project of PROJECTS) {
      await connection.execute(
        `INSERT INTO projects (userId, customerId, title, description, status, startDate, endDate, address, latitude, longitude, estimatedValue, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          project.userId,
          project.customerId,
          project.title,
          project.description,
          project.status,
          project.startDate,
          project.estimatedEndDate,
          project.address,
          project.latitude,
          project.longitude,
          project.estimatedCost,
        ]
      );
      console.log(`✅ Created project: ${project.title}`);
    }

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seed();
