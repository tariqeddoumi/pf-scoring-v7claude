DO $$
DECLARE
  v_model_id TEXT;
  v_version_id TEXT;
  v_seed_user_id UUID;
  v_next_ver INTEGER;
BEGIN
  SELECT id INTO v_model_id FROM "BP_PF_v7pp_scoring_models" WHERE code = 'PF_V7PP';
  IF v_model_id IS NULL THEN RAISE EXCEPTION 'Model not found'; END IF;

  SELECT id INTO v_seed_user_id FROM "BP_PF_users" WHERE role = 'system_admin' LIMIT 1;
  IF v_seed_user_id IS NULL THEN RAISE EXCEPTION 'No admin user'; END IF;

  SELECT COALESCE(MAX("versionNumber"), 0) + 1 INTO v_next_ver
  FROM "BP_PF_v7pp_scoring_versions" WHERE "modelId" = v_model_id;

  -- Archive previous PUBLISHED
  UPDATE "BP_PF_v7pp_scoring_versions" SET status = 'ARCHIVED', "isPublished" = false, "updatedAt" = NOW()
  WHERE "modelId" = v_model_id AND status = 'PUBLISHED';

  v_version_id := gen_random_uuid()::TEXT;
  INSERT INTO "BP_PF_v7pp_scoring_versions" (id, "modelId", "versionNumber", label, status, "isPublished", "changeReason", "releaseNotes", "createdBy", "createdAt", "updatedAt")
  VALUES (v_version_id, v_model_id, v_next_ver, 'V' || v_next_ver || ' - V7++ Complete (Excel)', 'PUBLISHED', true, 'V7++ Integration', '9D/28SC/84SSC/336OPT', v_seed_user_id, NOW(), NOW());

  -- Insert DOMAINS (9)
  INSERT INTO "BP_PF_v7pp_scoring_nodes" (id, "versionId", "parentNodeId", "nodeType", code, label, depth, "orderIndex", "isActive", "isTerminal", "isScored", "isMandatory", "allowsChildren", weight, "weightMode", "aggregationMethod", "createdAt", "updatedAt") VALUES
    (gen_random_uuid()::TEXT, v_version_id, NULL, 'DOMAIN', 'D1', 'Sponsor & Shareholders', 0, 1, true, false, false, false, true, 10.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, NULL, 'DOMAIN', 'D2', 'Project Characteristics', 0, 2, true, false, false, false, true, 10.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, NULL, 'DOMAIN', 'D3', 'Construction Risk', 0, 3, true, false, false, false, true, 15.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, NULL, 'DOMAIN', 'D4', 'Market Risk', 0, 4, true, false, false, false, true, 10.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, NULL, 'DOMAIN', 'D5', 'Operational Risk', 0, 5, true, false, false, false, true, 10.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, NULL, 'DOMAIN', 'D6', 'Counterparty Risk', 0, 6, true, false, false, false, true, 10.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, NULL, 'DOMAIN', 'D7', 'Financial Structure & Cash Flow', 0, 7, true, false, false, false, true, 15.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, NULL, 'DOMAIN', 'D8', 'Legal & Documentation', 0, 8, true, false, false, false, true, 10.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, NULL, 'DOMAIN', 'D9', 'ESG & Climate Risk', 0, 9, true, false, false, false, true, 10.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW());

  -- Insert SUB-CRITERIA (28) - parent = DOMAIN matched by code
  INSERT INTO "BP_PF_v7pp_scoring_nodes" (id, "versionId", "parentNodeId", "nodeType", code, label, depth, "orderIndex", "isActive", "isTerminal", "isScored", "isMandatory", "allowsChildren", weight, "weightMode", "aggregationMethod", "createdAt", "updatedAt") VALUES
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D1' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D1_SC1', 'Sponsor Strength', 1, 1, true, false, false, false, true, 50.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D1' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D1_SC2', 'Shareholder Structure', 1, 2, true, false, false, false, true, 30.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D1' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D1_SC3', 'Governance', 1, 3, true, false, false, false, true, 20.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D2' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D2_SC1', 'Technical Complexity', 1, 1, true, false, false, false, true, 40.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D2' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D2_SC2', 'Location Risk', 1, 2, true, false, false, false, true, 30.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D2' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D2_SC3', 'Project Size & Structure', 1, 3, true, false, false, false, true, 30.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D3' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D3_SC1', 'EPC Completion Risk', 1, 1, true, false, false, false, true, 40.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D3' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D3_SC2', 'Interfaces Risk', 1, 2, true, false, false, false, true, 30.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D3' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D3_SC3', 'Insurance Coverage', 1, 3, true, false, false, false, true, 30.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D4' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D4_SC1', 'Demand Risk', 1, 1, true, false, false, false, true, 40.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D4' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D4_SC2', 'Price Risk', 1, 2, true, false, false, false, true, 30.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D4' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D4_SC3', 'Competition', 1, 3, true, false, false, false, true, 30.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D5' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D5_SC1', 'O&M Capability', 1, 1, true, false, false, false, true, 40.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D5' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D5_SC2', 'Operational Stability', 1, 2, true, false, false, false, true, 30.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D5' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D5_SC3', 'Cost Control', 1, 3, true, false, false, false, true, 30.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D6' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D6_SC1', 'Offtaker Risk', 1, 1, true, false, false, false, true, 40.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D6' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D6_SC2', 'Supplier Risk', 1, 2, true, false, false, false, true, 30.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D6' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D6_SC3', 'Financial Partners', 1, 3, true, false, false, false, true, 30.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D7' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D7_SC1', 'Financial Structure', 1, 1, true, false, false, false, true, 35.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D7' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D7_SC2', 'Cash Flow Predictability', 1, 2, true, false, false, false, true, 30.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D7' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D7_SC3', 'Debt Service Capacity', 1, 3, true, false, false, false, true, 35.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D8' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D8_SC1', 'Contractual Framework', 1, 1, true, false, false, false, true, 40.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D8' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D8_SC2', 'Security Package', 1, 2, true, false, false, false, true, 35.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D8' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D8_SC3', 'Legal Environment', 1, 3, true, false, false, false, true, 25.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D9' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D9_SC1', 'Environmental', 1, 1, true, false, false, false, true, 30.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D9' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D9_SC2', 'Social', 1, 2, true, false, false, false, true, 20.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D9' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D9_SC3', 'Governance', 1, 3, true, false, false, false, true, 20.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW()),
    (gen_random_uuid()::TEXT, v_version_id, (SELECT id FROM "BP_PF_v7pp_scoring_nodes" WHERE "versionId" = v_version_id AND code = 'D9' AND "nodeType" = 'DOMAIN'), 'SUB_CRITERION', 'D9_SC4', 'Climate Risk', 1, 4, true, false, false, false, true, 30.0, 'RELATIVE', 'WEIGHTED_AVERAGE', NOW(), NOW());

  RAISE NOTICE 'Step 1 done. Version: %, ID: %', v_next_ver, v_version_id;
END $$;
