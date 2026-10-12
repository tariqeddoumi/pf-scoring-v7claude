-- Multi-banques : entités (groupe, banques, filiales), rattachement des
-- utilisateurs, clients et projets ; paramètres de l'IA.
--
-- Migration ADDITIVE et rejouable : elle n'enlève rien et l'application déjà en
-- service l'ignore. À appliquer AVANT de déployer la version qui l'utilise.
-- Les données existantes sont rattachées à une entité racine « GROUPE », à renommer
-- ensuite dans Paramétrage › Banques et filiales.

CREATE TABLE IF NOT EXISTS "BP_PF_entites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BANQUE',
    "parentId" UUID,
    "chemin" TEXT NOT NULL,
    "niveau" INTEGER NOT NULL DEFAULT 0,
    "pays" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nomOutil" TEXT,
    "logoUrl" TEXT,
    "couleurPrimaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_entites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BP_PF_entites_code_key" ON "BP_PF_entites"("code");
CREATE INDEX IF NOT EXISTS "BP_PF_entites_parentId_idx" ON "BP_PF_entites"("parentId");
CREATE INDEX IF NOT EXISTS "BP_PF_entites_chemin_idx" ON "BP_PF_entites"("chemin");
DO $$ BEGIN
  ALTER TABLE "BP_PF_entites" ADD CONSTRAINT "BP_PF_entites_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "BP_PF_entites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "BP_PF_users" ADD COLUMN IF NOT EXISTS "entiteId" UUID;
ALTER TABLE "BP_PF_users" ADD COLUMN IF NOT EXISTS "porteeEcriture" TEXT NOT NULL DEFAULT 'entite';
ALTER TABLE "BP_PF_clients" ADD COLUMN IF NOT EXISTS "entiteId" UUID;
ALTER TABLE "BP_PF_projects" ADD COLUMN IF NOT EXISTS "entiteId" UUID;
CREATE INDEX IF NOT EXISTS "BP_PF_users_entiteId_idx" ON "BP_PF_users"("entiteId");
CREATE INDEX IF NOT EXISTS "BP_PF_clients_entiteId_idx" ON "BP_PF_clients"("entiteId");
CREATE INDEX IF NOT EXISTS "BP_PF_projects_entiteId_idx" ON "BP_PF_projects"("entiteId");
DO $$ BEGIN
  ALTER TABLE "BP_PF_users" ADD CONSTRAINT "BP_PF_users_entiteId_fkey"
    FOREIGN KEY ("entiteId") REFERENCES "BP_PF_entites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "BP_PF_clients" ADD CONSTRAINT "BP_PF_clients_entiteId_fkey"
    FOREIGN KEY ("entiteId") REFERENCES "BP_PF_entites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "BP_PF_projects" ADD CONSTRAINT "BP_PF_projects_entiteId_fkey"
    FOREIGN KEY ("entiteId") REFERENCES "BP_PF_entites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Entité racine pour les données existantes (seulement si aucune entité n'existe).
INSERT INTO "BP_PF_entites" ("id", "code", "nom", "type", "chemin", "niveau")
SELECT r.id, 'GROUPE', 'Groupe', 'GROUPE', '/' || r.id || '/', 0
FROM (SELECT gen_random_uuid() AS id) r
WHERE NOT EXISTS (SELECT 1 FROM "BP_PF_entites");

-- Clients et projets sans entité : rattachés à la racine (si elle est unique) ; un
-- projet suit l'entité de son client.
UPDATE "BP_PF_clients" SET "entiteId" = (SELECT id FROM "BP_PF_entites" WHERE "parentId" IS NULL)
WHERE "entiteId" IS NULL AND (SELECT count(*) FROM "BP_PF_entites" WHERE "parentId" IS NULL) = 1;
UPDATE "BP_PF_projects" p SET "entiteId" = c."entiteId"
FROM "BP_PF_clients" c WHERE p."clientId" = c.id AND p."entiteId" IS NULL;
UPDATE "BP_PF_projects" SET "entiteId" = (SELECT id FROM "BP_PF_entites" WHERE "parentId" IS NULL)
WHERE "entiteId" IS NULL AND (SELECT count(*) FROM "BP_PF_entites" WHERE "parentId" IS NULL) = 1;

-- Utilisateurs existants : rattachés à la racine avec écriture dans tout le groupe,
-- ce qui conserve exactement leur accès d'avant. Les administrateurs système restent
-- sans entité (administration de toute la plateforme). Un compte sans entité qui
-- n'est pas administrateur système n'a accès à aucun dossier.
UPDATE "BP_PF_users" SET "entiteId" = (SELECT id FROM "BP_PF_entites" WHERE "parentId" IS NULL), "porteeEcriture" = 'groupe'
WHERE "entiteId" IS NULL AND "role"::text <> 'system_admin'
  AND (SELECT count(*) FROM "BP_PF_entites" WHERE "parentId" IS NULL) = 1;

-- Catégorie « ia » des paramètres : certaines bases (dont la production historique)
-- limitent les catégories par une contrainte ; elle est étendue si elle existe.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BP_PF_app_configuration_category_check') THEN
    ALTER TABLE "BP_PF_app_configuration" DROP CONSTRAINT "BP_PF_app_configuration_category_check";
    ALTER TABLE "BP_PF_app_configuration" ADD CONSTRAINT "BP_PF_app_configuration_category_check"
      CHECK (category = ANY (ARRAY['branding'::text, 'theme'::text, 'behavior'::text, 'scoring'::text, 'screens'::text, 'ia'::text]));
  END IF;
END $$;

-- Paramètres de l'IA documentaire (les clés d'API restent des variables d'environnement).
INSERT INTO "BP_PF_app_configuration" ("key", "value", "type", "category", "description", "isPublic", "metadata", "updatedAt")
VALUES
  ('IA_FOURNISSEUR', 'anthropic', 'enum', 'ia',
   'Fournisseur de l''IA : anthropic (Claude, lit les PDF), openai, azure_openai, compatible_openai (Mistral, modèle interne…). Clé d''API : variable d''environnement ANTHROPIC_API_KEY ou IA_CLE_API.',
   false, '["anthropic","openai","azure_openai","compatible_openai"]', CURRENT_TIMESTAMP),
  ('IA_MODELE', '', 'string', 'ia',
   'Modèle utilisé (vide = claude-opus-5-5 pour Anthropic ; obligatoire pour les autres fournisseurs)',
   false, NULL, CURRENT_TIMESTAMP),
  ('IA_URL_BASE', '', 'string', 'ia',
   'Adresse de l''API (vide = adresse officielle ; obligatoire pour Azure OpenAI et les API compatibles, ex. https://banque.openai.azure.com/openai/v1)',
   false, NULL, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
