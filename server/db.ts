import { desc } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, customers, InsertCustomer, projects, InsertProject, estimates, InsertEstimate, appointments, InsertAppointment, photos, InsertPhoto, damages, InsertDamage, damagePhotos, InsertDamagePhoto } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Customer queries
export async function getCustomersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customers).where(eq(customers.userId, userId));
}

export async function getCustomerById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(
    and(eq(customers.id, id), eq(customers.userId, userId))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCustomer(data: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(customers).values(data);
}

export async function updateCustomer(id: number, userId: number, data: Partial<InsertCustomer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(customers).set(data).where(
    and(eq(customers.id, id), eq(customers.userId, userId))
  );
}

// Project queries
export async function getProjectsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId));
}

export async function getProjectById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(
    and(eq(projects.id, id), eq(projects.userId, userId))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(projects).values(data);
}

export async function updateProject(id: number, userId: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(projects).set(data).where(
    and(eq(projects.id, id), eq(projects.userId, userId))
  );
}

// Estimate queries
export async function getEstimatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(estimates).where(eq(estimates.userId, userId));
}

export async function getEstimateById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(estimates).where(
    and(eq(estimates.id, id), eq(estimates.userId, userId))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEstimate(data: InsertEstimate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(estimates).values(data);
}

export async function listEstimates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(estimates).orderBy(desc(estimates.createdAt));
}

// Appointment queries
export async function getAppointmentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appointments).where(eq(appointments.userId, userId));
}

export async function getAppointmentById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appointments).where(
    and(eq(appointments.id, id), eq(appointments.userId, userId))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAppointment(data: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(appointments).values(data);
}

export async function getAppointmentsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appointments).where(eq(appointments.projectId, projectId));
}

export async function updateAppointment(id: number, data: Partial<InsertAppointment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(appointments).set(data).where(eq(appointments.id, id));
}

export async function deleteAppointment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(appointments).where(eq(appointments.id, id));
}

// Photo queries
export async function getProjectsByCustomerId(customerId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(
    and(eq(projects.customerId, customerId), eq(projects.userId, userId))
  );
}

export async function getPhotosByProjectId(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(photos).where(
    and(eq(photos.projectId, projectId), eq(photos.userId, userId))
  );
}

export async function createPhoto(data: InsertPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(photos).values(data);
}

export async function updatePhoto(id: number, userId: number, data: Partial<InsertPhoto>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(photos).set(data).where(
    and(eq(photos.id, id), eq(photos.userId, userId))
  );
}

export async function deletePhoto(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(photos).where(
    and(eq(photos.id, id), eq(photos.userId, userId))
  );
}

// Damage queries
export async function getDamagesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(damages).where(eq(damages.userId, userId));
}

export async function getDamagesByProjectId(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(damages).where(
    and(eq(damages.projectId, projectId), eq(damages.userId, userId))
  );
}

export async function getDamageById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(damages).where(
    and(eq(damages.id, id), eq(damages.userId, userId))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDamage(data: InsertDamage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(damages).values(data);
}

export async function updateDamage(id: number, userId: number, data: Partial<InsertDamage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(damages).set(data).where(
    and(eq(damages.id, id), eq(damages.userId, userId))
  );
}

export async function deleteDamage(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(damages).where(
    and(eq(damages.id, id), eq(damages.userId, userId))
  );
}

// Damage photo queries
export async function getDamagePhotos(damageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(damagePhotos).where(eq(damagePhotos.damageId, damageId));
}

export async function createDamagePhoto(data: InsertDamagePhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(damagePhotos).values(data);
}

export async function deleteDamagePhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(damagePhotos).where(eq(damagePhotos.id, id));
}
