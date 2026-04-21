-- ============================================================================
-- PF Scoring V7+ — Seed complet de la base de données
-- ============================================================================
-- Ce script peuple la hiérarchie complète :
--   Level 0 (depth 0) : DOMAIN nodes — 9 domaines de risque
--   Level 1 (depth 1) : GROUP nodes — critères convertis en groupes
--   Level 2 (depth 2) : SUB_CRITERION nodes — sous-critères avec options/ranges
--
-- Utilisation : Exécuter dans Supabase SQL Editor
-- Sûr à exécuter plusieurs fois (IF NOT EXISTS / UPSERT)
-- Durée : ~15 secondes
-- ============================================================================

-- ============================================================================
-- ÉTAPE 0 : Créer le modèle de scoring v3 (si absent)
-- ============================================================================
WITH new_model AS (
  INSERT INTO "BP_PF_v7pp_scoring_models" (
    id, code, label, description, status, "isActive", "createdAt", "updatedAt"
  )
  SELECT
    gen_random_uuid(), 'PF_V7PP', 'Project Finance Scoring v7++',
    'Modèle de scoring IFC/EBRD/Basel conforme pour financement de projets',
    'ACTIVE', true, NOW(), NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM "BP_PF_v7pp_scoring_models" WHERE code = 'PF_V7PP'
  )
  RETURNING id
),
model_v3_version AS (
  INSERT INTO "BP_PF_v7pp_scoring_versions" (
    id, "modelId", "versionNumber", status, "isPublished",
    description, "publishedAt", "createdAt", "updatedAt"
  )
  SELECT
    gen_random_uuid(),
    (SELECT id FROM "BP_PF_v7pp_scoring_models" WHERE code = 'PF_V7PP'),
    3,
    'DRAFT',
    false,
    'Version 3 : Hiérarchie complète domaines → critères → sous-critères',
    NULL,
    NOW(),
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM "BP_PF_v7pp_scoring_versions"
    WHERE "versionNumber" = 3
    AND "modelId" IN (SELECT id FROM "BP_PF_v7pp_scoring_models" WHERE code = 'PF_V7PP')
  )
  RETURNING id as version_id
)

-- ============================================================================
-- ÉTAPE 1 : Insérer les 9 DOMAIN nodes (niveau 0)
-- ============================================================================
,
v3_version AS (
  SELECT id FROM "BP_PF_v7pp_scoring_versions"
  WHERE "versionNumber" = 3
  LIMIT 1
),
insert_domains AS (
  INSERT INTO "BP_PF_v7pp_scoring_nodes" (
    id, "versionId", "parentNodeId", "nodeType", code, label, "shortLabel",
    description, "displayPath", depth, "orderIndex", "isActive", "isTerminal",
    "isScored", "isMandatory", "allowsChildren", weight, "weightMode",
    "aggregationMethod", "createdAt", "updatedAt"
  )
  SELECT * FROM (
    VALUES
      ('D1', 'Risque Financier', 'FIN', 'Analyse des flux financiers, endettement, liquidité et couverture des risques financiers', 0, 0.112),
      ('D2', 'Risque Technique', 'TECH', 'Évaluation de la technologie, EPC/O&M, performances garanties et chaîne d\'approvisionnement', 1, 0.112),
      ('D3', 'Risque Marché', 'MKT', 'Crédibilité du demandeur d\'électricité, demande à long terme et exposition aux prix', 2, 0.112),
      ('D4', 'Risque Environnemental & Social', 'ENV', 'Conformité EIA, gestion des impacts sociaux, engagement communautaire', 3, 0.112),
      ('D5', 'Risque Gouvernance & Management', 'GOV', 'Force financière du sponsor, gouvernance, contrôles internes', 4, 0.112),
      ('D6', 'Risque Juridique & Réglementaire', 'LEG', 'Structure SPV, stabilité réglementaire, permis et licences', 5, 0.112),
      ('D7', 'Risque Pays & Politique', 'CTRY', 'Notation souveraine, stabilité politique, risques de change et transfert', 6, 0.112),
      ('D8', 'Risque Structure Projet', 'STRUCT', 'Clauses de covenant, définition de force majeure, dispositions d\'apurement', 7, 0.112),
      ('D9', 'Tests de Stress Financier', 'STRESS', 'Résilience aux scénarios défavorables P50/P90, augmentations de coûts/revenus', 8, 0.112)
  ) AS domains(code, label, "shortLabel", description, "orderIndex", weight)
  WHERE NOT EXISTS (
    SELECT 1 FROM "BP_PF_v7pp_scoring_nodes" check_n
    WHERE check_n."versionId" IN (SELECT id FROM v3_version)
    AND check_n.code = domains.code
    AND check_n."nodeType" = 'DOMAIN'
  )
  WITH (
    SELECT gen_random_uuid() as id,
           (SELECT id FROM v3_version) as version_id,
           NULL::text as parent_id,
           'DOMAIN'::text as node_type,
           domains.code,
           domains.label,
           domains."shortLabel",
           domains.description,
           domains.code as display_path,
           0 as depth,
           domains."orderIndex",
           true as is_active,
           false as is_terminal,
           false as is_scored,
           false as is_mandatory,
           true as allows_children,
           domains.weight,
           'RELATIVE'::text as weight_mode,
           'AVERAGE'::text as aggregation_method
  )
  RETURNING
    id, version_id, parent_id, node_type, code, label, "shortLabel",
    description, display_path, depth, "orderIndex", is_active, is_terminal,
    is_scored, is_mandatory, allows_children, weight, weight_mode, aggregation_method
)
SELECT 'Domaines créés' as status;

