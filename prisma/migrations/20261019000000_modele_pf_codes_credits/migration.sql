-- Modèle de scoring Project Finance : radical client, code projet, crédits du projet et
-- évaluations du nouveau modèle (parcours en 13 blocs). Additive et rejouable.

-- Radical du client (7 chiffres, texte) et code projet (PF-AAAA-NNNN), uniques par banque
ALTER TABLE "BP_PF_clients" ADD COLUMN IF NOT EXISTS "radical" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "BP_PF_clients_entiteId_radical_key" ON "BP_PF_clients" ("entiteId", "radical");

ALTER TABLE "BP_PF_projects" ADD COLUMN IF NOT EXISTS "codeProjet" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "BP_PF_projects_entiteId_codeProjet_key" ON "BP_PF_projects" ("entiteId", "codeProjet");

-- Dossiers de crédit rattachés à un projet
CREATE TABLE IF NOT EXISTS "BP_PF_project_credits" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId"   UUID NOT NULL,
  "entiteId"    UUID,
  "numero"      TEXT NOT NULL,
  "nature"      TEXT NOT NULL,
  "montant"     DOUBLE PRECISION,
  "devise"      TEXT NOT NULL DEFAULT 'MAD',
  "dureeAns"    DOUBLE PRECISION,
  "role"        TEXT,
  "commentaire" TEXT,
  "source"      TEXT NOT NULL DEFAULT 'MANUELLE',
  "ordre"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BP_PF_project_credits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BP_PF_project_credits_projectId_idx" ON "BP_PF_project_credits" ("projectId");
CREATE UNIQUE INDEX IF NOT EXISTS "BP_PF_project_credits_entiteId_numero_key" ON "BP_PF_project_credits" ("entiteId", "numero");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BP_PF_project_credits_projectId_fkey') THEN
    ALTER TABLE "BP_PF_project_credits" ADD CONSTRAINT "BP_PF_project_credits_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "BP_PF_projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Évaluations selon le modèle Project Finance
CREATE TABLE IF NOT EXISTS "BP_PF_evaluations_pf" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId"     UUID NOT NULL,
  "titre"         TEXT,
  "statut"        TEXT NOT NULL DEFAULT 'brouillon',
  "saisie"        JSONB NOT NULL,
  "resultat"      JSONB,
  "parametres"    JSONB,
  "scoreGlobal"   DOUBLE PRECISION,
  "noteCalculee"  INTEGER,
  "noteApprouvee" TEXT,
  "regimeRetenu"  TEXT,
  "statutNote"    TEXT,
  "pieces"        JSONB,
  "analyseIa"     JSONB,
  "creePar"       UUID NOT NULL,
  "modifiePar"    UUID,
  "soumisLe"      TIMESTAMP(3),
  "validePar"     UUID,
  "valideLe"      TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BP_PF_evaluations_pf_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BP_PF_evaluations_pf_projectId_idx" ON "BP_PF_evaluations_pf" ("projectId");
CREATE INDEX IF NOT EXISTS "BP_PF_evaluations_pf_statut_idx" ON "BP_PF_evaluations_pf" ("statut");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BP_PF_evaluations_pf_projectId_fkey') THEN
    ALTER TABLE "BP_PF_evaluations_pf" ADD CONSTRAINT "BP_PF_evaluations_pf_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "BP_PF_projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Mêmes protections que les autres tables des dossiers (accès par l'API uniquement)
ALTER TABLE "BP_PF_project_credits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BP_PF_evaluations_pf" ENABLE ROW LEVEL SECURITY;
