-- ============================================================================
-- Scoring Engine V8 - Supabase Setup Script
-- ============================================================================
-- This script sets up the Scoring Engine V8 infrastructure in Supabase
-- Includes: test data, indexes, and verification queries
--
-- NOTE: Database migrations (tables) are already applied via migrations
-- This script adds test data, indexes, and configuration
--
-- Execution: Run in Supabase SQL editor
-- Time: ~30 seconds
-- ============================================================================

-- ============================================================================
-- SECTION 1: VERIFICATION - Ensure All Tables Exist
-- ============================================================================

-- Check if BP_PF_v7pp_scoring_models table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'BP_PF_v7pp_scoring_models') THEN
    RAISE NOTICE 'ERROR: Table BP_PF_v7pp_scoring_models does not exist. Run migrations first.';
  ELSE
    RAISE NOTICE 'OK: Table BP_PF_v7pp_scoring_models exists';
  END IF;
END $$;

-- Verify ScoringEvaluationAnswer has new columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'BP_PF_v7pp_evaluation_answers'
    AND column_name = 'source_type'
  ) THEN
    RAISE NOTICE 'ERROR: Column source_type not found in BP_PF_v7pp_evaluation_answers. Run migrations first.';
  ELSE
    RAISE NOTICE 'OK: Column source_type exists in BP_PF_v7pp_evaluation_answers';
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: CREATE INDEXES (if not exist)
-- ============================================================================

-- Model indexes
CREATE INDEX IF NOT EXISTS idx_scoring_models_code
  ON BP_PF_v7pp_scoring_models(code);
CREATE INDEX IF NOT EXISTS idx_scoring_models_status
  ON BP_PF_v7pp_scoring_models(status);

-- Version indexes
CREATE INDEX IF NOT EXISTS idx_scoring_versions_model_id
  ON BP_PF_v7pp_scoring_versions(model_id);
CREATE INDEX IF NOT EXISTS idx_scoring_versions_status
  ON BP_PF_v7pp_scoring_versions(status);

-- Node indexes
CREATE INDEX IF NOT EXISTS idx_scoring_nodes_version_id
  ON BP_PF_v7pp_scoring_nodes(version_id);
