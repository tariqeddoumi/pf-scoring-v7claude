-- Enable RLS on reference, lookup, and configuration tables
-- These tables support the main application but have less sensitive data

-- V7++ Scoring Structure Tables
ALTER TABLE "BP_PF_v7pp_domains" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_v7pp_sub_criteria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_v7pp_sub_sub_criteria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_v7pp_scoring_nodes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_v7pp_scoring_node_options" ENABLE ROW LEVEL SECURITY;

-- V7++ Configuration Tables
ALTER TABLE "BP_PF_v7pp_answer_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_v7pp_rating_scales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_v7pp_aggregation_methods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_v7pp_node_data_bindings" ENABLE ROW LEVEL SECURITY;

-- V8 Sector Integration Tables
ALTER TABLE "V8Sector" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "V8SectorDomainWeight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "V8SectorStressTest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "V8SectorRedFlag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "V8SectorDomainImpact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "V8IntegrationRule" ENABLE ROW LEVEL SECURITY;

-- Scoring Model & Governance Tables
ALTER TABLE "ScoringModel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScoringModelVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScoringEvaluation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScoringChangeLog" ENABLE ROW LEVEL SECURITY;

-- Audit Tables
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScoringAuditLog" ENABLE ROW LEVEL SECURITY;

-- Create blanket service_role policies for all reference tables
-- These are typically read-only for authenticated users, write-only for service_role

-- V7++ Structure
CREATE POLICY "service_role_all_access" ON "BP_PF_v7pp_domains"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "BP_PF_v7pp_domains"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "BP_PF_v7pp_sub_criteria"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "BP_PF_v7pp_sub_criteria"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "BP_PF_v7pp_sub_sub_criteria"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "BP_PF_v7pp_sub_sub_criteria"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "BP_PF_v7pp_scoring_nodes"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "BP_PF_v7pp_scoring_nodes"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "BP_PF_v7pp_scoring_node_options"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "BP_PF_v7pp_scoring_node_options"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

-- V7++ Configuration
CREATE POLICY "service_role_all_access" ON "BP_PF_v7pp_answer_types"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "BP_PF_v7pp_answer_types"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "BP_PF_v7pp_rating_scales"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "BP_PF_v7pp_rating_scales"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "BP_PF_v7pp_aggregation_methods"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "BP_PF_v7pp_aggregation_methods"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "BP_PF_v7pp_node_data_bindings"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "BP_PF_v7pp_node_data_bindings"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

-- V8 Sector Integration
CREATE POLICY "service_role_all_access" ON "V8Sector"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "V8Sector"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "V8SectorDomainWeight"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "V8SectorDomainWeight"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "V8SectorStressTest"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "V8SectorStressTest"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "V8SectorRedFlag"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "V8SectorRedFlag"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "V8SectorDomainImpact"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "V8SectorDomainImpact"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "V8IntegrationRule"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "V8IntegrationRule"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Audit Tables (read-only for authenticated users)
CREATE POLICY "service_role_all_access" ON "AuditLog"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "AuditLog"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "ScoringAuditLog"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "ScoringAuditLog"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Scoring Model Tables
CREATE POLICY "service_role_all_access" ON "ScoringModel"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "ScoringModel"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "ScoringModelVersion"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "ScoringModelVersion"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "ScoringEvaluation"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "ScoringEvaluation"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "service_role_all_access" ON "ScoringChangeLog"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read" ON "ScoringChangeLog"
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));
