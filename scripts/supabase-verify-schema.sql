-- ============================================================================
-- PF SCORING V7++ - Database Verification Script
-- Run this after creating tables to verify everything is correct
-- ============================================================================

-- ============================================================================
-- 1. VERIFY ENUMS EXIST
-- ============================================================================

SELECT
  'ENUMS' as check_type,
  typname as enum_name,
  COUNT(*) as enum_values
FROM pg_type
WHERE typname IN ('UserRole', 'ProjectStatus', 'EvaluationStatus')
GROUP BY typname
ORDER BY typname;

-- ============================================================================
-- 2. VERIFY ALL 15 TABLES EXIST WITH BP_PF PREFIX
-- ============================================================================

SELECT
  'TABLES' as check_type,
  table_name,
  'EXISTS' as status
FROM information_schema.tables
WHERE table_name LIKE 'BP_PF_%'
AND table_schema = 'public'
ORDER BY table_name;

-- Count of BP_PF tables (should be 15)
SELECT
  COUNT(*) as total_bp_pf_tables
FROM information_schema.tables
WHERE table_name LIKE 'BP_PF_%'
AND table_schema = 'public';

-- ============================================================================
-- 3. VERIFY INDEXES
-- ============================================================================

SELECT
  'INDEXES' as check_type,
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE tablename LIKE 'BP_PF_%'
GROUP BY tablename
ORDER BY tablename;

-- Total indexes (should be ~26)
SELECT COUNT(*) as total_bp_pf_indexes
FROM pg_indexes
WHERE tablename LIKE 'BP_PF_%';

-- ============================================================================
-- 4. VERIFY RELATIONSHIPS/FOREIGN KEYS
-- ============================================================================

SELECT
  'FOREIGN_KEYS' as check_type,
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.key_column_usage
WHERE table_name LIKE 'BP_PF_%'
AND referenced_table_name IS NOT NULL
ORDER BY table_name, column_name;

-- ============================================================================
-- 5. VERIFY KEY COLUMNS IN EACH TABLE
-- ============================================================================

SELECT
  'COLUMNS' as check_type,
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name LIKE 'BP_PF_%'
AND table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- ============================================================================
-- 6. TABLE-BY-TABLE VERIFICATION
-- ============================================================================

-- Users Table
SELECT 'BP_PF_users' as table_name, COUNT(*) as row_count FROM "BP_PF_users" UNION ALL

-- Projects Table
SELECT 'BP_PF_projects' as table_name, COUNT(*) as row_count FROM "BP_PF_projects" UNION ALL

-- Domains Table
SELECT 'BP_PF_domains' as table_name, COUNT(*) as row_count FROM "BP_PF_domains" UNION ALL

-- Criteria Table
SELECT 'BP_PF_criteria' as table_name, COUNT(*) as row_count FROM "BP_PF_criteria" UNION ALL

-- Options Table
SELECT 'BP_PF_options' as table_name, COUNT(*) as row_count FROM "BP_PF_options" UNION ALL

-- Ranges Table
SELECT 'BP_PF_ranges' as table_name, COUNT(*) as row_count FROM "BP_PF_ranges" UNION ALL

-- Scoring Table
SELECT 'BP_PF_scorings' as table_name, COUNT(*) as row_count FROM "BP_PF_scorings" UNION ALL

-- Evaluations Table
SELECT 'BP_PF_evaluations' as table_name, COUNT(*) as row_count FROM "BP_PF_evaluations" UNION ALL

-- Evaluation Domain Scores Table
SELECT 'BP_PF_evaluation_domain_scores' as table_name, COUNT(*) as row_count FROM "BP_PF_evaluation_domain_scores" UNION ALL

-- Evaluation Answers Table
SELECT 'BP_PF_evaluation_answers' as table_name, COUNT(*) as row_count FROM "BP_PF_evaluation_answers" UNION ALL

-- Stress Test Results Table
SELECT 'BP_PF_stress_test_results' as table_name, COUNT(*) as row_count FROM "BP_PF_stress_test_results" UNION ALL

-- Audit Logs Table
SELECT 'BP_PF_audit_logs' as table_name, COUNT(*) as row_count FROM "BP_PF_audit_logs" UNION ALL

-- Scoring Audit Logs Table
SELECT 'BP_PF_scoring_audit_logs' as table_name, COUNT(*) as row_count FROM "BP_PF_scoring_audit_logs" UNION ALL

-- Countries Table
SELECT 'BP_PF_countries' as table_name, COUNT(*) as row_count FROM "BP_PF_countries" UNION ALL

-- System Config Table
SELECT 'BP_PF_system_config' as table_name, COUNT(*) as row_count FROM "BP_PF_system_config"

ORDER BY table_name;

-- ============================================================================
-- 7. FINAL VERIFICATION SUMMARY
-- ============================================================================

SELECT
  '✓ Schema Verification Complete' as status,
  CURRENT_TIMESTAMP as checked_at,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'BP_PF_%' AND table_schema = 'public')::TEXT || ' tables' as tables_count,
  (SELECT COUNT(*) FROM pg_type WHERE typname IN ('UserRole', 'ProjectStatus', 'EvaluationStatus'))::TEXT || ' enums' as enums_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename LIKE 'BP_PF_%')::TEXT || ' indexes' as indexes_count;

-- ============================================================================
-- EXPECTED RESULTS:
-- ✓ 3 ENUMs (UserRole, ProjectStatus, EvaluationStatus)
-- ✓ 15 Tables (all BP_PF_*)
-- ✓ ~26 Indexes
-- ✓ Foreign Key relationships validated
-- ✓ All tables accessible and empty (ready for data)
-- ============================================================================
