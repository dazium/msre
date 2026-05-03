# Crew Skills & Certifications System

## Overview

The Crew Skills & Certifications system enables comprehensive tracking of crew member qualifications, certifications, and expertise levels. This system is essential for roofing businesses to ensure crews are properly qualified for specific job types and to maintain compliance with industry certifications.

## Database Schema

### Tables

#### 1. `crewSkills` Table
Tracks individual skills and certifications for each crew member.

**Columns:**
- `id` (int, PK) - Unique identifier
- `userId` (int) - User who owns the crew
- `crewId` (int) - Associated crew
- `skillName` (varchar 100) - Name of the skill (e.g., "Asphalt Shingles", "Metal Roofing")
- `skillLevel` (enum) - Proficiency level: `beginner`, `intermediate`, `expert`
- `certificationName` (varchar 100) - Official certification name (e.g., "OSHA 30", "CPR Certified")
- `certificationNumber` (varchar 100) - Certification ID/Number
- `issuedDate` (date) - When certification was issued
- `expirationDate` (date) - When certification expires (for renewal tracking)
- `issuer` (varchar 100) - Organization that issued certification (e.g., "OSHA", "Red Cross")
- `notes` (text) - Additional notes about the skill/certification
- `createdAt` (timestamp) - Record creation time
- `updatedAt` (timestamp) - Last update time

**Example Data:**
```sql
INSERT INTO crewSkills (userId, crewId, skillName, skillLevel, certificationName, certificationNumber, expirationDate, issuer)
VALUES (1, 1, 'Asphalt Shingles', 'expert', 'OSHA 30', 'OSHA-2024-001', '2026-05-01', 'OSHA');
```

#### 2. `skillCategories` Table
Organizes skills into categories for better management and filtering.

**Columns:**
- `id` (int, PK) - Unique identifier
- `userId` (int) - User who owns the category
- `categoryName` (varchar 100) - Category name (e.g., "Roofing Materials", "Safety", "Tools")
- `description` (text) - Category description
- `createdAt` (timestamp) - Record creation time
- `updatedAt` (timestamp) - Last update time

**Example Data:**
```sql
INSERT INTO skillCategories (userId, categoryName, description)
VALUES (1, 'Roofing Materials', 'Skills related to different roofing material types');
```

#### 3. `predefinedSkills` Table
Master list of available skills that can be assigned to crews. Helps maintain consistency and enables skill requirement matching.

**Columns:**
- `id` (int, PK) - Unique identifier
- `userId` (int) - User who owns the skill definition
- `skillName` (varchar 100) - Skill name
- `categoryId` (int) - Associated skill category
- `description` (text) - Skill description
- `isRequired` (boolean) - Whether this skill is mandatory for certain job types
- `createdAt` (timestamp) - Record creation time
- `updatedAt` (timestamp) - Last update time

**Example Data:**
```sql
INSERT INTO predefinedSkills (userId, skillName, categoryId, isRequired)
VALUES (1, 'Asphalt Shingles', 1, true);
```

## API Procedures (tRPC)

### Crew Skills Router

#### `crewSkills.getByCrew`
Retrieve all skills for a specific crew.

**Input:**
```typescript
{ crewId: number }
```

**Output:**
```typescript
CrewSkill[]
```

**Example:**
```typescript
const skills = await trpc.crewSkills.getByCrew.useQuery({ crewId: 1 });
```

#### `crewSkills.getById`
Get a specific crew skill by ID.

**Input:**
```typescript
{ id: number }
```

**Output:**
```typescript
CrewSkill | null
```

#### `crewSkills.create`
Add a new skill or certification to a crew member.

**Input:**
```typescript
{
  crewId: number;
  skillName: string;
  skillLevel: "beginner" | "intermediate" | "expert";
  certificationName?: string;
  certificationNumber?: string;
  issuedDate?: Date;
  expirationDate?: Date;
  issuer?: string;
  notes?: string;
}
```

**Output:**
```typescript
CrewSkill
```

**Example:**
```typescript
const newSkill = await trpc.crewSkills.create.useMutation().mutateAsync({
  crewId: 1,
  skillName: "Metal Roofing",
  skillLevel: "expert",
  certificationName: "Metal Roofing Certified",
  expirationDate: new Date("2026-05-01"),
  issuer: "NRCA"
});
```

#### `crewSkills.update`
Update an existing crew skill.

**Input:**
```typescript
{
  id: number;
  skillName?: string;
  skillLevel?: "beginner" | "intermediate" | "expert";
  certificationName?: string;
  certificationNumber?: string;
  issuedDate?: Date;
  expirationDate?: Date;
  issuer?: string;
  notes?: string;
}
```

**Output:**
```typescript
CrewSkill
```

#### `crewSkills.delete`
Remove a skill from a crew member.

**Input:**
```typescript
{ id: number }
```

#### `crewSkills.getExpiredCertifications`
Get all expired certifications for the user's crews.

**Output:**
```typescript
CrewSkill[]
```

**Use Case:** Identify certifications that need renewal.

#### `crewSkills.getExpiringCertifications`
Get certifications expiring within a specified number of days.

**Input:**
```typescript
{ daysUntilExpiry: number } // default: 30
```

**Output:**
```typescript
CrewSkill[]
```

**Use Case:** Send renewal reminders before certifications expire.

### Skill Categories Router

#### `skillCategories.list`
Get all skill categories for the user.

**Output:**
```typescript
SkillCategory[]
```

#### `skillCategories.create`
Create a new skill category.

**Input:**
```typescript
{
  categoryName: string;
  description?: string;
}
```

**Output:**
```typescript
SkillCategory
```

### Predefined Skills Router

