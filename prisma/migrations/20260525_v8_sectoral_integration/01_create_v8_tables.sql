-- V8 Sectoral Integration: Create tables for sector-specific adjustments
-- 12 sectors × 9 domains with weight adjustments, stress tests, red flags, domain impacts

CREATE TABLE IF NOT EXISTS "BP_PF_v8_sectors" (
  "id"          TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "code"        TEXT        NOT NULL UNIQUE,
  "label"       TEXT        NOT NULL,
  "orderIndex"  INTEGER     NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BP_PF_v8_sector_domain_weights" (
  "id"             TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sectorId"       TEXT        NOT NULL REFERENCES "BP_PF_v8_sectors"("id") ON DELETE CASCADE,
  "domainCode"     TEXT        NOT NULL,  -- D1..D9
  "weightAdjusted" DOUBLE PRECISION NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("sectorId", "domainCode")
);

CREATE TABLE IF NOT EXISTS "BP_PF_v8_sector_stress_tests" (
  "id"          TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sectorId"    TEXT        NOT NULL REFERENCES "BP_PF_v8_sectors"("id") ON DELETE CASCADE,
  "description" TEXT        NOT NULL,
  "orderIndex"  INTEGER     NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BP_PF_v8_sector_red_flags" (
  "id"          TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sectorId"    TEXT        NOT NULL REFERENCES "BP_PF_v8_sectors"("id") ON DELETE CASCADE,
  "description" TEXT        NOT NULL,
  "isNoGo"      BOOLEAN     NOT NULL DEFAULT false,
  "orderIndex"  INTEGER     NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BP_PF_v8_sector_domain_impacts" (
  "id"          TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sectorId"    TEXT        NOT NULL REFERENCES "BP_PF_v8_sectors"("id") ON DELETE CASCADE,
  "domainCode"  TEXT        NOT NULL,  -- D1..D9
  "impact"      INTEGER     NOT NULL,  -- negative = less focus, positive = more focus
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("sectorId", "domainCode")
);

-- Integration rules / bonus-malus configuration
CREATE TABLE IF NOT EXISTS "BP_PF_v8_integration_rules" (
  "id"          TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "rubrique"    TEXT        NOT NULL,
  "regle"       TEXT        NOT NULL,
  "orderIndex"  INTEGER     NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
