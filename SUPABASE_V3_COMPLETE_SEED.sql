-- ============================================================================
-- PF Scoring V7+ — Seed complet (VERSION FINALE CORRIGÉE)
-- Exécuter dans Supabase SQL Editor
-- Sûr à relancer plusieurs fois (idempotent)
-- ============================================================================

-- ============================================================================
-- ÉTAPE 0a : Créer un utilisateur système si la table est vide
-- ============================================================================
INSERT INTO "BP_PF_users" (
  id, email, nom, prenom, role, "isActive", "createdAt", "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  'system@pf-scoring.local',
  'Système',
  'Admin',
  'admin',
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "BP_PF_users" LIMIT 1
);

-- ============================================================================
-- ÉTAPE 0b : Créer le modèle de scoring PF_V7PP
-- ============================================================================
INSERT INTO "BP_PF_v7pp_scoring_models" (
  id, code, label, description, status, "isActive", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  'PF_V7PP',
  'Project Finance Scoring v7++',
  'Modèle de scoring IFC/EBRD/Basel conforme pour financement de projets',
  'ACTIVE',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_models" WHERE code = 'PF_V7PP'
);

-- ============================================================================
-- ÉTAPE 0c : Créer la version 3
-- ============================================================================
INSERT INTO "BP_PF_v7pp_scoring_versions" (
  id, "modelId", "versionNumber", label, status, "isPublished",
  "changeReason", "createdBy", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM "BP_PF_v7pp_scoring_models" WHERE code = 'PF_V7PP'),
  3,
  'Version 3 Complète',
  'DRAFT',
  false,
  'Seed initial — hiérarchie complète domaines → critères → sous-critères',
  (SELECT id FROM "BP_PF_users" WHERE role = 'admin' ORDER BY "createdAt" LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_versions"
  WHERE "versionNumber" = 3
  AND "modelId" = (SELECT id FROM "BP_PF_v7pp_scoring_models" WHERE code = 'PF_V7PP')
);

-- ============================================================================
-- ÉTAPE 1 : Insérer les 9 DOMAIN nodes (depth = 0)
-- ============================================================================
INSERT INTO "BP_PF_v7pp_scoring_nodes" (
  id, "versionId", "parentNodeId", "nodeType",
  code, label, "shortLabel", description, "displayPath",
  depth, "orderIndex",
  "isActive", "isTerminal", "isScored", "isMandatory", "allowsChildren",
  weight, "weightMode", "aggregationMethod",
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1),
  NULL,
  'DOMAIN',
  d.code, d.label, d.short_label, d.description, d.code,
  0, d.order_idx,
  true, false, false, false, true,
  0.112, 'RELATIVE', 'AVERAGE',
  NOW(), NOW()
FROM (VALUES
  ('D1','Risque Financier','FIN',
   'Analyse des flux financiers, endettement, liquidité et couverture des risques financiers', 0),
  ('D2','Risque Technique','TECH',
   'Évaluation de la technologie, EPC/O&M, performances garanties et chaîne d''approvisionnement', 1),
  ('D3','Risque Marché','MKT',
   'Crédibilité du demandeur d''électricité, demande à long terme et exposition aux prix', 2),
  ('D4','Risque Environnemental & Social','ENV',
   'Conformité EIA, gestion des impacts sociaux, engagement communautaire', 3),
  ('D5','Risque Gouvernance & Management','GOV',
   'Force financière du sponsor, gouvernance, contrôles internes', 4),
  ('D6','Risque Juridique & Réglementaire','LEG',
   'Structure SPV, stabilité réglementaire, permis et licences', 5),
  ('D7','Risque Pays & Politique','CTRY',
   'Notation souveraine, stabilité politique, risques de change et transfert', 6),
  ('D8','Risque Structure Projet','STRUCT',
   'Clauses de covenant, définition de force majeure, dispositions d''apurement', 7),
  ('D9','Tests de Stress Financier','STRESS',
   'Résilience aux scénarios défavorables P50/P90, augmentations de coûts/revenus', 8)
) AS d(code, label, short_label, description, order_idx)
WHERE NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_nodes" n
  WHERE n."versionId" = (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1)
  AND n.code = d.code
  AND n."nodeType" = 'DOMAIN'
);

