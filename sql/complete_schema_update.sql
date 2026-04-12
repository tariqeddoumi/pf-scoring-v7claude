-- ============================================================================
-- COMPLETE SCHEMA UPDATE FOR PF SCORING v7
-- Adds extended fields for Clients, Projects, Evaluations
-- Adds parametrization tables for dropdowns
-- ============================================================================

-- ============================================================================
-- STEP 1: ALTER BP_PF_clients TABLE - Add missing fields
-- ============================================================================

ALTER TABLE "BP_PF_clients"
  ADD COLUMN IF NOT EXISTS "raisonSociale" TEXT,
  ADD COLUMN IF NOT EXISTS "nomCommercial" TEXT,
  ADD COLUMN IF NOT EXISTS "typeClient" TEXT DEFAULT 'Entreprise',
  ADD COLUMN IF NOT EXISTS "formeJuridique" TEXT,
  ADD COLUMN IF NOT EXISTS "segmentClientele" TEXT,
  ADD COLUMN IF NOT EXISTS "ratingInterne" TEXT,
  ADD COLUMN IF NOT EXISTS "statutBancaire" TEXT DEFAULT 'Prospect',
  ADD COLUMN IF NOT EXISTS "statusKYC" TEXT DEFAULT 'En attente',
  ADD COLUMN IF NOT EXISTS "statusConformite" TEXT DEFAULT 'En attente',
  ADD COLUMN IF NOT EXISTS "effectifs" INTEGER,
  ADD COLUMN IF NOT EXISTS "capitalSocial" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "chiffreAffaires" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "adresse" TEXT,
  ADD COLUMN IF NOT EXISTS "codePostal" TEXT,
  ADD COLUMN IF NOT EXISTS "ville" TEXT,
  ADD COLUMN IF NOT EXISTS "website" TEXT,
  ADD COLUMN IF NOT EXISTS "centreAffaires" TEXT,
  ADD COLUMN IF NOT EXISTS "gestionnaire" TEXT,
  ADD COLUMN IF NOT EXISTS "dateRelation" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "exposition" DOUBLE PRECISION;

-- ============================================================================
-- STEP 2: ALTER BP_PF_projects TABLE - Add missing fields
-- ============================================================================

ALTER TABLE "BP_PF_projects"
  ADD COLUMN IF NOT EXISTS "sponsorPrincipal" TEXT,
  ADD COLUMN IF NOT EXISTS "nomSPV" TEXT,
  ADD COLUMN IF NOT EXISTS "constructeurEPC" TEXT,
  ADD COLUMN IF NOT EXISTS "operateurOM" TEXT,
  ADD COLUMN IF NOT EXISTS "technologie" TEXT,
  ADD COLUMN IF NOT EXISTS "capaciteInstallee" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "debutConstruction" DATE,
  ADD COLUMN IF NOT EXISTS "finConstruction" DATE,
  ADD COLUMN IF NOT EXISTS "coutTotal" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "financement" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "apportPropre" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "structureCapitalePrincipale" TEXT,
  ADD COLUMN IF NOT EXISTS "dureeCredit" INTEGER,
  ADD COLUMN IF NOT EXISTS "taux" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "typeCredit" TEXT,
  ADD COLUMN IF NOT EXISTS "dureeProjet" INTEGER,
  ADD COLUMN IF NOT EXISTS "periodeAmorce" INTEGER,
  ADD COLUMN IF NOT EXISTS "periodeRemboursement" INTEGER,
  ADD COLUMN IF NOT EXISTS "tauxCouverture" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "ratio" DOUBLE PRECISION;

-- ============================================================================
-- STEP 3: ALTER BP_PF_v7pp_evaluations TABLE - Add missing fields
-- ============================================================================

ALTER TABLE "BP_PF_v7pp_evaluations"
  ADD COLUMN IF NOT EXISTS "scoreFinancier" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "scoreTechnique" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "scoreMarche" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "scoreEnvironnemental" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "scoreSocial" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "scoreGouvenance" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "scoreJuridique" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "scorePays" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "rejectedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- ============================================================================
-- STEP 4: CREATE PARAMETRIZATION TABLES
-- ============================================================================

-- Sectors table
CREATE TABLE IF NOT EXISTS "BP_PF_sectors" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "BP_PF_sectors_code_idx" ON "BP_PF_sectors"("code");
CREATE INDEX IF NOT EXISTS "BP_PF_sectors_isActive_idx" ON "BP_PF_sectors"("isActive");

-- Sub-sectors table
CREATE TABLE IF NOT EXISTS "BP_PF_subsectors" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sectorId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BP_PF_subsectors_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "BP_PF_sectors"("id") ON DELETE CASCADE,
  CONSTRAINT "BP_PF_subsectors_sector_code_key" UNIQUE("sectorId", "code")
);

