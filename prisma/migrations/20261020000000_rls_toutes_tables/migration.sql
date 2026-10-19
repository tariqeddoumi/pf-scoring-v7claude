-- Sécurité par ligne (RLS) sur toutes les tables de l'application.
--
-- Constat du diagnostic (octobre 2026) : 28 tables BP_PF_ n'avaient pas la RLS activée,
-- dont les actionnaires et bénéficiaires effectifs des clients, les entités, les groupes
-- d'affaires et les évaluations : elles étaient lisibles et modifiables par l'API REST de
-- Supabase avec la clé publique (anon), sans passer par l'application.
--
-- L'application accède à la base par Prisma avec le rôle propriétaire des tables, qui
-- n'est pas soumis à la RLS (elle n'est pas forcée) : activer la RLS sans politique ferme
-- l'accès direct par l'API REST sans rien changer au fonctionnement de l'application.
-- Rejouable : la boucle couvre aussi les tables ajoutées plus tard.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'BP\_PF\_%' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

-- Index présents dans le schéma Prisma mais absents de la base de production.
CREATE INDEX IF NOT EXISTS "BP_PF_bank_statuses_isActive_idx" ON "BP_PF_bank_statuses" ("isActive");
CREATE INDEX IF NOT EXISTS "BP_PF_client_segments_isActive_idx" ON "BP_PF_client_segments" ("isActive");
CREATE INDEX IF NOT EXISTS "BP_PF_client_types_isActive_idx" ON "BP_PF_client_types" ("isActive");
CREATE INDEX IF NOT EXISTS "BP_PF_compliance_statuses_isActive_idx" ON "BP_PF_compliance_statuses" ("isActive");
CREATE INDEX IF NOT EXISTS "BP_PF_internal_ratings_isActive_idx" ON "BP_PF_internal_ratings" ("isActive");
CREATE INDEX IF NOT EXISTS "BP_PF_kyc_statuses_isActive_idx" ON "BP_PF_kyc_statuses" ("isActive");
CREATE INDEX IF NOT EXISTS "BP_PF_legal_forms_isActive_idx" ON "BP_PF_legal_forms" ("isActive");

-- Un compte qui a créé des projets ne s'efface pas : l'effacement supprimait en cascade
-- ses projets, leurs évaluations, crédits et scorings. Les comptes se désactivent
-- (isActive = false, deletedAt) ; le nom de la contrainte peut différer selon la base.
DO $$
DECLARE c text;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint
    WHERE conrelid = '"BP_PF_projects"'::regclass AND contype = 'f'
      AND confrelid = '"BP_PF_users"'::regclass AND confdeltype = 'c' LOOP
    EXECUTE format('ALTER TABLE "BP_PF_projects" DROP CONSTRAINT %I', c);
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BP_PF_projects_creePar_fkey') THEN
    ALTER TABLE "BP_PF_projects" ADD CONSTRAINT "BP_PF_projects_creePar_fkey"
      FOREIGN KEY ("creePar") REFERENCES "BP_PF_users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
