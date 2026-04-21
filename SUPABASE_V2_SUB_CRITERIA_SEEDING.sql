-- ============================================================================
-- PF V7++ Scoring Model V2 - Complete Sub-Criteria Seeding
-- ============================================================================
-- This script populates v2 with a 3-level hierarchy:
-- - Level 1 (depth 0): DOMAIN nodes (9 domains)
-- - Level 2 (depth 1): GROUP nodes (converted from CRITERION - act as categories)
-- - Level 3 (depth 2): SUB_CRITERION nodes (actual scoring leaves)
--
-- Usage: Execute this entire script in Supabase SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS / UPSERT logic)
-- Time: ~10 seconds
-- ============================================================================

-- ============================================================================
-- STEP 1: Copy DOMAIN nodes from v1 to v2
-- ============================================================================
WITH v2_version AS (
  SELECT id FROM "BP_PF_v7pp_scoring_versions"
  WHERE "versionNumber" = 2
  AND "modelId" IN (SELECT id FROM "BP_PF_v7pp_scoring_models" WHERE code = 'PF_V7PP')
  LIMIT 1
),
v1_domains AS (
  SELECT n.* FROM "BP_PF_v7pp_scoring_nodes" n
  WHERE "nodeType" = 'DOMAIN'
  AND "versionId" IN (
    SELECT id FROM "BP_PF_v7pp_scoring_versions"
    WHERE "versionNumber" = 1
    AND "modelId" IN (SELECT id FROM "BP_PF_v7pp_scoring_models" WHERE code = 'PF_V7PP')
  )
)
INSERT INTO "BP_PF_v7pp_scoring_nodes" (
  id, "versionId", "parentNodeId", "nodeType", code, label, "shortLabel",
  description, "displayPath", depth, "orderIndex", "isActive", "isTerminal",
  "isScored", "isMandatory", "allowsChildren", weight, "weightMode",
  "aggregationMethod", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  v2.id,
  NULL,
  n."nodeType",
  n.code,
  n.label,
  n."shortLabel",
  n.description,
  n."displayPath",
  n.depth,
  n."orderIndex",
  n."isActive",
  n."isTerminal",
  n."isScored",
  n."isMandatory",
  n."allowsChildren",
  n.weight,
  n."weightMode",
  n."aggregationMethod",
  NOW(),
  NOW()
FROM v1_domains n, v2_version v2
WHERE NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_nodes" check_n
  WHERE check_n."versionId" = v2.id AND check_n.code = n.code AND check_n."nodeType" = 'DOMAIN'
);

-- ============================================================================
-- STEP 2: Convert CRITERION nodes to GROUP nodes (depth 1)
-- ============================================================================
WITH v2_version AS (
  SELECT id FROM "BP_PF_v7pp_scoring_versions"
  WHERE "versionNumber" = 2
  AND "modelId" IN (SELECT id FROM "BP_PF_v7pp_scoring_models" WHERE code = 'PF_V7PP')
  LIMIT 1
),
v2_domains AS (
  SELECT id, code FROM "BP_PF_v7pp_scoring_nodes"
  WHERE "versionId" IN (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 2)
  AND "nodeType" = 'DOMAIN'
),
v1_criteria AS (
  SELECT n.* FROM "BP_PF_v7pp_scoring_nodes" n
  WHERE "nodeType" = 'CRITERION'
  AND "versionId" IN (
    SELECT id FROM "BP_PF_v7pp_scoring_versions"
    WHERE "versionNumber" = 1
    AND "modelId" IN (SELECT id FROM "BP_PF_v7pp_scoring_models" WHERE code = 'PF_V7PP')
  )
)
INSERT INTO "BP_PF_v7pp_scoring_nodes" (
  id, "versionId", "parentNodeId", "nodeType", code, label, description,
  "displayPath", depth, "orderIndex", "isActive", "isTerminal", "isScored",
  "isMandatory", "allowsChildren", weight, "weightMode", "aggregationMethod",
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  v2.id,
  vd.id,
  'GROUP'::text,
  c.code,
  c.label,
  c.description,
  c.code,
  1,
  c."orderIndex",
  c."isActive",
  false,
  false,
  c."isMandatory",
  true,
  c.weight,
  'RELATIVE',
  'AVERAGE',
  NOW(),
  NOW()
FROM v1_criteria c
JOIN v2_domains vd ON vd.code = SUBSTRING(c.code, 1, 2)
JOIN v2_version v2 ON 1=1
WHERE NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_nodes"
  WHERE code = c.code AND "nodeType" = 'GROUP'
  AND "versionId" IN (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 2)
);

