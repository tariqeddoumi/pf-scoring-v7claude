-- Signalétique client project finance : code client T24, groupe d'affaires,
-- identification légale, solidité et expérience du sponsor, risque et conformité,
-- provenance des données (rapatriement T24 ou saisie manuelle).
-- Additive et rejouable : la version en service ignore ces colonnes.

CREATE TABLE IF NOT EXISTS "BP_PF_groupes_affaires" (
  "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
  "code"             TEXT,
  "nom"              TEXT NOT NULL,
  "paysSiege"        TEXT,
  "secteurPrincipal" TEXT,
  "ratingGroupe"     TEXT,
  "entiteId"         UUID,
  "sourceDonnees"    TEXT NOT NULL DEFAULT 'MANUELLE',
  "dateSynchroT24"   TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BP_PF_groupes_affaires_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BP_PF_groupes_affaires_entiteId_code_key" ON "BP_PF_groupes_affaires" ("entiteId", "code");
CREATE INDEX IF NOT EXISTS "BP_PF_groupes_affaires_entiteId_idx" ON "BP_PF_groupes_affaires" ("entiteId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BP_PF_groupes_affaires_entiteId_fkey') THEN
    ALTER TABLE "BP_PF_groupes_affaires" ADD CONSTRAINT "BP_PF_groupes_affaires_entiteId_fkey"
      FOREIGN KEY ("entiteId") REFERENCES "BP_PF_entites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "BP_PF_clients"
  ADD COLUMN IF NOT EXISTS "codeClientT24"           TEXT,
  ADD COLUMN IF NOT EXISTS "ice"                     TEXT,
  ADD COLUMN IF NOT EXISTS "registreCommerce"        TEXT,
  ADD COLUMN IF NOT EXISTS "identifiantFiscal"       TEXT,
  ADD COLUMN IF NOT EXISTS "dateCreationSociete"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "groupeAffairesId"        UUID,
  ADD COLUMN IF NOT EXISTS "roleGroupe"              TEXT,
  ADD COLUMN IF NOT EXISTS "fondsPropres"            DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "exerciceReference"       INTEGER,
  ADD COLUMN IF NOT EXISTS "experienceSecteurAnnees" INTEGER,
  ADD COLUMN IF NOT EXISTS "projetsSimilaires"       INTEGER,
  ADD COLUMN IF NOT EXISTS "notationExterne"         TEXT,
  ADD COLUMN IF NOT EXISTS "agenceNotation"          TEXT,
  ADD COLUMN IF NOT EXISTS "classificationBAM"       TEXT,
  ADD COLUMN IF NOT EXISTS "niveauRisqueLBC"         TEXT,
  ADD COLUMN IF NOT EXISTS "ppe"                     BOOLEAN,
  ADD COLUMN IF NOT EXISTS "dateRevueKYC"            TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sourceDonnees"           TEXT NOT NULL DEFAULT 'MANUELLE',
  ADD COLUMN IF NOT EXISTS "champsT24"               JSONB,
  ADD COLUMN IF NOT EXISTS "dateSynchroT24"          TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "BP_PF_clients_entiteId_codeClientT24_key" ON "BP_PF_clients" ("entiteId", "codeClientT24");
CREATE INDEX IF NOT EXISTS "BP_PF_clients_groupeAffairesId_idx" ON "BP_PF_clients" ("groupeAffairesId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BP_PF_clients_groupeAffairesId_fkey') THEN
    ALTER TABLE "BP_PF_clients" ADD CONSTRAINT "BP_PF_clients_groupeAffairesId_fkey"
      FOREIGN KEY ("groupeAffairesId") REFERENCES "BP_PF_groupes_affaires" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Catégorie de paramétrage « t24 » (la contrainte de catégorie existe sur certaines bases).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BP_PF_app_configuration_category_check') THEN
    ALTER TABLE "BP_PF_app_configuration" DROP CONSTRAINT "BP_PF_app_configuration_category_check";
    ALTER TABLE "BP_PF_app_configuration" ADD CONSTRAINT "BP_PF_app_configuration_category_check"
      CHECK (category = ANY (ARRAY['branding'::text, 'theme'::text, 'behavior'::text, 'scoring'::text, 'screens'::text, 'ia'::text, 't24'::text]));
  END IF;
END $$;

-- Connexion au système central T24. Les identifiants restent des variables
-- d'environnement (T24_JETON, ou T24_UTILISATEUR et T24_MOT_DE_PASSE).
INSERT INTO "BP_PF_app_configuration" ("key", "value", "type", "category", "description", "isPublic", "metadata", "updatedAt")
VALUES
  ('T24_MODE', 'desactive', 'enum', 't24',
   'Rapatriement de la signalétique depuis T24 : desactive (saisie manuelle seule), api (appel du service de la banque), simulation (données fictives de démonstration, jamais en production).',
   false, '["desactive","api","simulation"]', CURRENT_TIMESTAMP),
  ('T24_URL_BASE', '', 'string', 't24',
   'Adresse du service exposant T24 (Temenos Transact API / IRIS ou bus de services de la banque), ex. https://esb.banque.ma/t24/api/v1',
   false, NULL, CURRENT_TIMESTAMP),
  ('T24_CHEMIN_CLIENT', '/party/customers/{code}', 'string', 't24',
   'Chemin de lecture d''un client ; {code} est remplacé par le code client T24.',
   false, NULL, CURRENT_TIMESTAMP),
  ('T24_CHEMIN_GROUPE', '/party/customerGroups/{code}', 'string', 't24',
   'Chemin de lecture d''un groupe d''affaires ; {code} est remplacé par le code groupe.',
   false, NULL, CURRENT_TIMESTAMP),
  ('T24_CORRESPONDANCE', '', 'json', 't24',
   'Correspondance facultative des champs : {"champ de l''outil": "chemin.dans.la.reponse"}, ex. {"ice": "body.legalId", "gestionnaire": "body.accountOfficer"}. Vide = reconnaissance des noms T24 usuels.',
   false, NULL, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
