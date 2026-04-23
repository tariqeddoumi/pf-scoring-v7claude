-- ============================================================================
-- PF Scoring V3 — Seed des OPTIONS et RANGES
-- ============================================================================
-- Tables correctes (cf. Prisma @@map) :
--   ScoringNodeOption  →  "BP_PF_v7pp_scoring_options"
--   ScoringNodeRange   →  "BP_PF_v7pp_scoring_ranges"
--
-- Exécuter APRÈS SUPABASE_V3_COMPLETE_SEED.sql
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : OPTIONS pour les nœuds OPTION_SINGLE
-- ============================================================================
-- Échelle générale 5 niveaux (utilisée par défaut sur tous les sous-critères OPTION_SINGLE)
INSERT INTO "BP_PF_v7pp_scoring_options" (
  id, "nodeId", label, code, score, "orderIndex", "isActive", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  n.id,
  opt.label,
  opt.code,
  opt.score,
  opt.order_idx,
  true,
  NOW(),
  NOW()
FROM "BP_PF_v7pp_scoring_nodes" n
CROSS JOIN (VALUES
  ('Excellent — Performance Supérieure aux Attentes',  'EXCELLENT',  100, 0),
  ('Fort — Performance Au-Dessus des Attentes',        'STRONG',      85, 1),
  ('Moyen — Performance Conforme aux Attentes',        'MEDIUM',      65, 2),
  ('Faible — Performance En-Dessous des Attentes',     'WEAK',        45, 3),
  ('Très Faible — Performance Insuffisante',           'VERY_WEAK',   20, 4)
) AS opt(label, code, score, order_idx)
WHERE n."versionId" = (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1
)
AND n."nodeType" = 'SUB_CRITERION'
AND n."answerType" = 'OPTION_SINGLE'
AND NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_options" oe
  WHERE oe."nodeId" = n.id AND oe.code = opt.code
);

-- ============================================================================
-- ÉTAPE 2 : RANGES pour les nœuds NUMERIC_RANGE
-- ============================================================================

-- 2a — DSCR (codes D1_C2_S1 et D1_C2_S2)
INSERT INTO "BP_PF_v7pp_scoring_ranges" (
  id, "nodeId", "minValue", "maxValue", score, label, "isActive", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  n.id,
  r.min_val,
  r.max_val,
  r.score_val,
  r.label_text,
  true,
  NOW(),
  NOW()
FROM "BP_PF_v7pp_scoring_nodes" n
CROSS JOIN (VALUES
  (0.8::float,  1.0::float,  30::int, 'DSCR très faible (< 1.0)'),
  (1.0::float,  1.2::float,  50::int, 'DSCR faible (1.0 – 1.2)'),
  (1.2::float,  1.5::float,  70::int, 'DSCR moyen (1.2 – 1.5)'),
  (1.5::float,  2.0::float,  85::int, 'DSCR bon (1.5 – 2.0)'),
  (2.0::float, 99.0::float,  95::int, 'DSCR excellent (≥ 2.0)')
) AS r(min_val, max_val, score_val, label_text)
WHERE n."versionId" = (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1
)
AND n."nodeType" = 'SUB_CRITERION'
AND n."answerType" = 'NUMERIC_RANGE'
AND n.code IN ('D1_C2_S1', 'D1_C2_S2')
AND NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_ranges" re
  WHERE re."nodeId" = n.id AND re."minValue" = r.min_val AND re."maxValue" = r.max_val
);

-- 2b — Couverture des intérêts EBITDA/Intérêts (codes D1_C3_S1, D1_C3_S2)
INSERT INTO "BP_PF_v7pp_scoring_ranges" (
  id, "nodeId", "minValue", "maxValue", score, label, "isActive", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  n.id,
  r.min_val,
  r.max_val,
  r.score_val,
  r.label_text,
  true,
  NOW(),
  NOW()
FROM "BP_PF_v7pp_scoring_nodes" n
CROSS JOIN (VALUES
  (0.5::float, 1.0::float,  25::int, 'Couverture critique (< 1.0x)'),
  (1.0::float, 1.5::float,  50::int, 'Couverture faible (1.0 – 1.5x)'),
  (1.5::float, 2.5::float,  70::int, 'Couverture moyenne (1.5 – 2.5x)'),
  (2.5::float, 4.0::float,  85::int, 'Couverture bonne (2.5 – 4.0x)'),
  (4.0::float,99.0::float,  95::int, 'Couverture excellente (≥ 4.0x)')
) AS r(min_val, max_val, score_val, label_text)
WHERE n."versionId" = (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1
)
AND n."nodeType" = 'SUB_CRITERION'
AND n."answerType" = 'NUMERIC_RANGE'
AND n.code IN ('D1_C3_S1', 'D1_C3_S2')
AND NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_ranges" re
  WHERE re."nodeId" = n.id AND re."minValue" = r.min_val AND re."maxValue" = r.max_val
);

