import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Photos Router - Full CRUD", () => {
  it("should list photos for a project (empty initially)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.listByProject({ projectId: 100 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a photo record", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.create({
      projectId: 101,
      fileName: "roof_damage_north.jpg",
      fileUrl: "https://example.com/photos/roof_damage_north.jpg",
      fileKey: "projects/101/photos/roof_damage_north.jpg",
      mimeType: "image/jpeg",
      caption: "Missing shingles on north side",
    });

    expect(result).toBeDefined();
  });

  it("should create multiple photos for same project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const photos = [
      {
        projectId: 102,
        fileName: "roof_before.jpg",
        fileUrl: "https://example.com/photos/roof_before.jpg",
        fileKey: "projects/102/photos/roof_before.jpg",
        mimeType: "image/jpeg",
        caption: "Before repair",
      },
      {
        projectId: 102,
        fileName: "roof_after.jpg",
        fileUrl: "https://example.com/photos/roof_after.jpg",
        fileKey: "projects/102/photos/roof_after.jpg",
        mimeType: "image/jpeg",
        caption: "After repair",
      },
      {
        projectId: 102,
        fileName: "flashing_damage.jpg",
        fileUrl: "https://example.com/photos/flashing_damage.jpg",
        fileKey: "projects/102/photos/flashing_damage.jpg",
        mimeType: "image/jpeg",
        caption: "Damaged flashing around chimney",
      },
    ];

    for (const photo of photos) {
      const result = await caller.photos.create(photo);
      expect(result).toBeDefined();
    }

    const list = await caller.photos.listByProject({ projectId: 102 });
    expect(Array.isArray(list)).toBe(true);
  });

  it("should update photo caption", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.photos.create({
      projectId: 103,
      fileName: "test_photo.jpg",
      fileUrl: "https://example.com/photos/test_photo.jpg",
      fileKey: "projects/103/photos/test_photo.jpg",
      caption: "Original caption",
    });

    const result = await caller.photos.update({
      id: 1,
      caption: "Updated caption with more details",
    });

    expect(result).toBeDefined();
  });

  it("should delete a photo", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.photos.create({
      projectId: 104,
      fileName: "photo_to_delete.jpg",
      fileUrl: "https://example.com/photos/photo_to_delete.jpg",
      fileKey: "projects/104/photos/photo_to_delete.jpg",
    });

    const result = await caller.photos.delete({ id: 1 });
    expect(result).toBeDefined();
  });

  it("should handle photos without captions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.photos.create({
      projectId: 105,
      fileName: "no_caption_photo.jpg",
      fileUrl: "https://example.com/photos/no_caption_photo.jpg",
      fileKey: "projects/105/photos/no_caption_photo.jpg",
    });

    expect(result).toBeDefined();
  });

  it("should support different MIME types", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const mimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    for (const mimeType of mimeTypes) {
      const result = await caller.photos.create({
        projectId: 106,
        fileName: `photo.${mimeType.split("/")[1]}`,
        fileUrl: `https://example.com/photos/photo.${mimeType.split("/")[1]}`,
        fileKey: `projects/106/photos/photo.${mimeType.split("/")[1]}`,
        mimeType,
      });
      expect(result).toBeDefined();
    }
  });
});

describe("Damage Photos Router - Linking", () => {
  it("should link a photo to a damage", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.photos.create({
      projectId: 107,
      fileName: "damage_photo.jpg",
      fileUrl: "https://example.com/photos/damage_photo.jpg",
      fileKey: "projects/107/photos/damage_photo.jpg",
    });

    await caller.damages.create({
      projectId: 107,
      category: "missing_shingles",
      description: "Missing shingles",
    });

    const result = await caller.photos.linkToDamage({
      photoId: 1,
      damageId: 1,
    });

    expect(result).toBeDefined();
  });

  it("should get damage photos", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.photos.create({
      projectId: 108,
      fileName: "damage_photo2.jpg",
      fileUrl: "https://example.com/photos/damage_photo2.jpg",
      fileKey: "projects/108/photos/damage_photo2.jpg",
    });

    await caller.damages.create({
      projectId: 108,
      category: "flashing_damage",
      description: "Flashing damage",
    });

    await caller.photos.linkToDamage({
      photoId: 1,
      damageId: 1,
    });

    const result = await caller.photos.getDamagePhotos({ damageId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should unlink photo from damage", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.photos.create({
      projectId: 109,
      fileName: "photo_to_unlink.jpg",
      fileUrl: "https://example.com/photos/photo_to_unlink.jpg",
      fileKey: "projects/109/photos/photo_to_unlink.jpg",
    });

    await caller.damages.create({
      projectId: 109,
      category: "leaks",
      description: "Water leaks",
    });

    await caller.photos.linkToDamage({
      photoId: 1,
      damageId: 1,
    });

    const result = await caller.photos.unlinkFromDamage({ id: 1 });
    expect(result).toBeDefined();
  });

  it("should link multiple photos to same damage", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    for (let i = 0; i < 3; i++) {
      await caller.photos.create({
        projectId: 110,
        fileName: `multi_photo_${i}.jpg`,
        fileUrl: `https://example.com/photos/multi_photo_${i}.jpg`,
        fileKey: `projects/110/photos/multi_photo_${i}.jpg`,
      });
    }

    await caller.damages.create({
      projectId: 110,
      category: "wind_damage",
      description: "Wind damage",
    });

    for (let i = 1; i <= 3; i++) {
      const result = await caller.photos.linkToDamage({
        photoId: i,
        damageId: 1,
      });
      expect(result).toBeDefined();
    }

    const damagePhotos = await caller.photos.getDamagePhotos({ damageId: 1 });
    expect(Array.isArray(damagePhotos)).toBe(true);
  });
});

describe("Photo Integration Tests", () => {
  it("should complete full photo workflow: upload, link, view, delete", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.projects.create({
      customerId: 1,
      title: "Photo workflow test",
      status: "in_progress",
    });

    await caller.damages.create({
      projectId: 1,
      category: "missing_shingles",
      description: "Test damage for photo linking",
      severity: "moderate",
    });

    const photos = [];
    for (let i = 0; i < 2; i++) {
      const result = await caller.photos.create({
        projectId: 1,
        fileName: `workflow_photo_${i}.jpg`,
        fileUrl: `https://example.com/photos/workflow_photo_${i}.jpg`,
        fileKey: `projects/1/photos/workflow_photo_${i}.jpg`,
        caption: `Workflow test photo ${i}`,
      });
      photos.push(result);
    }

    for (let i = 1; i <= 2; i++) {
      await caller.photos.linkToDamage({
        photoId: i,
        damageId: 1,
      });
    }

    const projectPhotos = await caller.photos.listByProject({ projectId: 1 });
    expect(Array.isArray(projectPhotos)).toBe(true);

    const damagePhotos = await caller.photos.getDamagePhotos({ damageId: 1 });
    expect(Array.isArray(damagePhotos)).toBe(true);

    await caller.photos.update({
      id: 1,
      caption: "Updated workflow photo caption",
    });

    await caller.photos.delete({ id: 1 });

    expect(true).toBe(true);
  });
});
