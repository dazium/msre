-- Seed test crews with leads and members
-- This script creates 5 realistic roofing crews with hierarchical structure

-- Get the owner's user ID (assuming it's 1 for the owner)
SET @userId = 1;

-- Crew 1: North Side Team
INSERT INTO crews (userId, name, description, phone, email, status, createdAt, updatedAt) 
VALUES (@userId, 'North Side Team', 'Experienced crew specializing in residential asphalt roofing', '519-555-0101', 'northside@roofing.local', 'active', NOW(), NOW());
SET @crew1Id = LAST_INSERT_ID();

-- Add crew members for Crew 1
INSERT INTO crewMembers (crewId, name, role, phone, email, joinDate, createdAt, updatedAt) 
VALUES 
  (@crew1Id, 'Mike Thompson', 'Lead', '519-555-0101', 'mike@roofing.local', NOW(), NOW(), NOW()),
  (@crew1Id, 'David Chen', 'Roofer', '519-555-0102', 'david@roofing.local', NOW(), NOW(), NOW()),
  (@crew1Id, 'James Wilson', 'Helper', '519-555-0103', 'james@roofing.local', NOW(), NOW(), NOW());

-- Set crew lead for Crew 1
UPDATE crews SET crewLeadId = (SELECT id FROM crewMembers WHERE crewId = @crew1Id AND name = 'Mike Thompson' LIMIT 1) WHERE id = @crew1Id;

-- Crew 2: East End Specialists
INSERT INTO crews (userId, name, description, phone, email, status, createdAt, updatedAt) 
VALUES (@userId, 'East End Specialists', 'Metal and commercial roofing experts', '519-555-0201', 'eastend@roofing.local', 'active', NOW(), NOW());
SET @crew2Id = LAST_INSERT_ID();

-- Add crew members for Crew 2
INSERT INTO crewMembers (crewId, name, role, phone, email, joinDate, createdAt, updatedAt) 
VALUES 
  (@crew2Id, 'Sarah Martinez', 'Lead', '519-555-0201', 'sarah@roofing.local', NOW(), NOW(), NOW()),
  (@crew2Id, 'Robert Lee', 'Roofer', '519-555-0202', 'robert@roofing.local', NOW(), NOW(), NOW()),
  (@crew2Id, 'Lisa Patel', 'Roofer', '519-555-0203', 'lisa@roofing.local', NOW(), NOW(), NOW()),
  (@crew2Id, 'Tom Brown', 'Helper', '519-555-0204', 'tom@roofing.local', NOW(), NOW(), NOW());

-- Set crew lead for Crew 2
UPDATE crews SET crewLeadId = (SELECT id FROM crewMembers WHERE crewId = @crew2Id AND name = 'Sarah Martinez' LIMIT 1) WHERE id = @crew2Id;

-- Crew 3: Downtown Crew
INSERT INTO crews (userId, name, description, phone, email, status, createdAt, updatedAt) 
VALUES (@userId, 'Downtown Crew', 'Urban roofing and repairs', '519-555-0301', 'downtown@roofing.local', 'active', NOW(), NOW());
SET @crew3Id = LAST_INSERT_ID();

-- Add crew members for Crew 3
INSERT INTO crewMembers (crewId, name, role, phone, email, joinDate, createdAt, updatedAt) 
VALUES 
  (@crew3Id, 'Kevin O''Brien', 'Lead', '519-555-0301', 'kevin@roofing.local', NOW(), NOW(), NOW()),
  (@crew3Id, 'Alex Johnson', 'Roofer', '519-555-0302', 'alex@roofing.local', NOW(), NOW(), NOW()),
  (@crew3Id, 'Marcus Davis', 'Helper', '519-555-0303', 'marcus@roofing.local', NOW(), NOW(), NOW());

-- Set crew lead for Crew 3
UPDATE crews SET crewLeadId = (SELECT id FROM crewMembers WHERE crewId = @crew3Id AND name = 'Kevin O''Brien' LIMIT 1) WHERE id = @crew3Id;

-- Crew 4: West Windsor Team
INSERT INTO crews (userId, name, description, phone, email, status, createdAt, updatedAt) 
VALUES (@userId, 'West Windsor Team', 'Residential and commercial specialists', '519-555-0401', 'westwindsor@roofing.local', 'active', NOW(), NOW());
SET @crew4Id = LAST_INSERT_ID();

-- Add crew members for Crew 4
INSERT INTO crewMembers (crewId, name, role, phone, email, joinDate, createdAt, updatedAt) 
VALUES 
  (@crew4Id, 'Patricia Garcia', 'Lead', '519-555-0401', 'patricia@roofing.local', NOW(), NOW(), NOW()),
  (@crew4Id, 'Christopher Hall', 'Roofer', '519-555-0402', 'christopher@roofing.local', NOW(), NOW(), NOW()),
  (@crew4Id, 'Jennifer White', 'Roofer', '519-555-0403', 'jennifer@roofing.local', NOW(), NOW(), NOW()),
  (@crew4Id, 'Steven Black', 'Helper', '519-555-0404', 'steven@roofing.local', NOW(), NOW(), NOW()),
  (@crew4Id, 'Emily Green', 'Helper', '519-555-0405', 'emily@roofing.local', NOW(), NOW(), NOW());

-- Set crew lead for Crew 4
UPDATE crews SET crewLeadId = (SELECT id FROM crewMembers WHERE crewId = @crew4Id AND name = 'Patricia Garcia' LIMIT 1) WHERE id = @crew4Id;

-- Crew 5: Riverside Restoration
INSERT INTO crews (userId, name, description, phone, email, status, createdAt, updatedAt) 
VALUES (@userId, 'Riverside Restoration', 'Restoration and emergency repairs', '519-555-0501', 'riverside@roofing.local', 'active', NOW(), NOW());
SET @crew5Id = LAST_INSERT_ID();

-- Add crew members for Crew 5
INSERT INTO crewMembers (crewId, name, role, phone, email, joinDate, createdAt, updatedAt) 
VALUES 
  (@crew5Id, 'Richard Anderson', 'Lead', '519-555-0501', 'richard@roofing.local', NOW(), NOW(), NOW()),
  (@crew5Id, 'William Taylor', 'Roofer', '519-555-0502', 'william@roofing.local', NOW(), NOW(), NOW()),
  (@crew5Id, 'Joseph Miller', 'Helper', '519-555-0503', 'joseph@roofing.local', NOW(), NOW(), NOW());

-- Set crew lead for Crew 5
UPDATE crews SET crewLeadId = (SELECT id FROM crewMembers WHERE crewId = @crew5Id AND name = 'Richard Anderson' LIMIT 1) WHERE id = @crew5Id;
