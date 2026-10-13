-- Actionnaires, dirigeants et bénéficiaires effectifs des clients (KYC, LBC/FT).
-- Additive et rejouable.

CREATE TABLE IF NOT EXISTS "BP_PF_client_actionnaires" (
  "id"                   UUID NOT NULL DEFAULT gen_random_uuid(),
  "clientId"             UUID NOT NULL,
  "typePersonne"         TEXT NOT NULL DEFAULT 'Personne physique',
  "nom"                  TEXT NOT NULL,
  "qualite"              TEXT NOT NULL DEFAULT 'Actionnaire',
  "pays"                 TEXT,
  "identifiant"          TEXT,
  "pourcentageDetention" DOUBLE PRECISION,
  "beneficiaireEffectif" BOOLEAN NOT NULL DEFAULT false,
  "ppe"                  BOOLEAN NOT NULL DEFAULT false,
  "ordre"                INTEGER NOT NULL DEFAULT 0,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BP_PF_client_actionnaires_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BP_PF_client_actionnaires_clientId_idx" ON "BP_PF_client_actionnaires" ("clientId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BP_PF_client_actionnaires_clientId_fkey') THEN
    ALTER TABLE "BP_PF_client_actionnaires" ADD CONSTRAINT "BP_PF_client_actionnaires_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "BP_PF_clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