-- ============================================================================
-- ÉTAPE 2 : Insérer les 30 GROUP nodes (critères — niveau 1)
-- ============================================================================
-- Chaque domaine contient 3-4 critères
WITH v3_version AS (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1
),
v3_domains AS (
  SELECT id, code FROM "BP_PF_v7pp_scoring_nodes"
  WHERE "versionId" IN (SELECT id FROM v3_version) AND "nodeType" = 'DOMAIN'
),
criteria_data AS (
  VALUES
    -- D1 : Risque Financier
    ('D1_C1', 'D1', 'Endettement', 'Analyse du ratio d\'endettement et de la couverture des fonds propres'),
    ('D1_C2', 'D1', 'Couverture du Service de la Dette', 'Évaluation du DSCR (Debt Service Coverage Ratio)'),
    ('D1_C3', 'D1', 'Couverture des Intérêts', 'Analyse du ratio de couverture EBITDA/Intérêts'),
    ('D1_C4', 'D1', 'Réserves de Liquidité', 'Adéquation des réserves de remboursement et d\'exploitation'),
    ('D1_C5', 'D1', 'Gestion du Fonds de Roulement', 'Efficacité du cycle de conversion de trésorerie'),
    -- D2 : Risque Technique
    ('D2_C1', 'D2', 'Maturité Technologique', 'Évaluation du degré de maturité et des références du projet'),
    ('D2_C2', 'D2', 'Force Financière EPC', 'Solidité financière et expérience du constructeur'),
    ('D2_C3', 'D2', 'Capacité Opérationnelle', 'Qualifications et expérience de l\'opérateur'),
    ('D2_C4', 'D2', 'Performance Garantie', 'Garanties de performance et dispositions de test'),
    ('D2_C5', 'D2', 'Sourcing Équipements Critiques', 'Diversification et robustesse de la chaîne d\'approvisionnement'),
    -- D3 : Risque Marché
    ('D3_C1', 'D3', 'Crédit du Demandeur d\'Électricité', 'Qualité de crédit et termes du contrat d\'achat'),
    ('D3_C2', 'D3', 'Demande Long Terme', 'Perspectives de demande et trajectoires de croissance'),
    ('D3_C3', 'D3', 'Indexation des Prix', 'Clauses d\'escalade CPI et mécanismes de révision'),
    ('D3_C4', 'D3', 'Exposition aux Matières Premières', 'Magnitude du risque prix et couverture'),
    -- D4 : Risque Environnemental & Social
    ('D4_C1', 'D4', 'Impact Environnemental', 'Conformité EIA et mesures d\'atténuation'),
    ('D4_C2', 'D4', 'Impact Social', 'Qualité de l\'évaluation d\'impact et plan de réinstallation'),
    ('D4_C3', 'D4', 'Relations Communautaires', 'Stratégie d\'engagement et consensus'),
    -- D5 : Risque Gouvernance & Management
    ('D5_C1', 'D5', 'Force Financière Sponsor', 'Solidité de bilan et antécédents de projets'),
    ('D5_C2', 'D5', 'Composition de Gouvernance', 'Expérience des administrateurs et personnel clé'),
    ('D5_C3', 'D5', 'Contrôles Financiers', 'Systèmes comptables et qualité de reporting'),
    -- D6 : Risque Juridique & Réglementaire
    ('D6_C1', 'D6', 'Structure SPV', 'Conception de l\'entité juridique et documents de gouvernance'),
    ('D6_C2', 'D6', 'Stabilité Réglementaire', 'Cohérence des politiques et cadre incitatif'),
    ('D6_C3', 'D6', 'Permis & Licences', 'État des permis environnementaux et licences opérationnelles'),
    -- D7 : Risque Pays & Politique
    ('D7_C1', 'D7', 'Risque Souverain', 'Évaluation du risque pays et stabilité politique'),
    ('D7_C2', 'D7', 'Risque Devises & Transfert', 'Exposition aux fluctuations de change et contraintes de mobilité du capital'),
    ('D7_C3', 'D7', 'Assurance Risque Politique', 'Disponibilité et couverture PRI'),
    -- D8 : Risque Structure Projet
    ('D8_C1', 'D8', 'Covenants Financiers', 'Force et monitoring des covenants'),
    ('D8_C2', 'D8', 'Force Majeure & Risques', 'Scope et atténuation des événements de force majeure'),
    -- D9 : Tests de Stress
    ('D9_C1', 'D9', 'Résilience Cas Base', 'Stress tests P50 et P90'),
    ('D9_C2', 'D9', 'Résilience Surcoûts & Revenus', 'Résilience aux augmentations de coûts et baisses de revenus')
),
insert_groups AS (
  INSERT INTO "BP_PF_v7pp_scoring_nodes" (
    id, "versionId", "parentNodeId", "nodeType", code, label, description,
    "displayPath", depth, "orderIndex", "isActive", "isTerminal", "isScored",
    "isMandatory", "allowsChildren", weight, "weightMode", "aggregationMethod",
    "createdAt", "updatedAt"
  )
  SELECT
    gen_random_uuid(),
    (SELECT id FROM v3_version),
    vd.id,
    'GROUP'::text,
    c.code,
    c.label,
    c.description,
    c.code,
    1,
    ROW_NUMBER() OVER (PARTITION BY c.parent_code ORDER BY c.code) - 1,
    true,
    false,
    false,
    false,
    true,
    1.0 / COUNT(*) OVER (PARTITION BY c.parent_code),
    'RELATIVE'::text,
    'AVERAGE'::text,
    NOW(),
    NOW()
  FROM criteria_data c
  JOIN v3_domains vd ON vd.code = c.parent_code
  WHERE NOT EXISTS (
    SELECT 1 FROM "BP_PF_v7pp_scoring_nodes"
    WHERE code = c.code AND "nodeType" = 'GROUP'
    AND "versionId" IN (SELECT id FROM v3_version)
  )
)
SELECT 'Critères (GROUP nodes) créés' as status;