-- 2c — Ratio Endettement / Capitaux Propres (code D1_C1_S1)
INSERT INTO "BP_PF_v7pp_scoring_ranges" (
  id, "nodeId", "minValue", "maxValue", score, label, "isActive", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  n.id,
  r.min_val,
  r.max_val,
  r.score_val,
  r.label_text,
  true,
  NOW(),
  NOW()
FROM "BP_PF_v7pp_scoring_nodes" n
CROSS JOIN (VALUES
  (0.0::float, 0.5::float,  90::int, 'Très faible levier (< 0.5x)'),
  (0.5::float, 1.0::float,  80::int, 'Levier faible (0.5 – 1.0x)'),
  (1.0::float, 1.5::float,  65::int, 'Levier modéré (1.0 – 1.5x)'),
  (1.5::float, 2.5::float,  45::int, 'Levier élevé (1.5 – 2.5x)'),
  (2.5::float,99.0::float,  20::int, 'Levier très élevé (≥ 2.5x)')
) AS r(min_val, max_val, score_val, label_text)
WHERE n."versionId" = (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1
)
AND n."nodeType" = 'SUB_CRITERION'
AND n."answerType" = 'NUMERIC_RANGE'
AND n.code = 'D1_C1_S1'
AND NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_ranges" re
  WHERE re."nodeId" = n.id AND re."minValue" = r.min_val AND re."maxValue" = r.max_val
);

-- 2d — Trésorerie / Cycle de conversion (code D1_C5_S1)
INSERT INTO "BP_PF_v7pp_scoring_ranges" (
  id, "nodeId", "minValue", "maxValue", score, label, "isActive", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  n.id,
  r.min_val,
  r.max_val,
  r.score_val,
  r.label_text,
  true,
  NOW(),
  NOW()
FROM "BP_PF_v7pp_scoring_nodes" n
CROSS JOIN (VALUES
  (-30.0::float,  0.0::float,  85::int, 'Flux positif (client paie avant livraison)'),
  (  0.0::float, 30.0::float,  70::int, 'Excellente conversion (0 – 30 j)'),
  ( 30.0::float, 60.0::float,  60::int, 'Bonne conversion (30 – 60 j)'),
  ( 60.0::float, 90.0::float,  50::int, 'Conversion acceptable (60 – 90 j)'),
  ( 90.0::float,200.0::float,  30::int, 'Conversion lente (90 – 200 j)'),
  (200.0::float,999.0::float,  15::int, 'Conversion très lente (> 200 j)')
) AS r(min_val, max_val, score_val, label_text)
WHERE n."versionId" = (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1
)
AND n."nodeType" = 'SUB_CRITERION'
AND n."answerType" = 'NUMERIC_RANGE'
AND n.code = 'D1_C5_S1'
AND NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_ranges" re
  WHERE re."nodeId" = n.id AND re."minValue" = r.min_val AND re."maxValue" = r.max_val
);

-- 2e — Stress tests (tous les sous-critères NUMERIC_RANGE du domaine D9)
INSERT INTO "BP_PF_v7pp_scoring_ranges" (
  id, "nodeId", "minValue", "maxValue", score, label, "isActive", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  n.id,
  r.min_val,
  r.max_val,
  r.score_val,
  r.label_text,
  true,
  NOW(),
  NOW()
FROM "BP_PF_v7pp_scoring_nodes" n
CROSS JOIN (VALUES
  ( 0.0::float, 10.0::float,  95::int, 'Très résilient (choc ≤ 10 %)'),
  (10.0::float, 20.0::float,  85::int, 'Résilient (choc 10 – 20 %)'),
  (20.0::float, 30.0::float,  70::int, 'Acceptable (choc 20 – 30 %)'),
  (30.0::float, 40.0::float,  50::int, 'Vulnérable (choc 30 – 40 %)'),
  (40.0::float,100.0::float,  25::int, 'Très vulnérable (choc > 40 %)')
) AS r(min_val, max_val, score_val, label_text)
WHERE n."versionId" = (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1
)
AND n."nodeType" = 'SUB_CRITERION'
AND n."answerType" = 'NUMERIC_RANGE'
AND n.code LIKE 'D9_%'
AND NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_ranges" re
  WHERE re."nodeId" = n.id AND re."minValue" = r.min_val AND re."maxValue" = r.max_val
);

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================
SELECT
  'OPTIONS' AS type,
  COUNT(*) AS total
FROM "BP_PF_v7pp_scoring_options" o
JOIN "BP_PF_v7pp_scoring_nodes" n ON n.id = o."nodeId"
WHERE n."versionId" = (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1
)

UNION ALL

SELECT
  'RANGES' AS type,
  COUNT(*) AS total
FROM "BP_PF_v7pp_scoring_ranges" r
JOIN "BP_PF_v7pp_scoring_nodes" n ON n.id = r."nodeId"
WHERE n."versionId" = (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1
);

-- ============================================================================
-- FIN
-- ============================================================================
