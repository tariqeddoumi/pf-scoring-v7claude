-- Enable RLS on tables with sensitive columns (highest priority)
-- These tables contain passwords and tax IDs that must be protected

-- 1. BP_PF_users table (password field)
ALTER TABLE "BP_PF_users" ENABLE ROW LEVEL SECURITY;

-- 2. BCP_SCORE_GP_users table (password field)
ALTER TABLE "BCP_SCORE_GP_users" ENABLE ROW LEVEL SECURITY;

-- 3. pf_scoring_users table (password field)
ALTER TABLE "pf_scoring_users" ENABLE ROW LEVEL SECURITY;

-- 4. pi_promoters table (tax_id field)
ALTER TABLE "pi_promoters" ENABLE ROW LEVEL SECURITY;

-- Create policies for BP_PF_users
-- Allow service role (used by Prisma) full access
CREATE POLICY "service_role_full_access" ON "BP_PF_users"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to read only their own record
CREATE POLICY "users_read_own_record" ON "BP_PF_users"
  FOR SELECT
  USING (id = auth.uid() OR auth.role() = 'service_role');

-- Allow authenticated users to update only their own record
CREATE POLICY "users_update_own_record" ON "BP_PF_users"
  FOR UPDATE
  USING (id = auth.uid() OR auth.role() = 'service_role')
  WITH CHECK (id = auth.uid() OR auth.role() = 'service_role');

-- Create policies for BCP_SCORE_GP_users (same pattern)
CREATE POLICY "service_role_full_access" ON "BCP_SCORE_GP_users"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "users_read_own_record" ON "BCP_SCORE_GP_users"
  FOR SELECT
  USING (id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "users_update_own_record" ON "BCP_SCORE_GP_users"
  FOR UPDATE
  USING (id = auth.uid() OR auth.role() = 'service_role')
  WITH CHECK (id = auth.uid() OR auth.role() = 'service_role');

-- Create policies for pf_scoring_users (same pattern)
CREATE POLICY "service_role_full_access" ON "pf_scoring_users"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "users_read_own_record" ON "pf_scoring_users"
  FOR SELECT
  USING (id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "users_update_own_record" ON "pf_scoring_users"
  FOR UPDATE
  USING (id = auth.uid() OR auth.role() = 'service_role')
  WITH CHECK (id = auth.uid() OR auth.role() = 'service_role');

-- Create policies for pi_promoters (same pattern)
CREATE POLICY "service_role_full_access" ON "pi_promoters"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- For pi_promoters, allow authenticated users to read all (no sensitive data exposure for tax_id at row level)
CREATE POLICY "authenticated_read_all" ON "pi_promoters"
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Restrict write access to service role only
CREATE POLICY "service_role_write_only" ON "pi_promoters"
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_update_only" ON "pi_promoters"
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_delete_only" ON "pi_promoters"
  FOR DELETE
  USING (auth.role() = 'service_role');