-- ============================================================================
-- ÉTAPE 3 : Insérer les ~68 SUB_CRITERION nodes (niveau 2)
-- ============================================================================
WITH v3_version AS (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1
),
v3_groups AS (
  SELECT id, code FROM "BP_PF_v7pp_scoring_nodes"
  WHERE "versionId" IN (SELECT id FROM v3_version) AND "nodeType" = 'GROUP'
),
subcriteria_data AS (
  VALUES
    -- D1: Financial Risk
    ('D1_C1_S1', 'D1_C1', 'Ratio Endettement/Capitaux Propres', 'Indicateur principal de levier financier', 'NUMERIC_RANGE', 0.50),
    ('D1_C1_S2', 'D1_C1', 'Analyse Couverture Capitaux Propres', 'Analyse couverte par les capitaux propres', 'OPTION_SINGLE', 0.50),
    ('D1_C2_S1', 'D1_C2', 'DSCR — Cas de Base (P50)', 'DSCR aux flux de trésorerie P50', 'NUMERIC_RANGE', 0.50),
    ('D1_C2_S2', 'D1_C2', 'DSCR — Minimum (P90)', 'Tolérance au stress DSCR', 'NUMERIC_RANGE', 0.50),
    ('D1_C3_S1', 'D1_C3', 'EBITDA/Intérêts (P50)', 'Couverture des intérêts cas mid-case', 'NUMERIC_RANGE', 0.50),
    ('D1_C3_S2', 'D1_C3', 'EBITDA/Intérêts (P90)', 'Couverture des intérêts downside', 'NUMERIC_RANGE', 0.50),
    ('D1_C4_S1', 'D1_C4', 'Réserve de Remboursement de la Dette', 'Adéquation de la réserve', 'OPTION_SINGLE', 0.50),
    ('D1_C4_S2', 'D1_C4', 'Fonds de Réserve d\'Exploitation', 'Couverture de la réserve d\'exploitation', 'OPTION_SINGLE', 0.50),
    ('D1_C5_S1', 'D1_C5', 'Cycle de Conversion de Trésorerie', 'Efficacité du fonds de roulement', 'NUMERIC_RANGE', 0.50),
    ('D1_C5_S2', 'D1_C5', 'Qualité de Gestion FDR', 'Gestion du flux de trésorerie', 'OPTION_SINGLE', 0.50),

    -- D2: Technical Risk
    ('D2_C1_S1', 'D2_C1', 'Technologie — Maturité', 'Technologie prouvée vs émergente', 'OPTION_SINGLE', 0.60),
    ('D2_C1_S2', 'D2_C1', 'Projets de Référence', 'Données historiques de track record', 'OPTION_SINGLE', 0.40),
    ('D2_C2_S1', 'D2_C2', 'Force Financière EPC', 'Bilan du constructeur', 'OPTION_SINGLE', 0.50),
    ('D2_C2_S2', 'D2_C2', 'Expérience EPC', 'Track record des projets', 'OPTION_SINGLE', 0.50),
    ('D2_C3_S1', 'D2_C3', 'Qualifications Opérateur', 'Capacité de gestion opérationnelle', 'OPTION_SINGLE', 0.50),
    ('D2_C3_S2', 'D2_C3', 'Expérience O&M', 'Track record opérationnel', 'OPTION_SINGLE', 0.50),
    ('D2_C4_S1', 'D2_C4', 'Garanties de Performance', 'Garanties du constructeur', 'OPTION_SINGLE', 0.50),
    ('D2_C4_S2', 'D2_C4', 'Provisions de Test', 'Qualité des tests d\'acceptation', 'OPTION_SINGLE', 0.50),
    ('D2_C5_S1', 'D2_C5', 'Équipement Critique', 'Sourcing des composants clés', 'OPTION_SINGLE', 0.50),
    ('D2_C5_S2', 'D2_C5', 'Risque Chaîne d\'Approvisionnement', 'Robustesse logistique', 'OPTION_SINGLE', 0.50),

    -- D3: Market Risk
    ('D3_C1_S1', 'D3_C1', 'Crédit du Demandeur', 'Rating de solvabilité', 'OPTION_SINGLE', 0.60),
    ('D3_C1_S2', 'D3_C1', 'Contrat d\'Achat', 'Qualité des termes du contrat', 'OPTION_SINGLE', 0.40),
    ('D3_C2_S1', 'D3_C2', 'Demande de Marché', 'Perspectives de demande long terme', 'OPTION_SINGLE', 0.50),
    ('D3_C2_S2', 'D3_C2', 'Croissance de Demande', 'Analyse de trajectoire de croissance', 'OPTION_SINGLE', 0.50),
    ('D3_C3_S1', 'D3_C3', 'Indexation CPI', 'Clause d\'escalade CPI', 'OPTION_SINGLE', 0.50),
    ('D3_C3_S2', 'D3_C3', 'Révision de Prix', 'Mécanisme de révision périodique', 'OPTION_SINGLE', 0.50),
    ('D3_C4_S1', 'D3_C4', 'Exposition Matières Premières', 'Magnitude du risque prix', 'OPTION_SINGLE', 0.50),
    ('D3_C4_S2', 'D3_C4', 'Stratégie de Couverture', 'Plan de couverture des matières', 'OPTION_SINGLE', 0.50),

    -- D4: Environmental & Social Risk
    ('D4_C1_S1', 'D4_C1', 'Impact Environnemental', 'Niveau de conformité EIA', 'OPTION_SINGLE', 0.50),
    ('D4_C1_S2', 'D4_C1', 'Contrôle de la Pollution', 'Mesures d\'atténuation', 'OPTION_SINGLE', 0.50),
    ('D4_C2_S1', 'D4_C2', 'Impact Social', 'Qualité de l\'évaluation d\'impact', 'OPTION_SINGLE', 0.50),
    ('D4_C2_S2', 'D4_C2', 'Plan de Réinstallation', 'Implémentation R&R', 'OPTION_SINGLE', 0.50),
    ('D4_C3_S1', 'D4_C3', 'Relations Communautaires', 'Stratégie d\'engagement', 'OPTION_SINGLE', 0.50),
    ('D4_C3_S2', 'D4_C3', 'Soutien des Parties Prenantes', 'Construction du consensus', 'OPTION_SINGLE', 0.50),

    -- D5: Governance & Management Risk
    ('D5_C1_S1', 'D5_C1', 'Force Financière Sponsor', 'Solidité du bilan', 'OPTION_SINGLE', 0.50),
    ('D5_C1_S2', 'D5_C1', 'Track Record Sponsor', 'Historique des projets', 'OPTION_SINGLE', 0.50),
    ('D5_C2_S1', 'D5_C2', 'Composition du Conseil', 'Expérience des administrateurs', 'OPTION_SINGLE', 0.50),
    ('D5_C2_S2', 'D5_C2', 'Équipe de Management', 'Force du personnel clé', 'OPTION_SINGLE', 0.50),
    ('D5_C3_S1', 'D5_C3', 'Contrôles Financiers', 'Systèmes comptables', 'OPTION_SINGLE', 0.50),
    ('D5_C3_S2', 'D5_C3', 'Qualité du Reporting', 'Exhaustivité de la divulgation', 'OPTION_SINGLE', 0.50),

    -- D6: Legal & Regulatory Risk
    ('D6_C1_S1', 'D6_C1', 'Structure SPV', 'Conception de l\'entité juridique', 'OPTION_SINGLE', 0.50),
    ('D6_C1_S2', 'D6_C1', 'Accords Actionnaires', 'Documents de gouvernance', 'OPTION_SINGLE', 0.50),
    ('D6_C2_S1', 'D6_C2', 'Stabilité Réglementaire', 'Cohérence des politiques', 'OPTION_SINGLE', 0.50),
    ('D6_C2_S2', 'D6_C2', 'Cadre Incitatif', 'Framework favorable', 'OPTION_SINGLE', 0.50),
    ('D6_C3_S1', 'D6_C3', 'Permis Environnementaux', 'État des permis', 'OPTION_SINGLE', 0.50),
    ('D6_C3_S2', 'D6_C3', 'Licences Opérationnelles', 'Validité de toutes les licences', 'OPTION_SINGLE', 0.50),

    -- D7: Country & Political Risk
    ('D7_C1_S1', 'D7_C1', 'Rating Souverain', 'Évaluation du risque pays', 'OPTION_SINGLE', 0.50),
    ('D7_C1_S2', 'D7_C1', 'Stabilité Politique', 'Index de stabilité gouvernementale', 'OPTION_SINGLE', 0.50),
    ('D7_C2_S1', 'D7_C2', 'Risque Devises', 'Niveau d\'exposition FX', 'OPTION_SINGLE', 0.50),
    ('D7_C2_S2', 'D7_C2', 'Risque de Transfert', 'Contraintes de mobilité du capital', 'OPTION_SINGLE', 0.50),
    ('D7_C3_S1', 'D7_C3', 'Disponibilité PRI', 'Disponibilité des assureurs', 'OPTION_SINGLE', 0.50),
    ('D7_C3_S2', 'D7_C3', 'Couverture PRI', 'Scope de la couverture de police', 'OPTION_SINGLE', 0.50),

    -- D8: Project Structure Risk
    ('D8_C1_S1', 'D8_C1', 'Covenants Financiers', 'Force des covenants', 'OPTION_SINGLE', 0.50),
    ('D8_C1_S2', 'D8_C1', 'Monitoring des Covenants', 'Fréquence de monitoring', 'OPTION_SINGLE', 0.50),
    ('D8_C2_S1', 'D8_C2', 'Définition Force Majeure', 'Scope des événements FM', 'OPTION_SINGLE', 0.50),
    ('D8_C2_S2', 'D8_C2', 'Atténuation Force Majeure', 'Mesures d\'atténuation des risques', 'OPTION_SINGLE', 0.50),

    -- D9: Financial Stress Test
    ('D9_C1_S1', 'D9_C1', 'Test Stress P50', 'Stress cas base (-20%)', 'NUMERIC_RANGE', 0.50),
    ('D9_C1_S2', 'D9_C1', 'Test Stress P90', 'Stress downside (-30%)', 'NUMERIC_RANGE', 0.50),
    ('D9_C2_S1', 'D9_C2', 'Impact Surcoûts', 'Résilience augmentation coûts', 'NUMERIC_RANGE', 0.50),
    ('D9_C2_S2', 'D9_C2', 'Impact Revenus', 'Résilience baisse revenus', 'NUMERIC_RANGE', 0.50)
),
insert_subcriteria AS (
  INSERT INTO "BP_PF_v7pp_scoring_nodes" (
    id, "versionId", "parentNodeId", "nodeType", code, label, description,
    "displayPath", depth, "orderIndex", "isActive", "isTerminal", "isScored",
    "isMandatory", "allowsChildren", weight, "weightMode", "aggregationMethod",
    "answerType", "createdAt", "updatedAt"
  )
  SELECT
    gen_random_uuid(),
    (SELECT id FROM v3_version),
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
    'RELATIVE'::text,
    'FIRST'::text,
    t.answer_type,
    NOW(),
    NOW()
  FROM subcriteria_data t
  JOIN v3_groups vg ON vg.code = t.parent_code
  WHERE NOT EXISTS (
    SELECT 1 FROM "BP_PF_v7pp_scoring_nodes"
    WHERE code = t.code AND "nodeType" = 'SUB_CRITERION'
    AND "versionId" IN (SELECT id FROM v3_version)
  )
)
SELECT 'Sous-critères (SUB_CRITERION nodes) créés' as status;

-- ============================================================================
-- ÉTAPE 4 : VÉRIFICATION FINALE
-- ============================================================================
SELECT
  'VÉRIFICATION DE LA STRUCTURE V3' as titre,
  COUNT(*) as total_nodes,
  ARRAY_AGG(DISTINCT "nodeType") as types_nodes
FROM "BP_PF_v7pp_scoring_nodes"
WHERE "versionId" IN (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3
);

SELECT
  'Détail par niveau' as detail,
  "nodeType" as type,
  depth,
  COUNT(*) as nombre
FROM "BP_PF_v7pp_scoring_nodes"
WHERE "versionId" IN (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3
)
GROUP BY "nodeType", depth
ORDER BY depth, "nodeType";

-- ============================================================================
-- FIN DU SEED
-- ============================================================================
