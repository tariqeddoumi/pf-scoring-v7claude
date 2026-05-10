-- Align UserRole enum with permissions system
-- Step 1: Add temporary column
ALTER TABLE "User" ADD COLUMN "role_new" TEXT;

-- Step 2: Map old roles to new roles
UPDATE "User" SET "role_new" = CASE "role"
  WHEN 'admin' THEN 'system_admin'
  WHEN 'manager' THEN 'risk_manager'
  WHEN 'analyst' THEN 'risk_analyst'
  WHEN 'viewer' THEN 'read_only'
  ELSE 'read_only'
END;

-- Step 3: Create new enum type
CREATE TYPE "UserRole_new" AS ENUM ('system_admin', 'scoring_admin', 'risk_manager', 'committee_member', 'risk_analyst', 'auditor', 'read_only');

-- Step 4: Convert the column
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING role_new::"UserRole_new";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'read_only';

-- Step 5: Drop old enum and rename new one
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Step 6: Drop temp column
ALTER TABLE "User" DROP COLUMN "role_new";
