-- Parametrization extensions
-- Extends AppConfiguration to support new config domains:
--   * category: add 'scoring' (sectorial toggle, per-domain granularity) and 'screens' (dynamic forms)
--   * type:     add 'json' (for the per-domain granularity map)
-- Non-breaking: existing rows/values remain valid; constraints are widened, never narrowed.

-- Inline CHECK constraints created in 20260613000000_add_v9_tables get the
-- auto-generated names <table>_<column>_check. Drop and recreate them widened.

ALTER TABLE "BP_PF_app_configuration"
  DROP CONSTRAINT IF EXISTS "BP_PF_app_configuration_category_check";
ALTER TABLE "BP_PF_app_configuration"
  ADD CONSTRAINT "BP_PF_app_configuration_category_check"
  CHECK (category IN ('branding', 'theme', 'behavior', 'scoring', 'screens'));

ALTER TABLE "BP_PF_app_configuration"
  DROP CONSTRAINT IF EXISTS "BP_PF_app_configuration_type_check";
ALTER TABLE "BP_PF_app_configuration"
  ADD CONSTRAINT "BP_PF_app_configuration_type_check"
  CHECK (type IN ('string', 'color', 'url', 'enum', 'bool', 'number', 'json'));

-- Seed the new parametrization keys (idempotent). The seed script (seed-v9.ts)
-- also upserts these, but inserting here makes the DDL migration self-sufficient.
INSERT INTO "BP_PF_app_configuration" (key, value, type, category, description, "isPublic", "updatedAt")
VALUES
  ('SCORING_SECTORIAL_ENABLED', 'false', 'bool', 'scoring',
   'Réintégrer le calibrage sectoriel dans le score global (ON = poids sectoriels + red flags/no-go + stress + malus/bonus ; OFF = socle V7++ seul)',
   false, CURRENT_TIMESTAMP),
  ('SCORING_DOMAIN_GRANULARITY', '{}', 'json', 'scoring',
   'Niveau de saisie du score par domaine : map { domainCode: "DOMAIN"|"CRITERION"|"SUB_CRITERION" }. Vide = niveau par défaut du nœud.',
   false, CURRENT_TIMESTAMP),
  ('SCREENS_DYNAMIC_FORMS_ENABLED', 'false', 'bool', 'screens',
   'Rendre les écrans Signalétique/Projet à partir de la configuration de champs (FieldConfiguration) au lieu du formulaire codé en dur',
   true, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;
