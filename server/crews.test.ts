import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { getDb } from "./db";
import { crewMembers, crews } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Crew Management", () => {
  let testCrewId: number;
  let testMemberId: number;
  let userId = 1;

  beforeAll(async () => {
    // Create a test crew
    const crew = await db.createCrew({
      userId,
      name: "Test Crew",
      description: "Test crew for unit tests",
      status: "active",
    });
    testCrewId = crew.id;
  });

  afterAll(async () => {
    // Clean up test data
    try {
      const dbInstance = await getDb();
      if (dbInstance) {
        // Delete crew members first
        await dbInstance.delete(crewMembers).where(eq(crewMembers.crewId, testCrewId));
        // Delete crew
        await dbInstance.delete(crews).where(eq(crews.id, testCrewId));
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe("Crew CRUD Operations", () => {
    it("should create a crew", async () => {
      const crew = await db.createCrew({
        userId,
        name: "New Crew",
        description: "A new test crew",
        status: "active",
      });
      expect(crew).toBeDefined();
      expect(crew.name).toBe("New Crew");
      expect(crew.status).toBe("active");
    });

    it("should retrieve crew by ID", async () => {
      const crew = await db.getCrewById(testCrewId, userId);
      expect(crew).toBeDefined();
      expect(crew?.id).toBe(testCrewId);
      expect(crew?.name).toBe("Test Crew");
    });

    it("should list crews by user", async () => {
      const crews = await db.getCrewsByUserId(userId);
      expect(crews).toBeDefined();
      expect(Array.isArray(crews)).toBe(true);
      expect(crews.length).toBeGreaterThan(0);
    });

    it("should update crew", async () => {
      await db.updateCrew(testCrewId, userId, {
        name: "Updated Test Crew",
        description: "Updated description",
      });
      const crew = await db.getCrewById(testCrewId, userId);
      expect(crew?.name).toBe("Updated Test Crew");
      expect(crew?.description).toBe("Updated description");
    });
  });

  describe("Crew Member Management", () => {
    it("should add crew member", async () => {
      const member = await db.addCrewMember({
        crewId: testCrewId,
        name: "John Doe",
        role: "Roofer",
        phone: "519-555-0001",
        email: "john@example.com",
      });
      expect(member).toBeDefined();
      expect(member.name).toBe("John Doe");
      expect(member.role).toBe("Roofer");
      testMemberId = member.id;
    });

    it("should get crew members", async () => {
      const members = await db.getCrewMembers(testCrewId);
      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBeGreaterThan(0);
      expect(members.some(m => m.id === testMemberId)).toBe(true);
    });

    it("should update crew member", async () => {
      const updated = await db.updateCrewMember(testMemberId, {
        name: "Jane Doe",
        role: "Lead Roofer",
      });
      expect(updated.name).toBe("Jane Doe");
      expect(updated.role).toBe("Lead Roofer");
    });

    it("should set crew lead", async () => {
      await db.updateCrew(testCrewId, userId, { crewLeadId: testMemberId });
      const crew = await db.getCrewById(testCrewId, userId);
      expect(crew?.crewLeadId).toBe(testMemberId);
    });

    it("should delete crew member", async () => {
      await db.deleteCrewMember(testMemberId);
      const members = await db.getCrewMembers(testCrewId);
      expect(members.some(m => m.id === testMemberId)).toBe(false);
    });
  });

  describe("Crew Member Skills", () => {
    let skillId: number;
    let memberId: number;

    beforeAll(async () => {
      const member = await db.addCrewMember({
        crewId: testCrewId,
        name: "Skill Test Member",
        role: "Specialist",
      });
      memberId = member.id;
    });

    afterAll(async () => {
      if (memberId) {
        try {
          await db.deleteCrewMember(memberId);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

    it("should add crew member skill", async () => {
      const skill = await db.addCrewMemberSkill({
        crewMemberId: memberId,
        skillName: "Asphalt Roofing",
        certificationNumber: "CERT-12345",
        isActive: true,
      });
      expect(skill).toBeDefined();
      expect(skill.skillName).toBe("Asphalt Roofing");
      skillId = skill.id;
    });

    it("should get crew member skills", async () => {
      const skills = await db.getCrewMemberSkills(memberId);
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.some(s => s.id === skillId)).toBe(true);
    });

    it("should delete crew member skill", async () => {
      await db.deleteCrewMemberSkill(skillId);
      const skills = await db.getCrewMemberSkills(memberId);
      expect(skills.some(s => s.id === skillId)).toBe(false);
    });
  });

  describe("Crew Hierarchy", () => {
    let crewWithLeadId: number;
    let leadMemberId: number;
    let teamMemberId: number;

    beforeAll(async () => {
      // Create crew
      const crew = await db.createCrew({
        userId,
        name: "Hierarchy Test Crew",
        status: "active",
      });
      crewWithLeadId = crew.id;

      // Add lead member
      const lead = await db.addCrewMember({
        crewId: crewWithLeadId,
        name: "Lead Member",
        role: "Lead",
      });
      leadMemberId = lead.id;

      // Add team member
      const team = await db.addCrewMember({
        crewId: crewWithLeadId,
        name: "Team Member",
        role: "Roofer",
      });
      teamMemberId = team.id;

      // Set crew lead
      await db.updateCrew(crewWithLeadId, userId, { crewLeadId: leadMemberId });
    });

    afterAll(async () => {
      try {
        const dbInstance = await getDb();
        if (dbInstance) {
          await dbInstance.delete(crewMembers).where(eq(crewMembers.crewId, crewWithLeadId));
          await dbInstance.delete(crews).where(eq(crews.id, crewWithLeadId));
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    it("should have correct crew lead", async () => {
      const crew = await db.getCrewById(crewWithLeadId, userId);
      expect(crew?.crewLeadId).toBe(leadMemberId);
    });

    it("should have multiple team members", async () => {
      const members = await db.getCrewMembers(crewWithLeadId);
      expect(members.length).toBe(2);
    });

    it("should allow changing crew lead", async () => {
      await db.updateCrew(crewWithLeadId, userId, { crewLeadId: teamMemberId });
      const crew = await db.getCrewById(crewWithLeadId, userId);
      expect(crew?.crewLeadId).toBe(teamMemberId);
    });

    it("should allow removing crew lead", async () => {
      await db.updateCrew(crewWithLeadId, userId, { crewLeadId: null });
      const crew = await db.getCrewById(crewWithLeadId, userId);
      expect(crew?.crewLeadId).toBeNull();
    });
  });
});