CREATE INDEX IF NOT EXISTS "BP_PF_subsectors_sectorId_idx" ON "BP_PF_subsectors"("sectorId");
CREATE INDEX IF NOT EXISTS "BP_PF_subsectors_code_idx" ON "BP_PF_subsectors"("code");

-- Client types table
CREATE TABLE IF NOT EXISTS "BP_PF_client_types" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "BP_PF_client_types_code_idx" ON "BP_PF_client_types"("code");

-- Legal forms table
CREATE TABLE IF NOT EXISTS "BP_PF_legal_forms" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "BP_PF_legal_forms_code_idx" ON "BP_PF_legal_forms"("code");

-- Client segments table
CREATE TABLE IF NOT EXISTS "BP_PF_client_segments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "BP_PF_client_segments_code_idx" ON "BP_PF_client_segments"("code");

-- Bank statuses table
CREATE TABLE IF NOT EXISTS "BP_PF_bank_statuses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "BP_PF_bank_statuses_code_idx" ON "BP_PF_bank_statuses"("code");

-- Internal ratings table
CREATE TABLE IF NOT EXISTS "BP_PF_internal_ratings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "score" DOUBLE PRECISION,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "BP_PF_internal_ratings_code_idx" ON "BP_PF_internal_ratings"("code");

-- KYC statuses table
CREATE TABLE IF NOT EXISTS "BP_PF_kyc_statuses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "BP_PF_kyc_statuses_code_idx" ON "BP_PF_kyc_statuses"("code");

-- Compliance statuses table
CREATE TABLE IF NOT EXISTS "BP_PF_compliance_statuses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "BP_PF_compliance_statuses_code_idx" ON "BP_PF_compliance_statuses"("code");

-- ============================================================================
-- STEP 5: POPULATE PARAMETRIZATION TABLES WITH DATA
-- ============================================================================

-- Insert Sectors
INSERT INTO "BP_PF_sectors" ("id", "code", "label", "description", "orderIndex", "isActive")
VALUES
  ('sector-1', 'ENERGIE', 'Énergie', 'Secteur de l''énergie et électricité', 1, true),
  ('sector-2', 'TRANSPORT', 'Transport', 'Secteur du transport et logistique', 2, true),
  ('sector-3', 'TELECOM', 'Télécommunications', 'Secteur des télécommunications', 3, true),
  ('sector-4', 'EAU', 'Eau et Assainissement', 'Secteur de l''eau et assainissement', 4, true),
  ('sector-5', 'INDUSTRIE', 'Industrie', 'Secteur industriel', 5, true),
  ('sector-6', 'TOURISME', 'Tourisme', 'Secteur du tourisme et hôtellerie', 6, true),
  ('sector-7', 'AGRICULTURE', 'Agriculture', 'Secteur agricole', 7, true),
  ('sector-8', 'IMMOBILIER', 'Immobilier', 'Secteur immobilier', 8, true),
  ('sector-9', 'SANTE', 'Santé', 'Secteur de la santé', 9, true),
  ('sector-10', 'EDUCATION', 'Éducation', 'Secteur de l''éducation', 10, true)
ON CONFLICT ("code") DO NOTHING;

-- Insert Client Types
INSERT INTO "BP_PF_client_types" ("id", "code", "label", "description", "orderIndex", "isActive")
VALUES
  ('type-1', 'ENTREPRISE', 'Entreprise', 'Entreprise commerciale', 1, true),
  ('type-2', 'PME', 'PME', 'Petite ou Moyenne Entreprise', 2, true),
  ('type-3', 'GE', 'Grande Entreprise', 'Grande entreprise', 3, true),
  ('type-4', 'ETAT', 'État/Institution', 'État ou institution publique', 4, true),
  ('type-5', 'ONG', 'ONG', 'Organisation non gouvernementale', 5, true),
  ('type-6', 'PARTICULIER', 'Particulier', 'Personne physique', 6, true)
ON CONFLICT ("code") DO NOTHING;

-- Insert Legal Forms
INSERT INTO "BP_PF_legal_forms" ("id", "code", "label", "description", "orderIndex", "isActive")
VALUES
  ('form-1', 'SARL', 'SARL', 'Société à Responsabilité Limitée', 1, true),
  ('form-2', 'SA', 'S.A.', 'Société Anonyme', 2, true),
  ('form-3', 'EIRL', 'EIRL', 'Entreprise Individuelle à Responsabilité Limitée', 3, true),
  ('form-4', 'SELARL', 'SELARL', 'Société d''Exercice Libéral à Responsabilité Limitée', 4, true),
  ('form-5', 'SELCA', 'SELCA', 'Société d''Exercice Libéral en Commandite par Actions', 5, true),
  ('form-6', 'SNC', 'SNC', 'Société en Nom Collectif', 6, true),
  ('form-7', 'SCS', 'SCS', 'Société en Commandite Simple', 7, true),
  ('form-8', 'SCPA', 'SCPA', 'Société Civile Professionnelle', 8, true)
