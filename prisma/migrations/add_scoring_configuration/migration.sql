-- Configuration paramétrable du modèle de scoring
-- Permet de configurer TOUT sans modifier le code

CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_config" (
  id VARCHAR(50) PRIMARY KEY,  -- config_key, pas UUID
  versionId UUID NOT NULL,
  category VARCHAR(50),  -- 'MODEL', 'DOMAIN', 'CRITERION', 'ANSWER_TYPE', 'CALCULATION'
  label VARCHAR(255),
  description TEXT,
  value TEXT,  -- JSON si besoin
  valueType VARCHAR(50),  -- 'STRING', 'NUMBER', 'BOOLEAN', 'JSON'
  isActive BOOLEAN DEFAULT true,
  displayOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  createdBy UUID,

  FOREIGN KEY ("versionId") REFERENCES "BP_PF_v7pp_scoring_versions"(id) ON DELETE CASCADE,
  INDEX idx_version_category ("versionId", "category")
);

-- Configuration des types de réponse disponibles
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_answer_types" (
  id VARCHAR(50) PRIMARY KEY,  -- OPTION_SINGLE, NUMERIC_RANGE, BOOLEAN, TEXT
  label VARCHAR(100),
  description TEXT,
  requiresOptions BOOLEAN DEFAULT false,
  requiresRanges BOOLEAN DEFAULT false,
  supportsMultiple BOOLEAN DEFAULT false,
  minValue FLOAT,
  maxValue FLOAT,
  uiComponent VARCHAR(100),  -- 'select', 'input[number]', 'radio', 'textarea'
  isActive BOOLEAN DEFAULT true,
  displayOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),

  INDEX idx_active ("isActive")
);

-- Configuration des méthodes d'agrégation
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_aggregation_methods" (
  id VARCHAR(50) PRIMARY KEY,  -- AVERAGE, WEIGHTED_AVERAGE, SUM, MIN, MAX
  label VARCHAR(100),
  description TEXT,
  formula TEXT,  -- Description du calcul
  requiresWeights BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  displayOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),

  INDEX idx_active ("isActive")
);

-- Configuration des poids (si modifiables)
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_weight_modes" (
  id VARCHAR(50) PRIMARY KEY,  -- RELATIVE, ABSOLUTE, NONE, CUSTOM
  label VARCHAR(100),
  description TEXT,
  isActive BOOLEAN DEFAULT true,
  displayOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),

  INDEX idx_active ("isActive")
);

-- ============================================================================
-- INSERT DEFAULT CONFIGURATIONS
-- ============================================================================

-- Answer Types
INSERT INTO "BP_PF_v7pp_answer_types" (id, label, description, requiresOptions, uiComponent, displayOrder) VALUES
  ('OPTION_SINGLE', 'Single Option', 'Choose one option from a list', true, 'select', 1),
  ('OPTION_MULTI', 'Multiple Options', 'Choose multiple options', true, 'checkbox', 2),
  ('NUMERIC_RANGE', 'Numeric Range', 'Enter a numeric value within ranges', true, 'input[number]', 3),
  ('BOOLEAN', 'Yes/No', 'Simple yes/no question', false, 'radio', 4),
  ('TEXT', 'Free Text', 'Enter free text (no scoring)', false, 'textarea', 5),
  ('NUMERIC', 'Number', 'Enter a number (no ranges)', false, 'input[number]', 6)
ON DUPLICATE KEY UPDATE displayOrder = VALUES(displayOrder);

-- Aggregation Methods
INSERT INTO "BP_PF_v7pp_aggregation_methods" (id, label, description, formula, requiresWeights, displayOrder) VALUES
  ('AVERAGE', 'Simple Average', 'Average of all child scores', 'sum(child_scores) / count(children)', false, 1),
  ('WEIGHTED_AVERAGE', 'Weighted Average', 'Average weighted by child weights', 'sum(child_score * child_weight) / sum(child_weights)', true, 2),
  ('SUM', 'Sum', 'Sum of all child scores', 'sum(child_scores)', false, 3),
  ('MIN', 'Minimum', 'Minimum child score (most conservative)', 'min(child_scores)', false, 4),
  ('MAX', 'Maximum', 'Maximum child score (most optimistic)', 'max(child_scores)', false, 5),
  ('FIRST', 'First Only', 'Use first child score only', 'first(child_scores)', false, 6)
ON DUPLICATE KEY UPDATE displayOrder = VALUES(displayOrder);

-- Weight Modes
INSERT INTO "BP_PF_v7pp_weight_modes" (id, label, description, displayOrder) VALUES
  ('RELATIVE', 'Relative Weight', 'Weight as percentage of total (sum = 1.0)', 1),
  ('ABSOLUTE', 'Absolute Weight', 'Fixed weight value', 2),
  ('NONE', 'No Weight', 'Equal weight for all', 3)
ON DUPLICATE KEY UPDATE displayOrder = VALUES(displayOrder);

-- Default Score Ranges (can be customized per version)
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_score_scales" (
  id VARCHAR(50) PRIMARY KEY,  -- 0_100, 0_10, GRADE_AAA_D
  label VARCHAR(100),
  description TEXT,
  minScore FLOAT,
  maxScore FLOAT,
  isActive BOOLEAN DEFAULT true,
  displayOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),

  INDEX idx_active ("isActive")
);

INSERT INTO "BP_PF_v7pp_score_scales" (id, label, minScore, maxScore, displayOrder) VALUES
  ('0_100', 'Score 0-100', 0, 100, 1),
  ('0_10', 'Score 0-10', 0, 10, 2),
  ('1_5', 'Score 1-5', 1, 5, 3),
  ('0_1', 'Score 0-1', 0, 1, 4)
ON DUPLICATE KEY UPDATE displayOrder = VALUES(displayOrder);

-- Rating Categories (for final rating display)
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_rating_scales" (
  id VARCHAR(50) PRIMARY KEY,  -- AAA, AA, A, BBB, BB, B, CCC, CC, C, D
  label VARCHAR(10),
  description TEXT,
  minScore FLOAT,
  maxScore FLOAT,
  color VARCHAR(20),  -- CSS color or TailwindCSS class
  displayOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),

  INDEX idx_order ("displayOrder")
);

INSERT INTO "BP_PF_v7pp_rating_scales" (id, label, minScore, maxScore, color, displayOrder) VALUES
  ('AAA', 'AAA', 95, 100, 'green-600', 1),
  ('AA', 'AA', 90, 94.99, 'green-500', 2),
  ('A', 'A', 85, 89.99, 'green-400', 3),
  ('BBB', 'BBB', 75, 84.99, 'blue-500', 4),
  ('BB', 'BB', 65, 74.99, 'blue-400', 5),
  ('B', 'B', 55, 64.99, 'yellow-500', 6),
  ('CCC', 'CCC', 45, 54.99, 'orange-500', 7),
  ('CC', 'CC', 35, 44.99, 'orange-400', 8),
  ('C', 'C', 25, 34.99, 'red-500', 9),
  ('D', 'D', 0, 24.99, 'red-600', 10)
ON DUPLICATE KEY UPDATE color = VALUES(color);
