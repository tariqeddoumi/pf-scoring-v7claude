-- Add missing 'pays' column to projects
--
-- Root cause: the project form (app/projects/new + edit) and the Zod
-- validation schema (createProjectSchema) both include a `pays` field, and
-- ProjectService spreads the validated payload (...rest) into
-- prisma.project.create(). But `pays` was never a column on the Project
-- model, so Prisma rejected the create with "Unknown argument `pays`" as
-- soon as the country was filled in. Adding the column closes the last
-- front <-> back <-> DB gap on the Project entity.
--
-- Non-breaking & idempotent.

ALTER TABLE "BP_PF_projects" ADD COLUMN IF NOT EXISTS "pays" TEXT;