-- ============================================================================
-- ÉTAPE 2 : Insérer les 30 GROUP nodes (critères — depth = 1)
-- ============================================================================
INSERT INTO "BP_PF_v7pp_scoring_nodes" (
  id, "versionId", "parentNodeId", "nodeType",
  code, label, description, "displayPath",
  depth, "orderIndex",
  "isActive", "isTerminal", "isScored", "isMandatory", "allowsChildren",
  weight, "weightMode", "aggregationMethod",
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1),
  (SELECT id FROM "BP_PF_v7pp_scoring_nodes"
   WHERE "versionId" = (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1)
   AND code = c.parent_code AND "nodeType" = 'DOMAIN'),
  'GROUP',
  c.code, c.label, c.description, c.code,
  1, c.order_idx,
  true, false, false, false, true,
  c.weight, 'RELATIVE', 'AVERAGE',
  NOW(), NOW()
FROM (VALUES
  -- D1 : Risque Financier (5 critères)
  ('D1_C1','D1','Endettement',
   'Analyse du ratio d''endettement et de la couverture des fonds propres', 0, 0.20::float),
  ('D1_C2','D1','Couverture du Service de la Dette',
   'Évaluation du DSCR (Debt Service Coverage Ratio)', 1, 0.20::float),
  ('D1_C3','D1','Couverture des Intérêts',
   'Analyse du ratio de couverture EBITDA/Intérêts', 2, 0.20::float),
  ('D1_C4','D1','Réserves de Liquidité',
   'Adéquation des réserves de remboursement et d''exploitation', 3, 0.20::float),
  ('D1_C5','D1','Gestion du Fonds de Roulement',
   'Efficacité du cycle de conversion de trésorerie', 4, 0.20::float),
  -- D2 : Risque Technique (5 critères)
  ('D2_C1','D2','Maturité Technologique',
   'Évaluation du degré de maturité et des références du projet', 0, 0.20::float),
  ('D2_C2','D2','Force Financière EPC',
   'Solidité financière et expérience du constructeur', 1, 0.20::float),
  ('D2_C3','D2','Capacité Opérationnelle',
   'Qualifications et expérience de l''opérateur', 2, 0.20::float),
  ('D2_C4','D2','Performance Garantie',
   'Garanties de performance et dispositions de test', 3, 0.20::float),
  ('D2_C5','D2','Sourcing Équipements Critiques',
   'Diversification et robustesse de la chaîne d''approvisionnement', 4, 0.20::float),
  -- D3 : Risque Marché (4 critères)
  ('D3_C1','D3','Crédit du Demandeur d''Électricité',
   'Qualité de crédit et termes du contrat d''achat', 0, 0.25::float),
  ('D3_C2','D3','Demande Long Terme',
   'Perspectives de demande et trajectoires de croissance', 1, 0.25::float),
  ('D3_C3','D3','Indexation des Prix',
   'Clauses d''escalade CPI et mécanismes de révision', 2, 0.25::float),
  ('D3_C4','D3','Exposition aux Matières Premières',
   'Magnitude du risque prix et couverture', 3, 0.25::float),
  -- D4 : Risque Environnemental & Social (3 critères)
  ('D4_C1','D4','Impact Environnemental',
   'Conformité EIA et mesures d''atténuation', 0, 0.333::float),
  ('D4_C2','D4','Impact Social',
   'Qualité de l''évaluation d''impact et plan de réinstallation', 1, 0.333::float),
  ('D4_C3','D4','Relations Communautaires',
   'Stratégie d''engagement et consensus', 2, 0.334::float),
  -- D5 : Risque Gouvernance & Management (3 critères)
  ('D5_C1','D5','Force Financière Sponsor',
   'Solidité de bilan et antécédents de projets', 0, 0.333::float),
  ('D5_C2','D5','Composition de Gouvernance',
   'Expérience des administrateurs et personnel clé', 1, 0.333::float),
  ('D5_C3','D5','Contrôles Financiers',
   'Systèmes comptables et qualité de reporting', 2, 0.334::float),
  -- D6 : Risque Juridique & Réglementaire (3 critères)
  ('D6_C1','D6','Structure SPV',
   'Conception de l''entité juridique et documents de gouvernance', 0, 0.333::float),
  ('D6_C2','D6','Stabilité Réglementaire',
   'Cohérence des politiques et cadre incitatif', 1, 0.333::float),
  ('D6_C3','D6','Permis & Licences',
   'État des permis environnementaux et licences opérationnelles', 2, 0.334::float),
  -- D7 : Risque Pays & Politique (3 critères)
  ('D7_C1','D7','Risque Souverain',
   'Évaluation du risque pays et stabilité politique', 0, 0.333::float),
  ('D7_C2','D7','Risque Devises & Transfert',
   'Exposition aux fluctuations de change et contraintes de mobilité du capital', 1, 0.333::float),
  ('D7_C3','D7','Assurance Risque Politique',
   'Disponibilité et couverture PRI', 2, 0.334::float),
  -- D8 : Risque Structure Projet (2 critères)
  ('D8_C1','D8','Covenants Financiers',
   'Force et monitoring des covenants', 0, 0.50::float),
  ('D8_C2','D8','Force Majeure & Risques',
   'Scope et atténuation des événements de force majeure', 1, 0.50::float),
  -- D9 : Tests de Stress (2 critères)
  ('D9_C1','D9','Résilience Cas Base',
   'Stress tests P50 et P90', 0, 0.50::float),
  ('D9_C2','D9','Résilience Surcoûts & Revenus',
   'Résilience aux augmentations de coûts et baisses de revenus', 1, 0.50::float)
) AS c(code, parent_code, label, description, order_idx, weight)
WHERE NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_nodes" n
  WHERE n."versionId" = (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1)
  AND n.code = c.code AND n."nodeType" = 'GROUP'
);