#### `predefinedSkills.list`
Get all available predefined skills.

**Output:**
```typescript
PredefinedSkill[]
```

#### `predefinedSkills.getRequired`
Get only the required skills for job assignments.

**Output:**
```typescript
PredefinedSkill[]
```

#### `predefinedSkills.create`
Add a new predefined skill to the system.

**Input:**
```typescript
{
  skillName: string;
  categoryId?: number;
  description?: string;
  isRequired: boolean;
}
```

**Output:**
```typescript
PredefinedSkill
```

## Database Helpers (server/db.ts)

### Crew Skills Functions

```typescript
// Get all skills for a crew
export async function getCrewSkills(crewId: number): Promise<CrewSkill[]>

// Get a specific skill by ID
export async function getCrewSkillById(id: number): Promise<CrewSkill | null>

// Create a new crew skill
export async function createCrewSkill(data: InsertCrewSkill): Promise<CrewSkill>

// Update a crew skill
export async function updateCrewSkill(id: number, data: Partial<InsertCrewSkill>): Promise<CrewSkill>

// Delete a crew skill
export async function deleteCrewSkill(id: number): Promise<void>

// Get expired certifications
export async function getExpiredCertifications(userId: number): Promise<CrewSkill[]>

// Get certifications expiring soon
export async function getExpiringCertifications(userId: number, daysUntilExpiry: number = 30): Promise<CrewSkill[]>
```

### Skill Categories Functions

```typescript
// Get all skill categories
export async function getSkillCategories(userId: number): Promise<SkillCategory[]>

// Create a new skill category
export async function createSkillCategory(data: InsertSkillCategory): Promise<SkillCategory>
```

### Predefined Skills Functions

```typescript
// Get all predefined skills
export async function getPredefinedSkills(userId: number): Promise<PredefinedSkill[]>

// Get only required skills
export async function getRequiredSkills(userId: number): Promise<PredefinedSkill[]>

// Create a new predefined skill
export async function createPredefinedSkill(data: InsertPredefinedSkill): Promise<PredefinedSkill>
```

## Common Use Cases

### 1. Adding a Certification to a Crew Member

```typescript
// Frontend
const mutation = trpc.crewSkills.create.useMutation();

await mutation.mutateAsync({
  crewId: 1,
  skillName: "Asphalt Shingles",
  skillLevel: "expert",
  certificationName: "OSHA 30",
  certificationNumber: "OSHA-2024-001",
  expirationDate: new Date("2026-05-01"),
  issuer: "OSHA",
  notes: "Completed advanced safety training"
});
```

### 2. Checking for Expiring Certifications

```typescript
// Frontend
const { data: expiringCerts } = trpc.crewSkills.getExpiringCertifications.useQuery({ 
  daysUntilExpiry: 60 
});

// Display warning if any certifications are expiring
if (expiringCerts && expiringCerts.length > 0) {
  console.warn("Certifications expiring soon:", expiringCerts);
}
```

### 3. Matching Crews to Jobs Based on Skills

```typescript
// Backend (in a job assignment procedure)
const jobRequiredSkills = ["Metal Roofing", "Fall Protection"];
const crewSkills = await db.getCrewSkills(crewId);
const crewSkillNames = crewSkills.map(s => s.skillName);

const isQualified = jobRequiredSkills.every(skill => 
  crewSkillNames.includes(skill)
);
```

### 4. Viewing Crew Skills in UI

```typescript
// Frontend Component
const { data: crew } = trpc.crews.getById.useQuery({ id: crewId });
const { data: skills } = trpc.crewSkills.getByCrew.useQuery({ crewId });

return (
  <div>
    <h2>{crew?.name}</h2>
    <div>
      {skills?.map(skill => (
        <div key={skill.id}>
          <span>{skill.skillName}</span>
          <span>{skill.skillLevel}</span>
          {skill.expirationDate && (
            <span>Expires: {new Date(skill.expirationDate).toLocaleDateString()}</span>
          )}
        </div>
      ))}
    </div>
  </div>
);
```

## Certification Renewal Workflow

1. **Tracking:** Certifications are stored with `expirationDate`
2. **Monitoring:** Use `getExpiringCertifications(userId, 30)` to identify certifications expiring within 30 days
3. **Alerts:** Display warnings in the UI when certifications are expiring
4. **Renewal:** Update the skill record with new certification details and expiration date
5. **Compliance:** Generate reports showing certification status for compliance audits

## Best Practices

1. **Skill Levels:** Use consistent skill levels (beginner, intermediate, expert) for standardized reporting
2. **Certification Tracking:** Always record expiration dates for compliance-critical certifications
3. **Categories:** Organize skills into categories for easier filtering and job matching
4. **Required Skills:** Mark essential skills as "required" in predefined skills for job assignment logic
5. **Documentation:** Use the `notes` field to document special training or endorsements
6. **Regular Audits:** Periodically review crew certifications to ensure compliance
7. **Renewal Reminders:** Set up automated reminders for expiring certifications (60-90 days before expiry)

## Future Enhancements

1. **Skill Verification:** Add approval workflow for certifications
2. **Training Records:** Track training completion and hours
3. **Skill-Based Job Assignment:** Automatically suggest qualified crews for jobs
4. **Certification Renewal Reminders:** Automated email notifications for expiring certifications
5. **Compliance Reports:** Generate certification compliance reports for audits
6. **Skill Endorsements:** Allow crew members to endorse each other's skills
7. **Training Recommendations:** Suggest training based on job requirements and crew skills

## Migration History

- **Migration 0013:** Initial crew skills schema creation
  - Created `crewSkills` table for skill tracking
  - Created `skillCategories` table for organization
  - Created `predefinedSkills` table for skill definitions
