-- ============================================================================
-- PF_V7PP Scoring Model - Direct Supabase SQL Insert
-- ============================================================================
-- Execute this entire script in Supabase SQL Editor
-- Safe to run multiple times (uses UPSERT)
-- Time: ~5 seconds
-- ============================================================================

-- STEP 1: Create the ScoringModel
INSERT INTO "BP_PF_v7pp_scoring_models" (
  id, code, label, description, "businessSegment", "projectType",
  status, "isActive", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'PF_V7PP',
  'PF V7++ - Project Finance Standard Model',
  'Comprehensive scoring model for project finance evaluations with 9 domains',
  'Project Finance',
  'Standard',
  'PUBLISHED',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (code) DO UPDATE SET
  label = 'PF V7++ - Project Finance Standard Model',
  status = 'PUBLISHED',
  "updatedAt" = NOW();

-- STEP 2: Get the model ID and create version
WITH model_data AS (
  SELECT id FROM "BP_PF_v7pp_scoring_models" WHERE code = 'PF_V7PP'
),
user_data AS (
  SELECT id FROM "BP_PF_users" ORDER BY "createdAt" ASC LIMIT 1
)
INSERT INTO "BP_PF_v7pp_scoring_versions" (
  id, "modelId", "versionNumber", label, status, "isPublished",
  "changeReason", "releaseNotes", "createdBy", "validatedBy", "publishedBy",
  "createdAt", "validatedAt", "publishedAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  m.id,
  1,
  'V1 - Initial Release',
  'PUBLISHED',
  true,
  'Initial scoring model for PF evaluations',
  'Standard model with 9 domains and hierarchical criteria',
  u.id,
  u.id,
  u.id,
  NOW(),
  NOW(),
  NOW(),
  NOW()
FROM model_data m, user_data u
WHERE NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_versions" v
  WHERE v."modelId" = m.id AND v."versionNumber" = 1
);

-- STEP 3: Insert DOMAIN nodes (9 domains)
WITH version_data AS (
  SELECT v.id FROM "BP_PF_v7pp_scoring_versions" v
  JOIN "BP_PF_v7pp_scoring_models" m ON v."modelId" = m.id
  WHERE m.code = 'PF_V7PP' AND v."isPublished" = true LIMIT 1
)
INSERT INTO "BP_PF_v7pp_scoring_nodes" (
  id, "versionId", "parentNodeId", "nodeType", code, label, "shortLabel",
  description, "displayPath", depth, "orderIndex", "isActive", "isTerminal",
  "isScored", "isMandatory", "allowsChildren", weight, "weightMode",
  "aggregationMethod", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  v.id,
  NULL,
  'DOMAIN'::text,
  d.code,
  d.label,
  d.short_label,
  d.description,
  d.code,
  0,
  d.order_index,
  true, false, false, true, true,
  d.weight,
  'RELATIVE',
  'AVERAGE',
  NOW(),
  NOW()
FROM (
  VALUES
    ('D1', 'Financial Risk', 'Financier', 'Assessment of financial structure and leverage', 0.15, 0),
    ('D2', 'Technical Risk', 'Technique', 'Technical feasibility and operational capability', 0.15, 1),
    ('D3', 'Market Risk', 'Marché', 'Market demand and competitive positioning', 0.12, 2),
    ('D4', 'Environmental & Social Risk', 'E&S', 'Environmental and social compliance', 0.12, 3),
    ('D5', 'Governance & Management Risk', 'Gouvernance', 'Management strength and governance quality', 0.12, 4),
    ('D6', 'Legal & Regulatory Risk', 'Juridique', 'Legal structure and regulatory compliance', 0.10, 5),
    ('D7', 'Country & Political Risk', 'Pays', 'Country risk and political stability', 0.12, 6),
    ('D8', 'Project Structure Risk', 'Structure', 'SPV structure and contractual arrangements', 0.06, 7),
    ('D9', 'Financial Stress Test', 'Stress', 'Resilience under financial stress scenarios', 0.06, 8)
) AS d(code, label, short_label, description, weight, order_index),
version_data v
WHERE NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_nodes"
  WHERE "versionId" = v.id AND code = d.code AND "nodeType" = 'DOMAIN'
);

-- STEP 4: Insert CRITERION nodes (28 criteria) with parent domain relationships
WITH domains AS (
  SELECT id, code FROM "BP_PF_v7pp_scoring_nodes"
  WHERE "nodeType" = 'DOMAIN' AND code IN ('D1','D2','D3','D4','D5','D6','D7','D8','D9')
),
version_data AS (
  SELECT id FROM "BP_PF_v7pp_scoring_versions"
  WHERE "isPublished" = true ORDER BY "createdAt" DESC LIMIT 1
)
INSERT INTO "BP_PF_v7pp_scoring_nodes" (
  id, "versionId", "parentNodeId", "nodeType", code, label, description,
  "displayPath", depth, "orderIndex", "isActive", "isTerminal", "isScored",
  "isMandatory", "allowsChildren", weight, "weightMode", "aggregationMethod",
  "answerType", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  v.id,
  d.id,
  'CRITERION'::text,
  c.code,
  c.label,
  c.description,
  c.code,
  1,
  c.order_index,
  true, false, true, false, false,
  c.weight,
  'RELATIVE',
  'FIRST',
  c.answer_type,
  NOW(),
  NOW()
FROM (
  VALUES
    ('D1_C1', 'D1', 'Leverage Ratio', 'Debt to equity analysis', 'NUMERIC_RANGE', 0.25, 0),
    ('D1_C2', 'D1', 'Debt Service Coverage Ratio (DSCR)', 'Ability to service debt from cash flow', 'NUMERIC_RANGE', 0.25, 1),
    ('D1_C3', 'D1', 'Interest Coverage Ratio', 'EBITDA/Interest expense', 'NUMERIC_RANGE', 0.2, 2),
    ('D1_C4', 'D1', 'Reserve Adequacy', 'Maintenance and debt service reserves', 'OPTION_SINGLE', 0.15, 3),
    ('D1_C5', 'D1', 'Working Capital Management', 'Cash flow management and working capital efficiency', 'OPTION_SINGLE', 0.15, 4),
    ('D2_C1', 'D2', 'Technology Maturity', 'Proven vs. emerging technology assessment', 'OPTION_SINGLE', 0.3, 0),
    ('D2_C2', 'D2', 'EPC Contractor Quality', 'Track record and financial stability of EPC', 'OPTION_SINGLE', 0.25, 1),
    ('D2_C3', 'D2', 'O&M Contractor Capability', 'Operational and maintenance capability', 'OPTION_SINGLE', 0.2, 2),
    ('D2_C4', 'D2', 'Plant Performance & Guarantees', 'Performance guarantees and testing provisions', 'OPTION_SINGLE', 0.15, 3),
    ('D2_C5', 'D2', 'Supply Chain Risk', 'Key equipment supply and logistics', 'OPTION_SINGLE', 0.1, 4),
    ('D3_C1', 'D3', 'Offtake Agreements', 'Quality and creditworthiness of off-taker', 'OPTION_SINGLE', 0.35, 0),
    ('D3_C2', 'D3', 'Market Demand', 'Long-term demand sustainability', 'OPTION_SINGLE', 0.25, 1),
    ('D3_C3', 'D3', 'Pricing Mechanism', 'Price escalation and tariff review clauses', 'OPTION_SINGLE', 0.2, 2),
    ('D3_C4', 'D3', 'Commodity Price Risk', 'Exposure to commodity price fluctuations', 'OPTION_SINGLE', 0.2, 3),
    ('D4_C1', 'D4', 'Environmental Compliance', 'EIA, permit compliance, pollution control', 'OPTION_SINGLE', 0.4, 0),
    ('D4_C2', 'D4', 'Social Impact & Resettlement', 'Social impact assessment and resettlement plan', 'OPTION_SINGLE', 0.3, 1),
    ('D4_C3', 'D4', 'Stakeholder Management', 'Community relations and stakeholder engagement', 'OPTION_SINGLE', 0.3, 2),
    ('D5_C1', 'D5', 'Sponsor Strength', 'Financial strength and track record of sponsors', 'OPTION_SINGLE', 0.35, 0),
    ('D5_C2', 'D5', 'Board & Management', 'Board composition and management experience', 'OPTION_SINGLE', 0.35, 1),
    ('D5_C3', 'D5', 'Internal Controls', 'Financial controls and reporting systems', 'OPTION_SINGLE', 0.3, 2),
    ('D6_C1', 'D6', 'Legal Structure', 'SPV structure and shareholder agreements', 'OPTION_SINGLE', 0.4, 0),
    ('D6_C2', 'D6', 'Regulatory Framework', 'Stability and favorability of regulatory environment', 'OPTION_SINGLE', 0.35, 1),
    ('D6_C3', 'D6', 'Permits & Licenses', 'Completeness and validity of all permits', 'OPTION_SINGLE', 0.25, 2),
    ('D7_C1', 'D7', 'Sovereign Risk', 'Country credit rating and political stability', 'OPTION_SINGLE', 0.4, 0),
    ('D7_C2', 'D7', 'Currency & Transfer Risk', 'Foreign exchange exposure and convertibility', 'OPTION_SINGLE', 0.3, 1),
    ('D7_C3', 'D7', 'Political Risk Insurance', 'Availability and coverage of PRI', 'OPTION_SINGLE', 0.3, 2),
    ('D8_C1', 'D8', 'Financial Covenants', 'Loan covenants and compliance monitoring', 'OPTION_SINGLE', 0.5, 0),
    ('D8_C2', 'D8', 'Force Majeure Provisions', 'Adequate force majeure coverage and mitigation', 'OPTION_SINGLE', 0.5, 1),
    ('D9_C1', 'D9', 'Stress Scenario Testing', 'DSCR under stress scenarios (±20% cash flow)', 'NUMERIC_RANGE', 0.6, 0),
    ('D9_C2', 'D9', 'Scenario: Cost Overrun', 'Resilience to 10-15% cost overrun', 'NUMERIC_RANGE', 0.4, 1)
) AS c(code, domain_code, label, description, answer_type, weight, order_index)
JOIN domains d ON d.code = c.domain_code
CROSS JOIN version_data v
WHERE NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_nodes"
  WHERE "versionId" = v.id AND code = c.code AND "nodeType" = 'CRITERION'
);

-- STEP 5: Insert SCORING OPTIONS for OPTION_SINGLE criteria
WITH criteria AS (
  SELECT id, code FROM "BP_PF_v7pp_scoring_nodes"
  WHERE "nodeType" = 'CRITERION' AND "answerType" = 'OPTION_SINGLE'
)
INSERT INTO "BP_PF_v7pp_scoring_options" (
  id, "nodeId", code, label, value, score, "orderIndex", "isDefault", "isActive",
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  c.id,
  o.code,
  o.label,
  o.value,
  o.score,
  o.order_index,
  o.is_default,
  true,
  NOW(),
  NOW()
FROM (
  VALUES
    -- Standard options (Excellent, Good, Fair, Poor) - 4 options × 18 criteria = 72 options
    ('D1_C4', 'OPT_EXC', 'Excellent', 'excellent', 90, 0, FALSE),
    ('D1_C4', 'OPT_GOOD', 'Good', 'good', 75, 1, FALSE),
    ('D1_C4', 'OPT_FAIR', 'Fair', 'fair', 50, 2, FALSE),
    ('D1_C4', 'OPT_POOR', 'Poor', 'poor', 25, 3, FALSE),
    ('D1_C5', 'OPT_EXC', 'Excellent', 'excellent', 90, 0, FALSE),
    ('D1_C5', 'OPT_GOOD', 'Good', 'good', 75, 1, FALSE),
    ('D1_C5', 'OPT_FAIR', 'Fair', 'fair', 50, 2, FALSE),
    ('D1_C5', 'OPT_POOR', 'Poor', 'poor', 25, 3, FALSE),
    ('D2_C3', 'OPT_EXC', 'Excellent', 'excellent', 90, 0, FALSE),
    ('D2_C3', 'OPT_GOOD', 'Good', 'good', 75, 1, FALSE),
    ('D2_C3', 'OPT_FAIR', 'Fair', 'fair', 50, 2, FALSE),
    ('D2_C3', 'OPT_POOR', 'Poor', 'poor', 25, 3, FALSE),
    ('D2_C5', 'OPT_EXC', 'Excellent', 'excellent', 90, 0, FALSE),
    ('D2_C5', 'OPT_GOOD', 'Good', 'good', 75, 1, FALSE),
    ('D2_C5', 'OPT_FAIR', 'Fair', 'fair', 50, 2, FALSE),
    ('D2_C5', 'OPT_POOR', 'Poor', 'poor', 25, 3, FALSE),
    ('D4_C3', 'OPT_EXC', 'Excellent', 'excellent', 90, 0, FALSE),
    ('D4_C3', 'OPT_GOOD', 'Good', 'good', 75, 1, FALSE),
    ('D4_C3', 'OPT_FAIR', 'Fair', 'fair', 50, 2, FALSE),
    ('D4_C3', 'OPT_POOR', 'Poor', 'poor', 25, 3, FALSE),
    ('D5_C3', 'OPT_ROBUST', 'Robust', 'robust', 90, 0, FALSE),
    ('D5_C3', 'OPT_GOOD', 'Good', 'good', 75, 1, FALSE),
    ('D5_C3', 'OPT_ACCEPTABLE', 'Acceptable', 'acceptable', 50, 2, FALSE),
    ('D5_C3', 'OPT_WEAK', 'Weak', 'weak', 25, 3, FALSE),
    -- D2 Technology options
    ('D2_C1', 'OPT_PROVEN', 'Proven Technology', 'proven', 85, 0, FALSE),
    ('D2_C1', 'OPT_MATURE', 'Mature Technology', 'mature', 70, 1, FALSE),
    ('D2_C1', 'OPT_EMERGING', 'Emerging Technology', 'emerging', 45, 2, FALSE),
    ('D2_C1', 'OPT_NOVEL', 'Novel/Unproven', 'novel', 20, 3, FALSE),
    -- D2 EPC Contractor options
    ('D2_C2', 'OPT_TIER1', 'Tier 1 Contractor', 'tier1', 85, 0, FALSE),
    ('D2_C2', 'OPT_EXPERIENCED', 'Experienced', 'experienced', 70, 1, FALSE),
    ('D2_C2', 'OPT_LIMITED', 'Limited Track Record', 'limited', 45, 2, FALSE),
    ('D2_C2', 'OPT_UNPROVEN', 'Unproven', 'unproven', 20, 3, FALSE),
    -- D2 Plant Performance options
    ('D2_C4', 'OPT_STRONG', 'Strong Guarantees', 'strong', 85, 0, FALSE),
    ('D2_C4', 'OPT_ADEQUATE', 'Adequate', 'adequate', 70, 1, FALSE),
    ('D2_C4', 'OPT_LIMITED', 'Limited', 'limited', 45, 2, FALSE),
    ('D2_C4', 'OPT_WEAK', 'Weak', 'weak', 25, 3, FALSE),
    -- D3 Offtake options
    ('D3_C1', 'OPT_SOVEREIGN', 'Sovereign/AAA', 'sovereign', 90, 0, FALSE),
    ('D3_C1', 'OPT_STRONG', 'Strong (A-BBB)', 'strong', 75, 1, FALSE),
    ('D3_C1', 'OPT_MODERATE', 'Moderate (BB-B)', 'moderate', 50, 2, FALSE),
    ('D3_C1', 'OPT_WEAK', 'Weak (<B)', 'weak', 25, 3, FALSE),
    -- D3 Market Demand options
    ('D3_C2', 'OPT_STRONG', 'Strong & Growing', 'strong', 90, 0, FALSE),
    ('D3_C2', 'OPT_STABLE', 'Stable', 'stable', 75, 1, FALSE),
    ('D3_C2', 'OPT_FLAT', 'Flat', 'flat', 50, 2, FALSE),
    ('D3_C2', 'OPT_DECLINING', 'Declining', 'declining', 25, 3, FALSE),
    -- D3 Pricing options
    ('D3_C3', 'OPT_INDEXED', 'Indexed to CPI', 'indexed', 85, 0, FALSE),
    ('D3_C3', 'OPT_ESCALATED', 'Fixed Escalation', 'escalated', 70, 1, FALSE),
    ('D3_C3', 'OPT_FIXED', 'Fixed Price', 'fixed', 45, 2, FALSE),
    ('D3_C3', 'OPT_EXPOSED', 'Exposed to Market', 'exposed', 20, 3, FALSE),
    -- D3 Commodity options
    ('D3_C4', 'OPT_HEDGED', 'Fully Hedged', 'hedged', 90, 0, FALSE),
    ('D3_C4', 'OPT_PARTIAL', 'Partially Hedged', 'partial', 70, 1, FALSE),
    ('D3_C4', 'OPT_NONE', 'No Hedge', 'none', 40, 2, FALSE),
    ('D3_C4', 'OPT_EXPOSED', 'High Exposure', 'exposed', 20, 3, FALSE),
    -- D4 Environmental options
    ('D4_C1', 'OPT_BEST', 'Best Practice', 'best', 90, 0, FALSE),
    ('D4_C1', 'OPT_COMPLIANT', 'Compliant', 'compliant', 75, 1, FALSE),
    ('D4_C1', 'OPT_ACCEPTABLE', 'Acceptable', 'acceptable', 50, 2, FALSE),
    ('D4_C1', 'OPT_CONCERN', 'Areas of Concern', 'concern', 25, 3, FALSE),
    -- D4 Social Impact options
    ('D4_C2', 'OPT_MINIMAL', 'Minimal Impact', 'minimal', 90, 0, FALSE),
    ('D4_C2', 'OPT_LOW', 'Low Impact', 'low', 75, 1, FALSE),
    ('D4_C2', 'OPT_MODERATE', 'Moderate Impact', 'moderate', 50, 2, FALSE),
    ('D4_C2', 'OPT_HIGH', 'High Impact', 'high', 25, 3, FALSE),
    -- D5 Sponsor options
    ('D5_C1', 'OPT_STRONG', 'Very Strong', 'strong', 90, 0, FALSE),
    ('D5_C1', 'OPT_GOOD', 'Good', 'good', 75, 1, FALSE),
    ('D5_C1', 'OPT_MODERATE', 'Moderate', 'moderate', 50, 2, FALSE),
    ('D5_C1', 'OPT_WEAK', 'Weak', 'weak', 25, 3, FALSE),
    -- D5 Board options
    ('D5_C2', 'OPT_EXCELLENT', 'Excellent', 'excellent', 90, 0, FALSE),
    ('D5_C2', 'OPT_GOOD', 'Good', 'good', 75, 1, FALSE),
    ('D5_C2', 'OPT_ADEQUATE', 'Adequate', 'adequate', 50, 2, FALSE),
    ('D5_C2', 'OPT_LIMITED', 'Limited Experience', 'limited', 25, 3, FALSE),
    -- D6 Legal options
    ('D6_C1', 'OPT_SOUND', 'Sound & Tested', 'sound', 90, 0, FALSE),
    ('D6_C1', 'OPT_SOLID', 'Solid', 'solid', 75, 1, FALSE),
    ('D6_C1', 'OPT_ADEQUATE', 'Adequate', 'adequate', 50, 2, FALSE),
    ('D6_C1', 'OPT_WEAK', 'Weak Points', 'weak', 25, 3, FALSE),
    -- D6 Regulatory options
    ('D6_C2', 'OPT_STABLE', 'Stable & Favorable', 'stable', 90, 0, FALSE),
    ('D6_C2', 'OPT_FAVORABLE', 'Favorable', 'favorable', 75, 1, FALSE),
    ('D6_C2', 'OPT_NEUTRAL', 'Neutral', 'neutral', 50, 2, FALSE),
    ('D6_C2', 'OPT_UNCERTAIN', 'Uncertain/Unfavorable', 'uncertain', 25, 3, FALSE),
    -- D6 Permits options
    ('D6_C3', 'OPT_COMPLETE', 'Complete', 'complete', 90, 0, FALSE),
    ('D6_C3', 'OPT_MOSTLY', 'Mostly Complete', 'mostly', 75, 1, FALSE),
    ('D6_C3', 'OPT_PARTIAL', 'Partial', 'partial', 50, 2, FALSE),
    ('D6_C3', 'OPT_MISSING', 'Key Permits Missing', 'missing', 25, 3, FALSE),
    -- D7 Sovereign options
    ('D7_C1', 'OPT_STRONG', 'Strong (AAA-A)', 'strong', 90, 0, FALSE),
    ('D7_C1', 'OPT_MODERATE', 'Moderate (BBB)', 'moderate', 75, 1, FALSE),
    ('D7_C1', 'OPT_WEAK', 'Weak (BB-B)', 'weak', 50, 2, FALSE),
    ('D7_C1', 'OPT_HIGH_RISK', 'High Risk (<B)', 'high_risk', 25, 3, FALSE),
    -- D7 Currency options
    ('D7_C2', 'OPT_HEDGED', 'Fully Hedged', 'hedged', 90, 0, FALSE),
    ('D7_C2', 'OPT_PARTIAL', 'Partially Hedged', 'partial', 75, 1, FALSE),
    ('D7_C2', 'OPT_EXPOSED', 'Exposed', 'exposed', 45, 2, FALSE),
    ('D7_C2', 'OPT_HIGH', 'High Risk', 'high', 20, 3, FALSE),
    -- D7 PRI options
    ('D7_C3', 'OPT_AVAILABLE', 'Available', 'available', 90, 0, FALSE),
    ('D7_C3', 'OPT_PARTIAL', 'Partial Coverage', 'partial', 70, 1, FALSE),
    ('D7_C3', 'OPT_UNAVAILABLE', 'Unavailable', 'unavailable', 40, 2, FALSE),
    ('D7_C3', 'OPT_NA', 'Not Required', 'na', 85, 3, FALSE),
    -- D8 Covenants options
    ('D8_C1', 'OPT_STRONG', 'Strong & Clear', 'strong', 90, 0, FALSE),
    ('D8_C1', 'OPT_ADEQUATE', 'Adequate', 'adequate', 75, 1, FALSE),
    ('D8_C1', 'OPT_BASIC', 'Basic', 'basic', 50, 2, FALSE),
    ('D8_C1', 'OPT_WEAK', 'Weak/Vague', 'weak', 25, 3, FALSE),
    -- D8 Force Majeure options
    ('D8_C2', 'OPT_COMPREHENSIVE', 'Comprehensive', 'comprehensive', 90, 0, FALSE),
    ('D8_C2', 'OPT_ADEQUATE', 'Adequate', 'adequate', 75, 1, FALSE),
    ('D8_C2', 'OPT_BASIC', 'Basic', 'basic', 50, 2, FALSE),
    ('D8_C2', 'OPT_LIMITED', 'Limited', 'limited', 25, 3, FALSE)
) AS o(criterion_code, code, label, value, score, order_index, is_default)
JOIN criteria c ON c.code = o.criterion_code
WHERE NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_options"
  WHERE "nodeId" = c.id AND code = o.code
);

-- STEP 6: Insert NUMERIC RANGES for NUMERIC_RANGE criteria
WITH criteria AS (
  SELECT id, code FROM "BP_PF_v7pp_scoring_nodes"
  WHERE "nodeType" = 'CRITERION' AND "answerType" = 'NUMERIC_RANGE'
)
INSERT INTO "BP_PF_v7pp_scoring_ranges" (
  id, "nodeId", label, "minValue", "maxValue", "minIncluded", "maxIncluded",
  score, "orderIndex", "isActive", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  c.id,
  r.label,
  r.min_value,
  r.max_value,
  TRUE,
  TRUE,
  r.score,
  r.order_index,
  true,
  NOW(),
  NOW()
FROM (
  VALUES
    -- D1_C1: Leverage Ratio
    ('D1_C1', 'Very Low (<1.0)', 0, 1.0, 90, 0),
    ('D1_C1', 'Low (1.0-1.5)', 1.0, 1.5, 75, 1),
    ('D1_C1', 'Moderate (1.5-2.0)', 1.5, 2.0, 60, 2),
    ('D1_C1', 'High (2.0-2.5)', 2.0, 2.5, 40, 3),
    ('D1_C1', 'Very High (>2.5)', 2.5, 999, 20, 4),
    -- D1_C2: DSCR
    ('D1_C2', 'Excellent (>1.5)', 1.5, 999, 90, 0),
    ('D1_C2', 'Good (1.3-1.5)', 1.3, 1.5, 75, 1),
    ('D1_C2', 'Fair (1.1-1.3)', 1.1, 1.3, 60, 2),
    ('D1_C2', 'Weak (0.9-1.1)', 0.9, 1.1, 40, 3),
    ('D1_C2', 'Poor (<0.9)', 0, 0.9, 20, 4),
    -- D1_C3: Interest Coverage
    ('D1_C3', 'Excellent (>3.0)', 3.0, 999, 90, 0),
    ('D1_C3', 'Good (2.0-3.0)', 2.0, 3.0, 75, 1),
    ('D1_C3', 'Fair (1.5-2.0)', 1.5, 2.0, 60, 2),
    ('D1_C3', 'Weak (1.0-1.5)', 1.0, 1.5, 40, 3),
    ('D1_C3', 'Poor (<1.0)', 0, 1.0, 20, 4),
    -- D9_C1: Stress Test
    ('D9_C1', 'Excellent (>1.5)', 1.5, 999, 90, 0),
    ('D9_C1', 'Good (1.3-1.5)', 1.3, 1.5, 75, 1),
    ('D9_C1', 'Fair (1.1-1.3)', 1.1, 1.3, 60, 2),
    ('D9_C1', 'Weak (0.9-1.1)', 0.9, 1.1, 40, 3),
    ('D9_C1', 'Poor (<0.9)', 0, 0.9, 20, 4),
    -- D9_C2: Cost Overrun
    ('D9_C2', 'Excellent (>1.5)', 1.5, 999, 90, 0),
    ('D9_C2', 'Good (1.3-1.5)', 1.3, 1.5, 75, 1),
    ('D9_C2', 'Fair (1.1-1.3)', 1.1, 1.3, 60, 2),
    ('D9_C2', 'Weak (0.9-1.1)', 0.9, 1.1, 40, 3),
    ('D9_C2', 'Poor (<0.9)', 0, 0.9, 20, 4)
) AS r(criterion_code, label, min_value, max_value, score, order_index)
JOIN criteria c ON c.code = r.criterion_code
WHERE NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_ranges"
  WHERE "nodeId" = c.id AND label = r.label
);

-- ============================================================================
-- VERIFICATION - Check the results
-- ============================================================================
SELECT 'Verification Results' AS status;
SELECT COUNT(*) as model_count FROM "BP_PF_v7pp_scoring_models" WHERE code='PF_V7PP';
SELECT COUNT(*) as version_count FROM "BP_PF_v7pp_scoring_versions" WHERE "isPublished"=true;
SELECT COUNT(*) as domain_count FROM "BP_PF_v7pp_scoring_nodes" WHERE "nodeType"='DOMAIN';
SELECT COUNT(*) as criteria_count FROM "BP_PF_v7pp_scoring_nodes" WHERE "nodeType"='CRITERION';
SELECT COUNT(*) as option_count FROM "BP_PF_v7pp_scoring_options";
SELECT COUNT(*) as range_count FROM "BP_PF_v7pp_scoring_ranges";

-- Expected results: 1, 1, 9, 28, 123, 30
