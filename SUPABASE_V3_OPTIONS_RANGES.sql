-- ============================================================================
-- PF Scoring V3 — Seed des OPTIONS et RANGES
-- ============================================================================
-- Ce script crée les options de notation (choix multiples) et les plages
-- numériques pour les sous-critères de la v3.
--
-- - OPTIONS : pour les questions de type OPTION_SINGLE
--   Exemple : "Contrat ferme" (80 pts), "Contrat provisoire" (50 pts)
--
-- - RANGES : pour les questions de type NUMERIC_RANGE
--   Exemple : DSCR >= 1.5 = 80 pts, 1.2 <= DSCR < 1.5 = 60 pts
--
-- Exécuter APRÈS SUPABASE_V3_COMPLETE_SEED.sql
-- Durée : ~20 secondes
-- ============================================================================

-- Récupérer la version V3
WITH v3_version AS (
  SELECT id FROM "BP_PF_v7pp_scoring_versions"
  WHERE "versionNumber" = 3
  LIMIT 1
),
v3_nodes AS (
  SELECT id, code, "answerType" FROM "BP_PF_v7pp_scoring_nodes"
  WHERE "versionId" IN (SELECT id FROM v3_version)
  AND "nodeType" = 'SUB_CRITERION'
),

-- ============================================================================
-- ÉTAPE 1 : Créer les OPTIONS pour les nodes OPTION_SINGLE
-- ============================================================================
options_to_insert AS (
  VALUES
    -- Credit/Contrats (échelle classique)
    ('Excellent — Crédit AAA / Contrat Long-Terme Ferme', 'EXCELLENT', 100, 0),
    ('Fort — Crédit AA / Contrat Ferme', 'STRONG', 85, 1),
    ('Moyen — Crédit A / Contrat Standard', 'MEDIUM', 65, 2),
    ('Faible — Crédit BBB / Contrat Conditionnel', 'WEAK', 45, 3),
    ('Très Faible — Crédit < BBB / Pas de Contrat', 'VERY_WEAK', 20, 4),

    -- Techno / Experience (5-point scale)
    ('Technologie Prouvée — > 100 MW Opérationnels', 'MATURE', 90, 0),
    ('Technologie Validée — 10-100 MW Opérationnels', 'VALIDATED', 75, 1),
    ('Technologie Démontrée — < 10 MW Opérationnels', 'DEMONSTRATED', 55, 2),
    ('Technologie Pré-Commerciale — Prototype Seulement', 'PRECOMMERCIAL', 30, 3),
    ('Technologie Conceptuelle — Simulation Seulement', 'CONCEPTUAL', 10, 4),

    -- Financier / Réserves (4-point)
    ('Couverture Complète — 24+ mois', 'FULL_24M', 95, 0),
    ('Couverture Bonne — 18-24 mois', 'GOOD_18_24M', 80, 1),
    ('Couverture Adéquate — 12-18 mois', 'ADEQUATE_12_18M', 60, 2),
    ('Couverture Insuffisante — < 12 mois', 'INSUFFICIENT', 35, 3),

    -- Politique / Pays (3-point)
    ('Environnement Politique Stable et Favorable', 'STABLE_FAVORABLE', 85, 0),
    ('Environnement Politique Stable et Neutre', 'STABLE_NEUTRAL', 60, 1),
    ('Environnement Politique Instable ou Défavorable', 'UNSTABLE_UNFAVORABLE', 25, 2),

    -- Gouvernance (5-point)
    ('Gouvernance Exemplaire — Board/Audit Forts', 'EXEMPLARY', 90, 0),
    ('Gouvernance Bonne — Board Compétent', 'GOOD', 75, 1),
    ('Gouvernance Adéquate — Board Standard', 'ADEQUATE', 55, 2),
    ('Gouvernance Faible — Board Limité', 'WEAK', 35, 3),
    ('Gouvernance Très Faible — Conflits Potentiels', 'VERY_WEAK', 15, 4)
),
insert_options AS (
  INSERT INTO "BP_PF_v7pp_scoring_node_option" (
    id, "nodeId", label, code, score, "orderIndex", "isActive", "createdAt", "updatedAt"
  )
  -- Assigner chaque option aux niveaux de notation OPTION_SINGLE
  -- Par défaut : les options génériques ci-dessus
  SELECT
    gen_random_uuid(),
    vn.id,
    opt.label,
    opt.code,
    opt.score,
    opt.order_idx,
    true,
    NOW(),
    NOW()
  FROM v3_nodes vn
  CROSS JOIN options_to_insert opt(label, code, score, order_idx)
  WHERE vn."answerType" = 'OPTION_SINGLE'
  -- Limiter aux options les plus communes (éviter des doublons excessifs)
  AND (
    -- Options spécifiques au contexte
    (vn.code LIKE 'D%_C1_S1' AND opt.code IN ('EXCELLENT', 'STRONG', 'MEDIUM', 'WEAK', 'VERY_WEAK'))
    OR (vn.code LIKE 'D%_C%_S%' AND opt.code IN ('EXCELLENT', 'STRONG', 'MEDIUM', 'WEAK', 'VERY_WEAK'))
  )
  AND NOT EXISTS (
    SELECT 1 FROM "BP_PF_v7pp_scoring_node_option" opt_check
    WHERE opt_check."nodeId" = vn.id AND opt_check.code = opt.code
  )
)