ON CONFLICT ("code") DO NOTHING;

-- Insert Client Segments
INSERT INTO "BP_PF_client_segments" ("id", "code", "label", "description", "orderIndex", "isActive")
VALUES
  ('segment-1', 'PARTICULIER', 'Particulier', 'Client particulier', 1, true),
  ('segment-2', 'PME', 'PME', 'Petite et Moyenne Entreprise', 2, true),
  ('segment-3', 'ENTREPRISE', 'Entreprise', 'Entreprise', 3, true),
  ('segment-4', 'CORPORATE', 'Corporate', 'Groupe ou grande corporation', 4, true),
  ('segment-5', 'INSTITUTIONNEL', 'Institutionnel', 'Client institutionnel', 5, true),
  ('segment-6', 'SOUVERAIN', 'Souverain', 'État souverain', 6, true)
ON CONFLICT ("code") DO NOTHING;

-- Insert Bank Statuses
INSERT INTO "BP_PF_bank_statuses" ("id", "code", "label", "description", "orderIndex", "isActive")
VALUES
  ('status-1', 'PROSPECT', 'Prospect', 'Nouveau prospect', 1, true),
  ('status-2', 'CLIENT', 'Client', 'Client actif', 2, true),
  ('status-3', 'VIP', 'VIP', 'Client VIP', 3, true),
  ('status-4', 'INACTIF', 'Inactif', 'Client inactif', 5, true),
  ('status-5', 'SUSPENDU', 'Suspendu', 'Client suspendu', 6, true),
  ('status-6', 'CLOTURE', 'Clôturé', 'Compte clôturé', 7, true)
ON CONFLICT ("code") DO NOTHING;

-- Insert Internal Ratings
INSERT INTO "BP_PF_internal_ratings" ("id", "code", "label", "description", "score", "orderIndex", "isActive")
VALUES
  ('rating-1', 'AAA', 'AAA', 'Meilleure qualité', 100, 1, true),
  ('rating-2', 'AA', 'AA', 'Très bonne qualité', 90, 2, true),
  ('rating-3', 'A', 'A', 'Bonne qualité', 80, 3, true),
  ('rating-4', 'BBB', 'BBB', 'Acceptable', 70, 4, true),
  ('rating-5', 'BB', 'BB', 'Plus de risque', 60, 5, true),
  ('rating-6', 'B', 'B', 'Risque significatif', 50, 6, true),
  ('rating-7', 'CCC', 'CCC', 'Risque élevé', 40, 7, true),
  ('rating-8', 'D', 'D', 'Risque très élevé', 0, 8, true)
ON CONFLICT ("code") DO NOTHING;

-- Insert KYC Statuses
INSERT INTO "BP_PF_kyc_statuses" ("id", "code", "label", "description", "orderIndex", "isActive")
VALUES
  ('kyc-1', 'ATTENTE', 'En attente', 'KYC en attente de vérification', 1, true),
  ('kyc-2', 'VERIFIEE', 'Vérifiée', 'KYC vérifiée et approuvée', 2, true),
  ('kyc-3', 'REJET', 'Rejet', 'KYC rejetée', 3, true),
  ('kyc-4', 'EXPIRATION', 'Expiration', 'KYC expirant bientôt', 4, true),
  ('kyc-5', 'RENEW', 'À renouveler', 'KYC à renouveler', 5, true)
ON CONFLICT ("code") DO NOTHING;

-- Insert Compliance Statuses
INSERT INTO "BP_PF_compliance_statuses" ("id", "code", "label", "description", "orderIndex", "isActive")
VALUES
  ('compliance-1', 'ATTENTE', 'En attente', 'Conformité en attente de vérification', 1, true),
  ('compliance-2', 'CONFORME', 'Conforme', 'Conforme aux normes', 2, true),
  ('compliance-3', 'NON_CONFORME', 'Non conforme', 'Non conforme aux normes', 3, true),
  ('compliance-4', 'ALERTE', 'Alerte', 'Alerte de conformité', 4, true),
  ('compliance-5', 'EXEMPTION', 'Exemption', 'Exemption accordée', 5, true)
ON CONFLICT ("code") DO NOTHING;

-- ============================================================================
-- SCHEMA UPDATE COMPLETE
-- ============================================================================
-- All tables created and data populated successfully
-- Verify tables: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'BP_PF%';
