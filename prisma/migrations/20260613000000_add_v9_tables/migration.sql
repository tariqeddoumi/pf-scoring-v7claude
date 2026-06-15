-- V9 Implementation Migration
-- Adds: 11 new tables for V9 scoring model + app configuration
-- Non-breaking: Preserves all existing V7++ and V8 tables
-- RLS: Critical tables protected via policy

-- Enable UUID extension (used for uuid_generate_v4 defaults)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- V9 SCORING MODEL & CONFIGURATION
-- ============================================================================

-- V9 Scoring Model Metadata
CREATE TABLE IF NOT EXISTS "BP_PF_v9_scoring_models" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT UNIQUE NOT NULL,
  "toolName" TEXT NOT NULL,
  description TEXT,
  "socleVersion" TEXT NOT NULL DEFAULT 'V7++',
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- V9 Sectors (12: ENR, EAU, TRA, POR, IND, MIN, TOU, TEL, SAN, AGR, ETH, IMM)
CREATE TABLE IF NOT EXISTS "BP_PF_v9_sectors" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_v9_sectors_code ON "BP_PF_v9_sectors"(code);

-- V9 Sector Thresholds (144 total: 12 sectors × 3 ratios × 4 levels)
CREATE TABLE IF NOT EXISTS "BP_PF_v9_sector_thresholds" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sectorId" UUID NOT NULL REFERENCES "BP_PF_v9_sectors"(id) ON DELETE CASCADE,
  "ratioType" TEXT NOT NULL CHECK("ratioType" IN ('DSCR', 'LLCR', 'LEVERAGE')),
  level TEXT NOT NULL CHECK(level IN ('EXCELLENT', 'BON', 'ACCEPTABLE', 'INSUFFISANT')),
  "minValue" FLOAT,
  "maxValue" FLOAT,
  score FLOAT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_sector_ratio_level UNIQUE("sectorId", "ratioType", level)
);
CREATE INDEX IF NOT EXISTS idx_v9_thresholds_sector ON "BP_PF_v9_sector_thresholds"("sectorId");

-- V9 Sector Domain Weights (108 total: 12 sectors × 9 domains)
CREATE TABLE IF NOT EXISTS "BP_PF_v9_sector_domain_weights" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sectorId" UUID NOT NULL REFERENCES "BP_PF_v9_sectors"(id) ON DELETE CASCADE,
  "domainCode" TEXT NOT NULL,
  "weightAdjusted" FLOAT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_sector_domain_weight UNIQUE("sectorId", "domainCode")
);
CREATE INDEX IF NOT EXISTS idx_v9_weights_sector ON "BP_PF_v9_sector_domain_weights"("sectorId");

-- V9 Red Flags (96 total: 8 per sector)
CREATE TABLE IF NOT EXISTS "BP_PF_v9_red_flags" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sectorId" UUID NOT NULL REFERENCES "BP_PF_v9_sectors"(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  "isNoGo" BOOLEAN NOT NULL DEFAULT false,
  penalty FLOAT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_sector_flag_code UNIQUE("sectorId", code)
);
CREATE INDEX IF NOT EXISTS idx_v9_red_flags_sector ON "BP_PF_v9_red_flags"("sectorId");

-- V9 Indicators (72 total: 6 per sector)
CREATE TABLE IF NOT EXISTS "BP_PF_v9_indicators" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sectorId" UUID NOT NULL REFERENCES "BP_PF_v9_sectors"(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  unit TEXT,
  "targetValue" TEXT,
  direction TEXT NOT NULL CHECK(direction IN ('HIGHER_BETTER', 'LOWER_BETTER', 'RANGE')),
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_sector_indicator_code UNIQUE("sectorId", code)
);
CREATE INDEX IF NOT EXISTS idx_v9_indicators_sector ON "BP_PF_v9_indicators"("sectorId");

-- V9 Stress Tests (24 total: 2 per sector)
CREATE TABLE IF NOT EXISTS "BP_PF_v9_stress_tests" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sectorId" UUID NOT NULL REFERENCES "BP_PF_v9_sectors"(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  variable TEXT,
  "shockPct" FLOAT,
  "passDscrMin" FLOAT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_sector_stress_code UNIQUE("sectorId", code)
);
CREATE INDEX IF NOT EXISTS idx_v9_stress_tests_sector ON "BP_PF_v9_stress_tests"("sectorId");

-- V9 Malus/Bonus Rules (formalized penalties and bonuses)
CREATE TABLE IF NOT EXISTS "BP_PF_v9_malus_bonus" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  scope TEXT NOT NULL CHECK(scope IN ('DOMAIN', 'GLOBAL')),
  "domainCode" TEXT,
  kind TEXT NOT NULL CHECK(kind IN ('MALUS', 'BONUS')),
  condition TEXT NOT NULL,
  magnitude TEXT NOT NULL,
  "capPerDomain" FLOAT,
  "capGlobal" FLOAT,
  "nonCumulGroup" TEXT,
  rationale TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_v9_malus_bonus_code ON "BP_PF_v9_malus_bonus"(code);

