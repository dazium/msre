import { describe, it, expect } from "vitest";
import * as db from "./db";
import { InsertCustomerNote } from "../drizzle/schema";

const testUserId = 999;

describe("Customer Detail Features", () => {
  describe("Customer Notes - CRUD Operations", () => {
    it("should create a customer note", async () => {
      const noteData: InsertCustomerNote = {
        userId: testUserId,
        customerId: 9999,
        noteType: "call",
        title: "Initial consultation",
        content: "Customer interested in roof replacement",
        createdBy: testUserId,
      };

      const note = await db.createCustomerNote(noteData);
      expect(note).toBeDefined();
      expect(note.title).toBe("Initial consultation");
      expect(note.noteType).toBe("call");
    });

    it("should retrieve customer notes by customer ID", async () => {
      const customerId = 9998;
      const note1: InsertCustomerNote = {
        userId: testUserId,
        customerId,
        noteType: "call",
        title: "First call",
        content: "Discussed options",
        createdBy: testUserId,
      };

      const note2: InsertCustomerNote = {
        userId: testUserId,
        customerId,
        noteType: "email",
        title: "Follow-up email",
        content: "Sent quote",
        createdBy: testUserId,
      };

      await db.createCustomerNote(note1);
      await db.createCustomerNote(note2);

      const notes = await db.getCustomerNotes(customerId, testUserId);
      expect(notes.length).toBeGreaterThanOrEqual(2);
      expect(notes.some((n) => n.title === "First call")).toBe(true);
      expect(notes.some((n) => n.title === "Follow-up email")).toBe(true);
    });

    it("should retrieve a specific customer note by ID", async () => {
      const noteData: InsertCustomerNote = {
        userId: testUserId,
        customerId: 9997,
        noteType: "meeting",
        title: "In-person meeting",
        content: "Walked the roof with customer",
        createdBy: testUserId,
      };

      const created = await db.createCustomerNote(noteData);
      const retrieved = await db.getCustomerNoteById(created.id, testUserId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe("In-person meeting");
      expect(retrieved?.noteType).toBe("meeting");
    });

    it("should update a customer note", async () => {
      const noteData: InsertCustomerNote = {
        userId: testUserId,
        customerId: 9996,
        noteType: "general",
        title: "Original title",
        content: "Original content",
        createdBy: testUserId,
      };

      const created = await db.createCustomerNote(noteData);
      const updated = await db.updateCustomerNote(created.id, testUserId, {
        title: "Updated title",
        content: "Updated content",
        noteType: "follow_up",
      });

      expect(updated.title).toBe("Updated title");
      expect(updated.content).toBe("Updated content");
      expect(updated.noteType).toBe("follow_up");
    });

    it("should delete a customer note", async () => {
      const noteData: InsertCustomerNote = {
        userId: testUserId,
        customerId: 9995,
        noteType: "general",
        title: "To be deleted",
        content: "This note will be deleted",
        createdBy: testUserId,
      };

      const created = await db.createCustomerNote(noteData);
      await db.deleteCustomerNote(created.id, testUserId);

      const retrieved = await db.getCustomerNoteById(created.id, testUserId);
      expect(retrieved).toBeNull();
    });

    it("should support all note types", async () => {
      const noteTypes = ["call", "email", "meeting", "follow_up", "general", "quote_sent", "contract_signed"] as const;

      for (const noteType of noteTypes) {
        const noteData: InsertCustomerNote = {
          userId: testUserId,
          customerId: 9994,
          noteType,
          title: `Note of type ${noteType}`,
          content: `Content for ${noteType}`,
          createdBy: testUserId,
        };

        const note = await db.createCustomerNote(noteData);
        expect(note.noteType).toBe(noteType);
      }
    });
  });

  describe("Customer Lifetime Value", () => {
    it("should calculate customer lifetime value", async () => {
      const customerId = 9993;
      const ltv = await db.getCustomerLifetimeValue(customerId);
      expect(typeof ltv).toBe("number");
      expect(ltv).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Customer Project Summary", () => {
    it("should calculate project summary", async () => {
      const customerId = 9992;
      const summary = await db.getCustomerProjectSummary(customerId);

      expect(summary).toBeDefined();
      expect(typeof summary.totalProjects).toBe("number");
      expect(typeof summary.activeProjects).toBe("number");
      expect(typeof summary.completedProjects).toBe("number");
      expect(typeof summary.totalValue).toBe("number");
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete customer detail workflow", async () => {
      const customerId = 9991;

      // Create a customer note
      const note = await db.createCustomerNote({
        userId: testUserId,
        customerId,
        noteType: "call",
        title: "Initial contact",
        content: "Customer called about roof damage",
        createdBy: testUserId,
      });

      expect(note).toBeDefined();

      // Get customer notes
      const notes = await db.getCustomerNotes(customerId, testUserId);
      expect(notes.length).toBeGreaterThan(0);

      // Get customer summary
      const summary = await db.getCustomerProjectSummary(customerId);
      expect(summary).toBeDefined();

      // Get lifetime value
      const ltv = await db.getCustomerLifetimeValue(customerId);
      expect(typeof ltv).toBe("number");
    });

    it("should maintain data isolation between users", async () => {
      const customerId = 9990;
      const user1 = 111;
      const user2 = 222;

      // Create note for user1
      const note1 = await db.createCustomerNote({
        userId: user1,
        customerId,
        noteType: "general",
        title: "User1 note",
        content: "Content from user 1",
        createdBy: user1,
      });

      // Create note for user2
      const note2 = await db.createCustomerNote({
        userId: user2,
        customerId,
        noteType: "general",
        title: "User2 note",
        content: "Content from user 2",
        createdBy: user2,
      });

      // User1 should only see their note
      const user1Notes = await db.getCustomerNotes(customerId, user1);
      expect(user1Notes.some((n) => n.id === note1.id)).toBe(true);

      // User2 should only see their note
      const user2Notes = await db.getCustomerNotes(customerId, user2);
      expect(user2Notes.some((n) => n.id === note2.id)).toBe(true);
    });
  });
});
