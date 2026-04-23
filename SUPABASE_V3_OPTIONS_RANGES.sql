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
-- ÉTAPE 1 : OPTIONS pour tous les nœuds OPTION_SINGLE
-- Utilise l'échelle générale 5 niveaux
-- ============================================================================
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
-- ÉTAPE 2 : RANGES pour tous les nœuds NUMERIC_RANGE
-- Utilise des plages génériques réutilisables
-- ============================================================================
INSERT INTO "BP_PF_v7pp_scoring_ranges" (
  id, "nodeId", "minValue", "maxValue", score, label, "orderIndex", "isActive", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  n.id,
  r.min_val,
  r.max_val,
  r.score_val,
  r.label_text,
  r.order_idx,
  true,
  NOW(),
  NOW()
FROM "BP_PF_v7pp_scoring_nodes" n
CROSS JOIN (VALUES
  (0.0::float,  0.5::float,  20::int, 'Très Faible (0 – 0.5)',   0::int),
  (0.5::float,  1.0::float,  45::int, 'Faible (0.5 – 1.0)',      1::int),
  (1.0::float,  1.5::float,  65::int, 'Moyen (1.0 – 1.5)',       2::int),
  (1.5::float,  2.5::float,  85::int, 'Fort (1.5 – 2.5)',        3::int),
  (2.5::float, 99.0::float,  95::int, 'Excellent (≥ 2.5)',       4::int)
) AS r(min_val, max_val, score_val, label_text, order_idx)
WHERE n."versionId" = (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1
)
AND n."nodeType" = 'SUB_CRITERION'
AND n."answerType" = 'NUMERIC_RANGE'
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