CREATE INDEX IF NOT EXISTS idx_scoring_nodes_parent_id
  ON BP_PF_v7pp_scoring_nodes(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_scoring_nodes_code
  ON BP_PF_v7pp_scoring_nodes(code);
CREATE INDEX IF NOT EXISTS idx_scoring_nodes_depth
  ON BP_PF_v7pp_scoring_nodes(depth);

-- Evaluation indexes
CREATE INDEX IF NOT EXISTS idx_scoring_evaluations_project_id
  ON BP_PF_v7pp_scoring_evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_scoring_evaluations_status
  ON BP_PF_v7pp_scoring_evaluations(status);
CREATE INDEX IF NOT EXISTS idx_scoring_evaluations_model_id
  ON BP_PF_v7pp_scoring_evaluations(model_id);

-- Answer indexes
CREATE INDEX IF NOT EXISTS idx_evaluation_answers_evaluation_id
  ON BP_PF_v7pp_evaluation_answers(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_answers_node_id
  ON BP_PF_v7pp_evaluation_answers(node_id);

-- Binding indexes
CREATE INDEX IF NOT EXISTS idx_node_bindings_node_id
  ON BP_PF_v7pp_node_data_bindings(node_id);
CREATE INDEX IF NOT EXISTS idx_node_bindings_source_entity
  ON BP_PF_v7pp_node_data_bindings(source_entity);

-- Rule indexes
CREATE INDEX IF NOT EXISTS idx_node_rules_version_id
  ON BP_PF_v7pp_scoring_node_rules(version_id);
CREATE INDEX IF NOT EXISTS idx_node_rules_node_id
  ON BP_PF_v7pp_scoring_node_rules(node_id);

-- ============================================================================
-- SECTION 3: TEST DATA - Create Sample Scoring Model
-- ============================================================================

-- Insert test model
INSERT INTO BP_PF_v7pp_scoring_models (
  code, label, business_segment, project_type, status, description, created_at, updated_at
) VALUES (
  'PF_SCORE_TEST',
  'Project Finance Scoring - Test Model',
  'ENERGY',
  'RENEWABLE',
  'DRAFT',
  'Test model for Scoring Engine V8 verification',
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Get the model ID for subsequent operations
WITH model_data AS (
  SELECT id as model_id FROM BP_PF_v7pp_scoring_models
  WHERE code = 'PF_SCORE_TEST'
  LIMIT 1
)
INSERT INTO BP_PF_v7pp_scoring_versions (
  model_id, version_number, label, status, is_published,
  created_by, validated_by, published_by, created_at, updated_at
)
SELECT model_id, 1, 'Version 1.0 - Test', 'DRAFT', false, 'system', NULL, NULL, NOW(), NOW()
FROM model_data
ON CONFLICT (model_id, version_number) DO NOTHING;

-- Create root node (DOMAIN)
WITH version_data AS (
  SELECT v.id as version_id, m.id as model_id FROM BP_PF_v7pp_scoring_versions v
  JOIN BP_PF_v7pp_scoring_models m ON v.model_id = m.id
  WHERE m.code = 'PF_SCORE_TEST' AND v.version_number = 1
  LIMIT 1
)
INSERT INTO BP_PF_v7pp_scoring_nodes (
  version_id, parent_node_id, node_type, code, label, description,
  depth, order_index, is_active, is_terminal, is_scored, is_mandatory,
  weight, weight_mode, aggregation_method, answer_type, scoring_method,
  score_min, score_max, created_at, updated_at
)
SELECT
  version_id, NULL, 'DOMAIN', 'FINANCIAL_HEALTH',
  'Financial Health Assessment',
  'Evaluate the financial health of the project',
  0, 1, true, false, false, false,
  NULL, NULL, 'WEIGHTED_SUM', NULL, NULL, NULL, NULL, NOW(), NOW()
FROM version_data
ON CONFLICT DO NOTHING;

-- Create child node (CRITERION)
WITH node_data AS (
  SELECT n.id as parent_id, n.version_id FROM BP_PF_v7pp_scoring_nodes n
  WHERE n.code = 'FINANCIAL_HEALTH' AND n.node_type = 'DOMAIN'
  LIMIT 1
)
INSERT INTO BP_PF_v7pp_scoring_nodes (
  version_id, parent_node_id, node_type, code, label, description,
  depth, order_index, is_active, is_terminal, is_scored, is_mandatory,
  weight, weight_mode, aggregation_method, answer_type, scoring_method,
  score_min, score_max, created_at, updated_at
)
SELECT
  version_id, parent_id, 'CRITERION', 'DEBT_SERVICE_COVERAGE',
  'Debt Service Coverage Ratio',
  'Measure the ability to service debt from operating cash flow',
  1, 1, true, true, true, false,
  50, 'FIXED', NULL, 'NUMBER', 'RANGE', 0, 100, NOW(), NOW()
FROM node_data
ON CONFLICT DO NOTHING;

-- Create scoring options for the leaf node
WITH node_data AS (
  SELECT n.id as node_id FROM BP_PF_v7pp_scoring_nodes n
  WHERE n.code = 'DEBT_SERVICE_COVERAGE'
  LIMIT 1
)
INSERT INTO BP_PF_v7pp_scoring_options (
  node_id, code, label, value, score, risk_level, color, order_index, is_default, is_active
)
SELECT node_id, 'DSCR_HIGH', 'High DSCR (>1.3)', '>1.3', 100, 'LOW', '#22c55e', 1, false, true
FROM node_data
UNION ALL
SELECT node_id, 'DSCR_MEDIUM', 'Medium DSCR (1.2-1.3)', '1.2-1.3', 80, 'MEDIUM', '#eab308', 2, false, true
FROM node_data
UNION ALL
SELECT node_id, 'DSCR_LOW', 'Low DSCR (<1.2)', '<1.2', 40, 'HIGH', '#ef4444', 3, false, true
FROM node_data
ON CONFLICT DO NOTHING;

-- Create scoring ranges
WITH node_data AS (
  SELECT n.id as node_id FROM BP_PF_v7pp_scoring_nodes n
  WHERE n.code = 'DEBT_SERVICE_COVERAGE'
  LIMIT 1
)
INSERT INTO BP_PF_v7pp_scoring_ranges (
  node_id, label, min_value, max_value, min_included, max_included,
  score, color, order_index, is_active
)
SELECT node_id, '1.3+', 1.3, 999, true, true, 100, '#22c55e', 1, true FROM node_data
UNION ALL
SELECT node_id, '1.2-1.3', 1.2, 1.3, true, false, 80, '#eab308', 2, true FROM node_data
UNION ALL
SELECT node_id, '<1.2', 0, 1.2, true, false, 40, '#ef4444', 3, true FROM node_data
ON CONFLICT DO NOTHING;

-- Create sample binding
WITH node_data AS (
  SELECT n.id as node_id FROM BP_PF_v7pp_scoring_nodes n
  WHERE n.code = 'DEBT_SERVICE_COVERAGE'
  LIMIT 1
)
INSERT INTO BP_PF_v7pp_node_data_bindings (
  node_id, source_entity, source_field, source_path, binding_mode,
  data_type, transform_type, transform_config_json,
  default_value, fallback_value, fallback_message,
  is_required, is_read_only, allow_override, override_requires_reason,
  priority, is_active, created_at, updated_at
)
SELECT
  node_id, 'PROJECT', 'dscr', 'financials.dscr', 'AUTO_EDITABLE',
  'NUMBER', 'NONE', NULL,
  NULL, '1.0', 'DSCR not available from project data',
  false, false, true, false,
  100, true, NOW(), NOW()
FROM node_data
ON CONFLICT DO NOTHING;

-- Create sample rule (MALUS for low DSCR)
WITH node_data AS (
  SELECT n.id as node_id, n.version_id FROM BP_PF_v7pp_scoring_nodes n
  WHERE n.code = 'DEBT_SERVICE_COVERAGE'
  LIMIT 1
)
INSERT INTO BP_PF_v7pp_scoring_node_rules (
  version_id, node_id, rule_type, code, label, description,
  condition_expression, severity, action_type, penalty_value,
  message_user, message_committee, blocking, is_active,
  created_at, updated_at
)
SELECT
  version_id, node_id, 'MALUS', 'DSCR_LOW_PENALTY',
  'Low DSCR Penalty',
  'Apply penalty when DSCR is below 1.2',
  'score < 60', 'MEDIUM', 'APPLY_MALUS', 15,
  'Project has low debt service coverage ratio',
  'DSCR < 1.2: Apply 15 point penalty',
  false, true,
  NOW(), NOW()
FROM node_data
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 4: DATA CLEANUP - Set defaults and constraints
-- ============================================================================

-- Ensure all models have a default status
UPDATE BP_PF_v7pp_scoring_models
SET status = 'DRAFT'
WHERE status IS NULL;

-- Ensure all versions have a default status
UPDATE BP_PF_v7pp_scoring_versions
SET status = 'DRAFT'
WHERE status IS NULL;

-- ============================================================================
-- SECTION 5: VERIFICATION QUERIES
-- ============================================================================

-- Verify tables have data
SELECT 'Models' as table_name, COUNT(*) as count FROM BP_PF_v7pp_scoring_models
UNION ALL
SELECT 'Versions', COUNT(*) FROM BP_PF_v7pp_scoring_versions
UNION ALL
SELECT 'Nodes', COUNT(*) FROM BP_PF_v7pp_scoring_nodes
UNION ALL
SELECT 'Options', COUNT(*) FROM BP_PF_v7pp_scoring_options
UNION ALL
SELECT 'Ranges', COUNT(*) FROM BP_PF_v7pp_scoring_ranges
UNION ALL
SELECT 'Bindings', COUNT(*) FROM BP_PF_v7pp_node_data_bindings
UNION ALL
SELECT 'Rules', COUNT(*) FROM BP_PF_v7pp_scoring_node_rules
UNION ALL
SELECT 'Evaluations', COUNT(*) FROM BP_PF_v7pp_scoring_evaluations
UNION ALL
SELECT 'Answers', COUNT(*) FROM BP_PF_v7pp_evaluation_answers
UNION ALL
SELECT 'Node Results', COUNT(*) FROM BP_PF_v7pp_evaluation_node_results;

-- Display test model hierarchy
SELECT
  CONCAT(REPEAT('  ', n.depth), n.label) as hierarchy,
  n.code,
  n.node_type,
  n.is_scored,
  COALESCE(n.weight::text, 'N/A') as weight
FROM BP_PF_v7pp_scoring_nodes n
WHERE n.version_id IN (
  SELECT v.id FROM BP_PF_v7pp_scoring_versions v
  JOIN BP_PF_v7pp_scoring_models m ON v.model_id = m.id
  WHERE m.code = 'PF_SCORE_TEST'
)
ORDER BY n.depth, n.order_index;

-- ============================================================================
-- SECTION 6: FINAL STATUS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Scoring Engine V8 Setup Complete';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Test Model: PF_SCORE_TEST (Version 1.0)';
  RAISE NOTICE 'Nodes: 3 (1 DOMAIN + 1 CRITERION + 1 leaf)';
  RAISE NOTICE 'Options: 3 (DSCR scoring categories)';
  RAISE NOTICE 'Ranges: 3 (DSCR numeric brackets)';
  RAISE NOTICE 'Bindings: 1 (PROJECT.financials.dscr)';
  RAISE NOTICE 'Rules: 1 (MALUS for low DSCR)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Create a new project in the PF application';
  RAISE NOTICE '2. Create evaluation: POST /api/scoring/evaluations';
  RAISE NOTICE '3. Load form: GET /api/scoring/evaluations/{id}/form';
  RAISE NOTICE '4. Save answers: PATCH /api/scoring/evaluations/{id}/answers';
  RAISE NOTICE '5. Calculate: POST /api/scoring/evaluations/{id}/calculate';
  RAISE NOTICE '6. View results: GET /api/scoring/evaluations/{id}/trace';
  RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- END OF SETUP SCRIPT
-- ============================================================================