-- ============================================================================
-- ÉTAPE 2 : Créer les RANGES pour les nodes NUMERIC_RANGE
-- ============================================================================
,
ranges_to_insert AS (
  VALUES
    -- DSCR : 0.8 à 2.5+
    (0.8, 1.0, 30, 'DSCR très faible'),
    (1.0, 1.2, 50, 'DSCR faible'),
    (1.2, 1.5, 70, 'DSCR moyen'),
    (1.5, 2.0, 85, 'DSCR bon'),
    (2.0, 100.0, 95, 'DSCR excellent'),

    -- Ratios d'intérêts : EBITDA/Interest
    (0.5, 1.0, 25, 'Couverture critique'),
    (1.0, 1.5, 50, 'Couverture faible'),
    (1.5, 2.5, 70, 'Couverture moyenne'),
    (2.5, 4.0, 85, 'Couverture bonne'),
    (4.0, 100.0, 95, 'Couverture excellente'),

    -- Ratio Endettement/Capitaux Propres
    (0.0, 0.5, 90, 'Très faible levier'),
    (0.5, 1.0, 80, 'Levier faible'),
    (1.0, 1.5, 65, 'Levier modéré'),
    (1.5, 2.5, 45, 'Levier élevé'),
    (2.5, 100.0, 20, 'Levier très élevé'),

    -- Cycle de conversion de trésorerie (jours)
    (-30.0, 0.0, 85, 'Flux positif'),
    (0.0, 30.0, 70, 'Excellente conversion'),
    (30.0, 60.0, 60, 'Bonne conversion'),
    (60.0, 90.0, 50, 'Conversion acceptable'),
    (90.0, 200.0, 30, 'Conversion lente'),
    (200.0, 1000.0, 15, 'Conversion très lente'),

    -- Stress Tests (% de choc)
    (0.0, 10.0, 95, 'Très résilient'),
    (10.0, 20.0, 85, 'Résilient'),
    (20.0, 30.0, 70, 'Acceptable'),
    (30.0, 40.0, 50, 'Vulnérable'),
    (40.0, 100.0, 25, 'Très vulnérable')
),
insert_ranges AS (
  INSERT INTO "BP_PF_v7pp_scoring_node_range" (
    id, "nodeId", "minValue", "maxValue", score, label, "isActive", "createdAt", "updatedAt"
  )
  SELECT
    gen_random_uuid(),
    vn.id,
    r.min_val,
    r.max_val,
    r.score_val,
    r.label_text,
    true,
    NOW(),
    NOW()
  FROM v3_nodes vn
  CROSS JOIN ranges_to_insert r(min_val, max_val, score_val, label_text)
  WHERE vn."answerType" = 'NUMERIC_RANGE'
  -- Assigner les bonnes plages selon le type de nœud
  AND (
    (vn.code IN ('D1_C2_S1', 'D1_C2_S2') AND r.label_text LIKE 'DSCR%')
    OR (vn.code IN ('D1_C3_S1', 'D1_C3_S2') AND r.label_text LIKE 'Couverture%')
    OR (vn.code = 'D1_C1_S1' AND r.label_text LIKE 'levier%')
    OR (vn.code = 'D1_C5_S1' AND r.label_text LIKE 'Flux%' OR r.label_text LIKE 'conversion%')
    OR (vn.code LIKE 'D9_C%_S%' AND r.label_text LIKE '%résilient%')
    OR (vn.code LIKE 'D9_C%_S%' AND r.label_text LIKE '%choc%')
  )
  AND NOT EXISTS (
    SELECT 1 FROM "BP_PF_v7pp_scoring_node_range" rng_check
    WHERE rng_check."nodeId" = vn.id
    AND rng_check."minValue" = r.min_val
    AND rng_check."maxValue" = r.max_val
  )
)

-- ============================================================================
-- VERIFICATION FINALE
-- ============================================================================
SELECT 'OPTIONS créées' as step,
       COUNT(*) as count
FROM "BP_PF_v7pp_scoring_node_option"
WHERE "nodeId" IN (SELECT id FROM v3_nodes WHERE "answerType" = 'OPTION_SINGLE');

SELECT 'RANGES créées' as step,
       COUNT(*) as count
FROM "BP_PF_v7pp_scoring_node_range"
WHERE "nodeId" IN (SELECT id FROM v3_nodes WHERE "answerType" = 'NUMERIC_RANGE');

SELECT 'Résumé complet V3' as summary,
       (SELECT COUNT(*) FROM "BP_PF_v7pp_scoring_nodes"
        WHERE "versionId" IN (SELECT id FROM v3_version)) as total_nodes,
       (SELECT COUNT(*) FROM "BP_PF_v7pp_scoring_node_option"
        WHERE "nodeId" IN (SELECT id FROM v3_nodes)) as total_options,
       (SELECT COUNT(*) FROM "BP_PF_v7pp_scoring_node_range"
        WHERE "nodeId" IN (SELECT id FROM v3_nodes)) as total_ranges;

-- ============================================================================
-- FIN
-- ============================================================================
