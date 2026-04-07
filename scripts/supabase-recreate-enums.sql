-- ============================================================================
-- Drop existing ENUMs (if they have wrong values)
-- ============================================================================

DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "ProjectStatus" CASCADE;
DROP TYPE IF EXISTS "EvaluationStatus" CASCADE;

-- ============================================================================
-- Create correct ENUMs
-- ============================================================================

CREATE TYPE "UserRole" AS ENUM ('admin', 'manager', 'analyst', 'viewer');
CREATE TYPE "ProjectStatus" AS ENUM ('brouillon', 'en_cours', 'en_revue', 'approuve', 'rejete');
CREATE TYPE "EvaluationStatus" AS ENUM ('brouillon', 'soumis', 'valide', 'rejete');

SELECT 'SUCCESS: ENUMs recreated' as status;
