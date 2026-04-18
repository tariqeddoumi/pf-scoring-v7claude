-- Configuration paramétrable du modèle de scoring
-- Compatible PostgreSQL / Supabase (syntaxe standard)
-- Idempotent: sécurisé si exécuté plusieurs fois

-- ============================================================================
-- TABLES DE CONFIGURATION (paramétrage 100% BD)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_answer_types" (
  id              VARCHAR(50)  PRIMARY KEY,
  label           VARCHAR(100),
  description     TEXT,
  "requiresOptions"   BOOLEAN DEFAULT false,
  "requiresRanges"    BOOLEAN DEFAULT false,
  "supportsMultiple"  BOOLEAN DEFAULT false,
  "minValue"      FLOAT,
  "maxValue"      FLOAT,
  "uiComponent"   VARCHAR(100),
  "isActive"      BOOLEAN DEFAULT true,
  "displayOrder"  INT DEFAULT 0,
  "createdAt"     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_answer_types_active" ON "BP_PF_v7pp_answer_types"("isActive");

CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_aggregation_methods" (
  id              VARCHAR(50) PRIMARY KEY,
  label           VARCHAR(100),
  description     TEXT,
  formula         TEXT,
  "requiresWeights" BOOLEAN DEFAULT false,
  "isActive"      BOOLEAN DEFAULT true,
  "displayOrder"  INT DEFAULT 0,
  "createdAt"     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_aggregation_methods_active" ON "BP_PF_v7pp_aggregation_methods"("isActive");

CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_weight_modes" (
  id              VARCHAR(50) PRIMARY KEY,
  label           VARCHAR(100),
  description     TEXT,
  "isActive"      BOOLEAN DEFAULT true,
  "displayOrder"  INT DEFAULT 0,
  "createdAt"     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_weight_modes_active" ON "BP_PF_v7pp_weight_modes"("isActive");

CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_score_scales" (
  id              VARCHAR(50) PRIMARY KEY,
  label           VARCHAR(100),
  description     TEXT,
  "minScore"      FLOAT,
  "maxScore"      FLOAT,
  "isActive"      BOOLEAN DEFAULT true,
  "displayOrder"  INT DEFAULT 0,
  "createdAt"     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_score_scales_active" ON "BP_PF_v7pp_score_scales"("isActive");

CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_rating_scales" (
  id              VARCHAR(50) PRIMARY KEY,
  label           VARCHAR(10),
  description     TEXT,
  "minScore"      FLOAT,
  "maxScore"      FLOAT,
  color           VARCHAR(20),
  "displayOrder"  INT DEFAULT 0,
  "createdAt"     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_rating_scales_order" ON "BP_PF_v7pp_rating_scales"("displayOrder");

-- ============================================================================
-- DONNÉES PAR DÉFAUT (UPSERT PostgreSQL natif)
-- ============================================================================

INSERT INTO "BP_PF_v7pp_answer_types"
  (id, label, description, "requiresOptions", "requiresRanges", "uiComponent", "displayOrder")
VALUES
  ('OPTION_SINGLE',  'Option unique',     'Choisir une option dans une liste',      true,  false, 'select',        1),
  ('OPTION_MULTI',   'Options multiples', 'Choisir plusieurs options',              true,  false, 'checkbox',      2),
  ('NUMERIC_RANGE',  'Plage numérique',   'Valeur numérique avec plages de score',  false, true,  'input[number]', 3),
  ('BOOLEAN',        'Oui / Non',         'Question oui/non simple',                false, false, 'radio',         4),
  ('TEXT',           'Texte libre',       'Saisie libre (non scorée)',              false, false, 'textarea',      5),
  ('NUMERIC',        'Nombre',            'Nombre simple (sans plages)',            false, false, 'input[number]', 6)
ON CONFLICT (id) DO UPDATE SET
  label           = EXCLUDED.label,
  description     = EXCLUDED.description,
  "displayOrder"  = EXCLUDED."displayOrder";

INSERT INTO "BP_PF_v7pp_aggregation_methods"
  (id, label, description, formula, "requiresWeights", "displayOrder")
VALUES
  ('AVERAGE',          'Moyenne simple',     'Moyenne de tous les scores enfants',            'sum(scores) / count',                false, 1),
  ('WEIGHTED_AVERAGE', 'Moyenne pondérée',   'Moyenne pondérée par les poids des enfants',   'sum(score x weight) / sum(weights)', true,  2),
  ('SUM',              'Somme',              'Somme de tous les scores enfants',              'sum(scores)',                        false, 3),
  ('MIN',              'Minimum',            'Score minimal (plus conservateur)',             'min(scores)',                        false, 4),
  ('MAX',              'Maximum',            'Score maximal (plus optimiste)',                'max(scores)',                        false, 5),
  ('FIRST',            'Premier uniquement', 'Utiliser uniquement le premier score enfant',  'first(scores)',                      false, 6)
ON CONFLICT (id) DO UPDATE SET
  label           = EXCLUDED.label,
  description     = EXCLUDED.description,
  "displayOrder"  = EXCLUDED."displayOrder";

INSERT INTO "BP_PF_v7pp_weight_modes"
  (id, label, description, "displayOrder")
VALUES
  ('RELATIVE', 'Poids relatif',     'Poids en pourcentage du total (somme = 1.0)', 1),
  ('ABSOLUTE', 'Poids absolu',      'Valeur de poids fixe',                        2),
  ('NONE',     'Sans pondération',  'Poids égal pour tous les enfants',            3)
ON CONFLICT (id) DO UPDATE SET
  label           = EXCLUDED.label,
  "displayOrder"  = EXCLUDED."displayOrder";

INSERT INTO "BP_PF_v7pp_score_scales"
  (id, label, "minScore", "maxScore", "displayOrder")
VALUES
  ('0_100', 'Score 0-100', 0, 100, 1),
  ('0_10',  'Score 0-10',  0,  10, 2),
  ('1_5',   'Score 1-5',   1,   5, 3),
  ('0_1',   'Score 0-1',   0,   1, 4)
ON CONFLICT (id) DO UPDATE SET
  label           = EXCLUDED.label,
  "displayOrder"  = EXCLUDED."displayOrder";

INSERT INTO "BP_PF_v7pp_rating_scales"
  (id, label, "minScore", "maxScore", color, "displayOrder")
VALUES
  ('AAA', 'AAA', 95,    100,   'green-600',  1),
  ('AA',  'AA',  90,    94.99, 'green-500',  2),
  ('A',   'A',   85,    89.99, 'green-400',  3),
  ('BBB', 'BBB', 75,    84.99, 'blue-500',   4),
  ('BB',  'BB',  65,    74.99, 'blue-400',   5),
  ('B',   'B',   55,    64.99, 'yellow-500', 6),
  ('CCC', 'CCC', 45,    54.99, 'orange-500', 7),
  ('CC',  'CC',  35,    44.99, 'orange-400', 8),
  ('C',   'C',   25,    34.99, 'red-500',    9),
  ('D',   'D',   0,     24.99, 'red-600',    10)
ON CONFLICT (id) DO UPDATE SET
  "minScore"      = EXCLUDED."minScore",
  "maxScore"      = EXCLUDED."maxScore",
  color           = EXCLUDED.color,
  "displayOrder"  = EXCLUDED."displayOrder";