-- V9 Anti-Double-Counting Matrix (72: 8 factors × 9 domains)
CREATE TABLE IF NOT EXISTS "BP_PF_v9_anti_double_count" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "factorCode" TEXT NOT NULL,
  "factorLabel" TEXT NOT NULL,
  "domainCode" TEXT NOT NULL,
  arbitration TEXT NOT NULL CHECK(arbitration IN ('PRIMARY', 'SECONDARY', 'EXCLUDED')),
  note TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_factor_domain UNIQUE("factorCode", "domainCode")
);
CREATE INDEX IF NOT EXISTS idx_v9_antidc_factor ON "BP_PF_v9_anti_double_count"("factorCode");

-- ============================================================================
-- PARAMÉTRAGE GLOBAL APPLICATION
-- ============================================================================

-- Application Configuration (key-value store with audit trail)
CREATE TABLE IF NOT EXISTS "BP_PF_app_configuration" (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('string', 'color', 'url', 'enum', 'bool', 'number')),
  category TEXT NOT NULL CHECK(category IN ('branding', 'theme', 'behavior')),
  description TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  metadata TEXT,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy" TEXT
);
CREATE INDEX IF NOT EXISTS idx_app_config_category ON "BP_PF_app_configuration"(category);

-- Application Configuration Change History
CREATE TABLE IF NOT EXISTS "BP_PF_app_config_history" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL REFERENCES "BP_PF_app_configuration"(key) ON DELETE CASCADE,
  "oldValue" TEXT,
  "newValue" TEXT NOT NULL,
  "changedBy" TEXT,
  "changedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_app_config_history_key ON "BP_PF_app_config_history"(key);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on critical tables
ALTER TABLE "BP_PF_v9_sectors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_v9_sector_thresholds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_v9_red_flags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_v9_indicators" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_v9_stress_tests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_app_configuration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_app_config_history" ENABLE ROW LEVEL SECURITY;

-- NOTE: PostgreSQL has no "CREATE POLICY IF NOT EXISTS"; use DROP + CREATE for idempotency.
-- This app reads/writes exclusively through Prisma on a privileged pooler role (which
-- bypasses RLS) and enforces authorization at the application layer (withAdminAuth).
-- RLS here is defense-in-depth for any direct (anon) Supabase client access: reference
-- data is world-readable, configuration/history are not exposed to anon clients.

-- Public read access for V9 reference data (sectors, thresholds, etc.)
DROP POLICY IF EXISTS "v9_sectors_read_all" ON "BP_PF_v9_sectors";
CREATE POLICY "v9_sectors_read_all" ON "BP_PF_v9_sectors"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "v9_thresholds_read_all" ON "BP_PF_v9_sector_thresholds";
CREATE POLICY "v9_thresholds_read_all" ON "BP_PF_v9_sector_thresholds"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "v9_red_flags_read_all" ON "BP_PF_v9_red_flags";
CREATE POLICY "v9_red_flags_read_all" ON "BP_PF_v9_red_flags"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "v9_indicators_read_all" ON "BP_PF_v9_indicators";
CREATE POLICY "v9_indicators_read_all" ON "BP_PF_v9_indicators"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "v9_stress_tests_read_all" ON "BP_PF_v9_stress_tests";
CREATE POLICY "v9_stress_tests_read_all" ON "BP_PF_v9_stress_tests"
  FOR SELECT USING (true);

-- Public read for app configuration limited to keys explicitly marked public (for UI)
DROP POLICY IF EXISTS "app_config_read_public" ON "BP_PF_app_configuration";
CREATE POLICY "app_config_read_public" ON "BP_PF_app_configuration"
  FOR SELECT USING ("isPublic" = true);

-- ============================================================================
-- COMPUTED VIEWS / MATERIALIZED SNAPSHOTS (optional, for performance)
-- ============================================================================

-- Count materialized view for health checks
CREATE OR REPLACE VIEW "v_v9_data_counts" AS
SELECT
  (SELECT COUNT(*) FROM "BP_PF_v9_sectors") as sector_count,
  (SELECT COUNT(*) FROM "BP_PF_v9_sector_thresholds") as threshold_count,
  (SELECT COUNT(*) FROM "BP_PF_v9_sector_domain_weights") as domain_weight_count,
  (SELECT COUNT(*) FROM "BP_PF_v9_red_flags") as red_flag_count,
  (SELECT COUNT(*) FROM "BP_PF_v9_indicators") as indicator_count,
  (SELECT COUNT(*) FROM "BP_PF_v9_stress_tests") as stress_test_count,
  (SELECT COUNT(*) FROM "BP_PF_v9_malus_bonus") as malus_bonus_count,
  (SELECT COUNT(*) FROM "BP_PF_app_configuration") as app_config_count,
  CURRENT_TIMESTAMP as snapshot_time;

COMMENT ON VIEW "v_v9_data_counts" IS 'V9 data integrity check - use for monitoring';
