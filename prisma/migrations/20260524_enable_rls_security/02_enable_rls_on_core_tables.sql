-- Enable RLS on core business logic tables
-- These tables don't contain sensitive data directly but control access to application resources

-- Core Project & Client Tables
ALTER TABLE "BP_PF_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BCP_SCORE_GP_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BCP_SCORE_GP_clients" ENABLE ROW LEVEL SECURITY;

-- Evaluation Tables
ALTER TABLE "BP_PF_evaluations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BCP_SCORE_GP_evaluations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_evaluation_answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BCP_SCORE_GP_evaluation_answers" ENABLE ROW LEVEL SECURITY;

-- User Profile Table
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

-- Create default policies for core tables
-- Pattern: Allow service_role (Prisma) full access, restrict authenticated users

-- Projects Tables
CREATE POLICY "service_role_all_access" ON "BP_PF_projects"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_all_access" ON "BCP_SCORE_GP_projects"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Clients Tables
CREATE POLICY "service_role_all_access" ON "BP_PF_clients"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_all_access" ON "BCP_SCORE_GP_clients"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Evaluations Tables
CREATE POLICY "service_role_all_access" ON "BP_PF_evaluations"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_all_access" ON "BCP_SCORE_GP_evaluations"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Evaluation Answers Tables
CREATE POLICY "service_role_all_access" ON "BP_PF_evaluation_answers"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_all_access" ON "BCP_SCORE_GP_evaluation_answers"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Profiles Table
CREATE POLICY "service_role_all_access" ON "profiles"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "users_read_own_profile" ON "profiles"
  FOR SELECT
  USING (id = auth.uid() OR auth.role() = 'service_role');