-- ============================================================================
-- ÉTAPE 3 : Insérer les 60 SUB_CRITERION nodes (depth = 2)
-- ============================================================================
INSERT INTO "BP_PF_v7pp_scoring_nodes" (
  id, "versionId", "parentNodeId", "nodeType",
  code, label, description, "displayPath",
  depth, "orderIndex",
  "isActive", "isTerminal", "isScored", "isMandatory", "allowsChildren",
  weight, "weightMode", "aggregationMethod", "answerType",
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1),
  (SELECT id FROM "BP_PF_v7pp_scoring_nodes"
   WHERE "versionId" = (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1)
   AND code = s.parent_code AND "nodeType" = 'GROUP'),
  'SUB_CRITERION',
  s.code, s.label, s.description, s.code,
  2, s.order_idx,
  true, true, true, false, false,
  s.weight, 'RELATIVE', 'FIRST', s.answer_type,
  NOW(), NOW()
FROM (VALUES
  -- D1_C1 : Endettement
  ('D1_C1_S1','D1_C1','Ratio Endettement/Capitaux Propres',
   'Indicateur principal de levier financier','NUMERIC_RANGE',0,0.50::float),
  ('D1_C1_S2','D1_C1','Analyse Couverture Capitaux Propres',
   'Analyse couverte par les capitaux propres','OPTION_SINGLE',1,0.50::float),
  -- D1_C2 : DSCR
  ('D1_C2_S1','D1_C2','DSCR — Cas de Base (P50)',
   'DSCR aux flux de trésorerie P50','NUMERIC_RANGE',0,0.50::float),
  ('D1_C2_S2','D1_C2','DSCR — Minimum (P90)',
   'Tolérance au stress DSCR','NUMERIC_RANGE',1,0.50::float),
  -- D1_C3 : Couverture Intérêts
  ('D1_C3_S1','D1_C3','EBITDA/Intérêts (P50)',
   'Couverture des intérêts cas mid-case','NUMERIC_RANGE',0,0.50::float),
  ('D1_C3_S2','D1_C3','EBITDA/Intérêts (P90)',
   'Couverture des intérêts downside','NUMERIC_RANGE',1,0.50::float),
  -- D1_C4 : Réserves
  ('D1_C4_S1','D1_C4','Réserve de Remboursement de la Dette',
   'Adéquation de la réserve','OPTION_SINGLE',0,0.50::float),
  ('D1_C4_S2','D1_C4','Fonds de Réserve d''Exploitation',
   'Couverture de la réserve d''exploitation','OPTION_SINGLE',1,0.50::float),
  -- D1_C5 : FDR
  ('D1_C5_S1','D1_C5','Cycle de Conversion de Trésorerie',
   'Efficacité du fonds de roulement','NUMERIC_RANGE',0,0.50::float),
  ('D1_C5_S2','D1_C5','Qualité de Gestion FDR',
   'Gestion du flux de trésorerie','OPTION_SINGLE',1,0.50::float),
  -- D2_C1 : Maturité Tech
  ('D2_C1_S1','D2_C1','Technologie — Maturité',
   'Technologie prouvée vs émergente','OPTION_SINGLE',0,0.60::float),
  ('D2_C1_S2','D2_C1','Projets de Référence',
   'Données historiques de track record','OPTION_SINGLE',1,0.40::float),
  -- D2_C2 : EPC
  ('D2_C2_S1','D2_C2','Force Financière EPC',
   'Bilan du constructeur','OPTION_SINGLE',0,0.50::float),
  ('D2_C2_S2','D2_C2','Expérience EPC',
   'Track record des projets','OPTION_SINGLE',1,0.50::float),
  -- D2_C3 : Opérateur
  ('D2_C3_S1','D2_C3','Qualifications Opérateur',
   'Capacité de gestion opérationnelle','OPTION_SINGLE',0,0.50::float),
  ('D2_C3_S2','D2_C3','Expérience O&M',
   'Track record opérationnel','OPTION_SINGLE',1,0.50::float),
  -- D2_C4 : Performances
  ('D2_C4_S1','D2_C4','Garanties de Performance',
   'Garanties du constructeur','OPTION_SINGLE',0,0.50::float),
  ('D2_C4_S2','D2_C4','Provisions de Test',
   'Qualité des tests d''acceptation','OPTION_SINGLE',1,0.50::float),
  -- D2_C5 : Équipements
  ('D2_C5_S1','D2_C5','Équipement Critique',
   'Sourcing des composants clés','OPTION_SINGLE',0,0.50::float),
  ('D2_C5_S2','D2_C5','Risque Chaîne d''Approvisionnement',
   'Robustesse logistique','OPTION_SINGLE',1,0.50::float),
  -- D3_C1 : Crédit
  ('D3_C1_S1','D3_C1','Crédit du Demandeur',
   'Rating de solvabilité','OPTION_SINGLE',0,0.60::float),
  ('D3_C1_S2','D3_C1','Contrat d''Achat',
   'Qualité des termes du contrat','OPTION_SINGLE',1,0.40::float),
  -- D3_C2 : Demande
  ('D3_C2_S1','D3_C2','Demande de Marché',
   'Perspectives de demande long terme','OPTION_SINGLE',0,0.50::float),
  ('D3_C2_S2','D3_C2','Croissance de Demande',
   'Analyse de trajectoire de croissance','OPTION_SINGLE',1,0.50::float),
  -- D3_C3 : Prix
  ('D3_C3_S1','D3_C3','Indexation CPI',
   'Clause d''escalade CPI','OPTION_SINGLE',0,0.50::float),
  ('D3_C3_S2','D3_C3','Révision de Prix',
   'Mécanisme de révision périodique','OPTION_SINGLE',1,0.50::float),
  -- D3_C4 : Matières premières
  ('D3_C4_S1','D3_C4','Exposition Matières Premières',
   'Magnitude du risque prix','OPTION_SINGLE',0,0.50::float),
  ('D3_C4_S2','D3_C4','Stratégie de Couverture',
   'Plan de couverture des matières','OPTION_SINGLE',1,0.50::float),
  -- D4_C1 : Environnement
  ('D4_C1_S1','D4_C1','Conformité EIA',
   'Niveau de conformité EIA','OPTION_SINGLE',0,0.50::float),
  ('D4_C1_S2','D4_C1','Contrôle de la Pollution',
   'Mesures d''atténuation','OPTION_SINGLE',1,0.50::float),
  -- D4_C2 : Social
  ('D4_C2_S1','D4_C2','Impact Social',
   'Qualité de l''évaluation d''impact','OPTION_SINGLE',0,0.50::float),
  ('D4_C2_S2','D4_C2','Plan de Réinstallation',
   'Implémentation R&R','OPTION_SINGLE',1,0.50::float),
  -- D4_C3 : Communautaire
  ('D4_C3_S1','D4_C3','Relations Communautaires',
   'Stratégie d''engagement','OPTION_SINGLE',0,0.50::float),
  ('D4_C3_S2','D4_C3','Soutien des Parties Prenantes',
   'Construction du consensus','OPTION_SINGLE',1,0.50::float),
  -- D5_C1 : Sponsor
  ('D5_C1_S1','D5_C1','Force Financière Sponsor',
   'Solidité du bilan','OPTION_SINGLE',0,0.50::float),
  ('D5_C1_S2','D5_C1','Track Record Sponsor',
   'Historique des projets','OPTION_SINGLE',1,0.50::float),
  -- D5_C2 : Gouvernance
  ('D5_C2_S1','D5_C2','Composition du Conseil',
   'Expérience des administrateurs','OPTION_SINGLE',0,0.50::float),
  ('D5_C2_S2','D5_C2','Équipe de Management',
   'Force du personnel clé','OPTION_SINGLE',1,0.50::float),
  -- D5_C3 : Contrôles
  ('D5_C3_S1','D5_C3','Contrôles Financiers',
   'Systèmes comptables','OPTION_SINGLE',0,0.50::float),
  ('D5_C3_S2','D5_C3','Qualité du Reporting',
   'Exhaustivité de la divulgation','OPTION_SINGLE',1,0.50::float),
  -- D6_C1 : SPV
  ('D6_C1_S1','D6_C1','Structure SPV',
   'Conception de l''entité juridique','OPTION_SINGLE',0,0.50::float),
  ('D6_C1_S2','D6_C1','Accords Actionnaires',
   'Documents de gouvernance','OPTION_SINGLE',1,0.50::float),
  -- D6_C2 : Réglementaire
  ('D6_C2_S1','D6_C2','Stabilité Réglementaire',
   'Cohérence des politiques','OPTION_SINGLE',0,0.50::float),
  ('D6_C2_S2','D6_C2','Cadre Incitatif',
   'Framework favorable','OPTION_SINGLE',1,0.50::float),
  -- D6_C3 : Permis
  ('D6_C3_S1','D6_C3','Permis Environnementaux',
   'État des permis','OPTION_SINGLE',0,0.50::float),
  ('D6_C3_S2','D6_C3','Licences Opérationnelles',
   'Validité de toutes les licences','OPTION_SINGLE',1,0.50::float),
  -- D7_C1 : Souverain
  ('D7_C1_S1','D7_C1','Rating Souverain',
   'Évaluation du risque pays','OPTION_SINGLE',0,0.50::float),
  ('D7_C1_S2','D7_C1','Stabilité Politique',
   'Index de stabilité gouvernementale','OPTION_SINGLE',1,0.50::float),
  -- D7_C2 : Devises
  ('D7_C2_S1','D7_C2','Risque Devises',
   'Niveau d''exposition FX','OPTION_SINGLE',0,0.50::float),
  ('D7_C2_S2','D7_C2','Risque de Transfert',
   'Contraintes de mobilité du capital','OPTION_SINGLE',1,0.50::float),
  -- D7_C3 : PRI
  ('D7_C3_S1','D7_C3','Disponibilité PRI',
   'Disponibilité des assureurs','OPTION_SINGLE',0,0.50::float),
  ('D7_C3_S2','D7_C3','Couverture PRI',
   'Scope de la couverture de police','OPTION_SINGLE',1,0.50::float),
  -- D8_C1 : Covenants
  ('D8_C1_S1','D8_C1','Covenants Financiers',
   'Force des covenants','OPTION_SINGLE',0,0.50::float),
  ('D8_C1_S2','D8_C1','Monitoring des Covenants',
   'Fréquence de monitoring','OPTION_SINGLE',1,0.50::float),
  -- D8_C2 : Force Majeure
  ('D8_C2_S1','D8_C2','Définition Force Majeure',
   'Scope des événements FM','OPTION_SINGLE',0,0.50::float),
  ('D8_C2_S2','D8_C2','Atténuation Force Majeure',
   'Mesures d''atténuation des risques','OPTION_SINGLE',1,0.50::float),
  -- D9_C1 : Stress P50/P90
  ('D9_C1_S1','D9_C1','Test Stress P50',
   'Stress cas base (-20%)','NUMERIC_RANGE',0,0.50::float),
  ('D9_C1_S2','D9_C1','Test Stress P90',
   'Stress downside (-30%)','NUMERIC_RANGE',1,0.50::float),
  -- D9_C2 : Surcoûts/Revenus
  ('D9_C2_S1','D9_C2','Impact Surcoûts',
   'Résilience augmentation coûts','NUMERIC_RANGE',0,0.50::float),
  ('D9_C2_S2','D9_C2','Impact Revenus',
   'Résilience baisse revenus','NUMERIC_RANGE',1,0.50::float)
) AS s(code, parent_code, label, description, answer_type, order_idx, weight)
WHERE NOT EXISTS (
  SELECT 1 FROM "BP_PF_v7pp_scoring_nodes" n
  WHERE n."versionId" = (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1)
  AND n.code = s.code AND n."nodeType" = 'SUB_CRITERION'
);

-- ============================================================================
-- ÉTAPE 4 : VÉRIFICATION FINALE
-- ============================================================================
SELECT
  'Structure V3' AS titre,
  "nodeType",
  depth,
  COUNT(*) AS nombre
FROM "BP_PF_v7pp_scoring_nodes"
WHERE "versionId" = (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3 LIMIT 1
)
GROUP BY "nodeType", depth
ORDER BY depth, "nodeType";
