-- ============================================================================
-- PF Scoring V3 — Seed des OPTIONS et RANGES
-- ============================================================================
-- Tables correctes (cf. Prisma @@map) :
--   ScoringNodeOption  →  "BP_PF_v7pp_scoring_options"
--   ScoringNodeRange   →  "BP_PF_v7pp_scoring_ranges"
--
-- Résultat attendu :
--   OPTIONS = 250  (50 sous-critères OPTION_SINGLE × 5 niveaux)
--   RANGES  =  50  (10 sous-critères NUMERIC_RANGE × 5 plages)
--
-- Exécuter APRÈS SUPABASE_V3_COMPLETE_SEED.sql
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : OPTIONS — échelle 5 niveaux pour tous les nœuds OPTION_SINGLE
-- ============================================================================
INSERT INTO "BP_PF_v7pp_scoring_options" (
  id, "nodeId", label, code, score, "orderIndex", "isActive", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  n.id,
  opt.label,
  opt.code,
  opt.score::float,
  opt.order_idx,
  true,
  NOW(),
  NOW()
FROM "BP_PF_v7pp_scoring_nodes" n
CROSS JOIN (VALUES
  ('Excellent — Performance Supérieure aux Attentes', 'EXCELLENT', 100, 0),
  ('Fort — Performance Au-Dessus des Attentes',       'STRONG',     85, 1),
  ('Moyen — Performance Conforme aux Attentes',       'MEDIUM',     65, 2),
  ('Faible — Performance En-Dessous des Attentes',    'WEAK',       45, 3),
  ('Très Faible — Performance Insuffisante',          'VERY_WEAK',  20, 4)
) AS opt(label, code, score, order_idx)
WHERE n."versionId" = (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1)
  AND n."nodeType" = 'SUB_CRITERION'
  AND n."answerType" = 'OPTION_SINGLE'
  AND NOT EXISTS (
    SELECT 1 FROM "BP_PF_v7pp_scoring_options" oe
    WHERE oe."nodeId" = n.id AND oe.code = opt.code
  );

-- ============================================================================
-- ÉTAPE 2 : RANGES — 5 plages pour tous les nœuds NUMERIC_RANGE
-- ============================================================================
INSERT INTO "BP_PF_v7pp_scoring_ranges" (
  id, "nodeId", "minValue", "maxValue", score, label, "orderIndex", "isActive", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  n.id,
  r.min_val::float,
  r.max_val::float,
  r.score_val::float,
  r.label_text,
  r.order_idx,
  true,
  NOW(),
  NOW()
FROM "BP_PF_v7pp_scoring_nodes" n
CROSS JOIN (VALUES
  (0.0, 0.5,  20, 'Très Faible (0 – 0.5)',  0),
  (0.5, 1.0,  45, 'Faible (0.5 – 1.0)',     1),
  (1.0, 1.5,  65, 'Moyen (1.0 – 1.5)',      2),
  (1.5, 2.5,  85, 'Fort (1.5 – 2.5)',       3),
  (2.5, 99.0, 95, 'Excellent (≥ 2.5)',      4)
) AS r(min_val, max_val, score_val, label_text, order_idx)
WHERE n."versionId" = (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1)
  AND n."nodeType" = 'SUB_CRITERION'
  AND n."answerType" = 'NUMERIC_RANGE'
  AND NOT EXISTS (
    SELECT 1 FROM "BP_PF_v7pp_scoring_ranges" re
    WHERE re."nodeId" = n.id AND re."minValue" = r.min_val AND re."maxValue" = r.max_val
  );

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================
SELECT type, COUNT(*) AS total FROM (
  SELECT 'OPTIONS' AS type FROM "BP_PF_v7pp_scoring_options" o
  JOIN "BP_PF_v7pp_scoring_nodes" n ON n.id = o."nodeId"
  WHERE n."versionId" = (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1)
  UNION ALL
  SELECT 'RANGES' AS type FROM "BP_PF_v7pp_scoring_ranges" r
  JOIN "BP_PF_v7pp_scoring_nodes" n ON n.id = r."nodeId"
  WHERE n."versionId" = (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1)
) t GROUP BY type;

-- ============================================================================
-- FIN — Résultat attendu : OPTIONS = 250, RANGES = 50
-- ============================================================================