-- ============================================================================
-- STEP 3: Create SUB_CRITERION nodes (depth 2 - actual scoring leaves)
-- ============================================================================
WITH v2_version AS (
  SELECT id FROM "BP_PF_v7pp_scoring_versions"
  WHERE "versionNumber" = 2
  LIMIT 1
),
v2_groups AS (
  SELECT id, code FROM "BP_PF_v7pp_scoring_nodes"
  WHERE "versionId" IN (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 2)
  AND "nodeType" = 'GROUP'
),
subcriteria_data AS (
  VALUES
    -- D1: Financial Risk
    ('D1_C1_S1', 'D1_C1', 'Debt/Equity Ratio', 'Primary leverage metric', 'NUMERIC_RANGE', 0.60),
    ('D1_C1_S2', 'D1_C1', 'Gearing Analysis', 'Equity coverage analysis', 'OPTION_SINGLE', 0.40),
    ('D1_C2_S1', 'D1_C2', 'Base Case DSCR', 'DSCR at P50 cash flows', 'NUMERIC_RANGE', 0.50),
    ('D1_C2_S2', 'D1_C2', 'Minimum DSCR', 'DSCR stress tolerance', 'NUMERIC_RANGE', 0.50),
    ('D1_C3_S1', 'D1_C3', 'EBITDA/Interest (P50)', 'Interest coverage at mid-case', 'NUMERIC_RANGE', 0.50),
    ('D1_C3_S2', 'D1_C3', 'EBITDA/Interest (P90)', 'Interest coverage downside', 'NUMERIC_RANGE', 0.50),
    ('D1_C4_S1', 'D1_C4', 'Debt Service Reserve', 'Reserve adequacy', 'OPTION_SINGLE', 0.50),
    ('D1_C4_S2', 'D1_C4', 'O&M Reserve Fund', 'Operating reserve coverage', 'OPTION_SINGLE', 0.50),
    ('D1_C5_S1', 'D1_C5', 'Cash Conversion Cycle', 'Working capital efficiency', 'NUMERIC_RANGE', 0.50),
    ('D1_C5_S2', 'D1_C5', 'WC Management Quality', 'Cash flow management', 'OPTION_SINGLE', 0.50),

    -- D2: Technical Risk
    ('D2_C1_S1', 'D2_C1', 'Technology Proof', 'Proven vs emerging tech', 'OPTION_SINGLE', 0.60),
    ('D2_C1_S2', 'D2_C1', 'Reference Projects', 'Track record data', 'OPTION_SINGLE', 0.40),
    ('D2_C2_S1', 'D2_C2', 'EPC Financial Strength', 'Contractor balance sheet', 'OPTION_SINGLE', 0.50),
    ('D2_C2_S2', 'D2_C2', 'EPC Experience', 'Project track record', 'OPTION_SINGLE', 0.50),
    ('D2_C3_S1', 'D2_C3', 'Operator Qualifications', 'Management capability', 'OPTION_SINGLE', 0.50),
    ('D2_C3_S2', 'D2_C3', 'O&M Experience', 'Operational track record', 'OPTION_SINGLE', 0.50),
    ('D2_C4_S1', 'D2_C4', 'Performance Guarantees', 'Contractor guarantees', 'OPTION_SINGLE', 0.50),
    ('D2_C4_S2', 'D2_C4', 'Testing Provisions', 'Acceptance testing quality', 'OPTION_SINGLE', 0.50),
    ('D2_C5_S1', 'D2_C5', 'Critical Equipment', 'Key component sourcing', 'OPTION_SINGLE', 0.50),
    ('D2_C5_S2', 'D2_C5', 'Supply Chain Risk', 'Logistics robustness', 'OPTION_SINGLE', 0.50),

    -- D3: Market Risk
    ('D3_C1_S1', 'D3_C1', 'Off-taker Credit', 'Creditworthiness rating', 'OPTION_SINGLE', 0.60),
    ('D3_C1_S2', 'D3_C1', 'Offtake Contract', 'Contract terms quality', 'OPTION_SINGLE', 0.40),
    ('D3_C2_S1', 'D3_C2', 'Market Demand', 'Long-term demand outlook', 'OPTION_SINGLE', 0.50),
    ('D3_C2_S2', 'D3_C2', 'Demand Growth', 'Growth trajectory analysis', 'OPTION_SINGLE', 0.50),
    ('D3_C3_S1', 'D3_C3', 'Price Indexation', 'CPI/escalation clause', 'OPTION_SINGLE', 0.50),
    ('D3_C3_S2', 'D3_C3', 'Price Revision', 'Periodic review mechanism', 'OPTION_SINGLE', 0.50),
    ('D3_C4_S1', 'D3_C4', 'Commodity Exposure', 'Price risk magnitude', 'OPTION_SINGLE', 0.50),
    ('D3_C4_S2', 'D3_C4', 'Hedging Strategy', 'Commodity hedging plan', 'OPTION_SINGLE', 0.50),

    -- D4: Environmental & Social Risk
    ('D4_C1_S1', 'D4_C1', 'Environmental Impact', 'EIA compliance level', 'OPTION_SINGLE', 0.50),
    ('D4_C1_S2', 'D4_C1', 'Pollution Control', 'Mitigation measures', 'OPTION_SINGLE', 0.50),
    ('D4_C2_S1', 'D4_C2', 'Social Impact', 'Impact assessment quality', 'OPTION_SINGLE', 0.50),
    ('D4_C2_S2', 'D4_C2', 'Resettlement Plan', 'R&R implementation', 'OPTION_SINGLE', 0.50),
    ('D4_C3_S1', 'D4_C3', 'Community Relations', 'Engagement strategy', 'OPTION_SINGLE', 0.50),
    ('D4_C3_S2', 'D4_C3', 'Stakeholder Support', 'Consensus building', 'OPTION_SINGLE', 0.50),

    -- D5: Governance & Management Risk
    ('D5_C1_S1', 'D5_C1', 'Sponsor Financial', 'Balance sheet strength', 'OPTION_SINGLE', 0.50),
    ('D5_C1_S2', 'D5_C1', 'Sponsor Track Record', 'Project history', 'OPTION_SINGLE', 0.50),
    ('D5_C2_S1', 'D5_C2', 'Board Composition', 'Director experience', 'OPTION_SINGLE', 0.50),
    ('D5_C2_S2', 'D5_C2', 'Management Team', 'Key personnel strength', 'OPTION_SINGLE', 0.50),
    ('D5_C3_S1', 'D5_C3', 'Financial Controls', 'Accounting systems', 'OPTION_SINGLE', 0.50),
    ('D5_C3_S2', 'D5_C3', 'Reporting Quality', 'Disclosure completeness', 'OPTION_SINGLE', 0.50),

    -- D6: Legal & Regulatory Risk
    ('D6_C1_S1', 'D6_C1', 'SPV Structure', 'Legal entity design', 'OPTION_SINGLE', 0.50),
    ('D6_C1_S2', 'D6_C1', 'Shareholder Agreements', 'Governance documents', 'OPTION_SINGLE', 0.50),
    ('D6_C2_S1', 'D6_C2', 'Regulatory Stability', 'Policy consistency', 'OPTION_SINGLE', 0.50),
    ('D6_C2_S2', 'D6_C2', 'Regulatory Favorability', 'Incentive framework', 'OPTION_SINGLE', 0.50),
    ('D6_C3_S1', 'D6_C3', 'Environmental Permits', 'Permit status', 'OPTION_SINGLE', 0.50),
    ('D6_C3_S2', 'D6_C3', 'Operational Licenses', 'All licenses validity', 'OPTION_SINGLE', 0.50),

    -- D7: Country & Political Risk
    ('D7_C1_S1', 'D7_C1', 'Sovereign Rating', 'Country risk assessment', 'OPTION_SINGLE', 0.50),
    ('D7_C1_S2', 'D7_C1', 'Political Stability', 'Government stability index', 'OPTION_SINGLE', 0.50),
    ('D7_C2_S1', 'D7_C2', 'Currency Risk', 'FX exposure level', 'OPTION_SINGLE', 0.50),
    ('D7_C2_S2', 'D7_C2', 'Transfer Risk', 'Capital mobility constraints', 'OPTION_SINGLE', 0.50),
    ('D7_C3_S1', 'D7_C3', 'PRI Availability', 'Insurer availability', 'OPTION_SINGLE', 0.50),
    ('D7_C3_S2', 'D7_C3', 'PRI Coverage', 'Policy coverage scope', 'OPTION_SINGLE', 0.50),

    -- D8: Project Structure Risk
    ('D8_C1_S1', 'D8_C1', 'Financial Covenants', 'Covenant strength', 'OPTION_SINGLE', 0.50),
    ('D8_C1_S2', 'D8_C1', 'Covenant Monitoring', 'Monitoring frequency', 'OPTION_SINGLE', 0.50),
    ('D8_C2_S1', 'D8_C2', 'Force Majeure Definition', 'FM event scope', 'OPTION_SINGLE', 0.50),
    ('D8_C2_S2', 'D8_C2', 'Force Majeure Mitigation', 'Risk mitigation measures', 'OPTION_SINGLE', 0.50),

    -- D9: Financial Stress Test
    ('D9_C1_S1', 'D9_C1', 'P50 Stress Test', 'Base case stress (-20%)', 'NUMERIC_RANGE', 0.50),
    ('D9_C1_S2', 'D9_C1', 'P90 Stress Test', 'Downside stress (-30%)', 'NUMERIC_RANGE', 0.50),
    ('D9_C2_S1', 'D9_C2', 'Cost Overrun Impact', 'Cost increase resilience', 'NUMERIC_RANGE', 0.50),
    ('D9_C2_S2', 'D9_C2', 'Revenue Impact', 'Revenue decline resilience', 'NUMERIC_RANGE', 0.50)
) AS t(code, parent_code, label, description, answer_type, weight)
INSERT INTO "BP_PF_v7pp_scoring_nodes" (
  id, "versionId", "parentNodeId", "nodeType", code, label, description,
  "displayPath", depth, "orderIndex", "isActive", "isTerminal", "isScored",
  "isMandatory", "allowsChildren", weight, "weightMode", "aggregationMethod",
  "answerType", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  v2.id,
  vg.id,
  'SUB_CRITERION'::text,
  t.code,
  t.label,
  t.description,
  t.code,
  2,
  ROW_NUMBER() OVER (PARTITION BY t.parent_code ORDER BY t.code) - 1,
  true,
  false,
  true,
  false,
  false,
  t.weight,
  'RELATIVE',
  'FIRST',
  t.answer_type,
  NOW(),
  NOW()
FROM subcriteria_data t
JOIN v2_groups vg ON vg.code = t.parent_code
JOIN v2_version v2 ON 1=1
WHERE NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_nodes"
  WHERE code = t.code AND "nodeType" = 'SUB_CRITERION'
  AND "versionId" IN (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 2)
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'V2 Structure Complete!' as status, COUNT(*) as total_nodes,
       ARRAY_AGG(DISTINCT "nodeType") as node_types
FROM "BP_PF_v7pp_scoring_nodes"
WHERE "versionId" IN (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 2
);
