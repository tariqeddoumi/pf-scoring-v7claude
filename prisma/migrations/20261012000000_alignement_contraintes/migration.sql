-- Alignement des contraintes de la base sur le schéma Prisma (diagnostic du 12/10/2026).
--
-- 16 colonnes sont obligatoires pour l'application (Prisma) mais acceptaient NULL en
-- base : une valeur NULL insérée hors application (import, SQL manuel) aurait fait
-- échouer toute lecture de la ligne (« Error converting field … non-nullable »). Aucune
-- valeur NULL n'existe aujourd'hui (vérifié) ; la contrainte n'est posée que si c'est
-- toujours vrai au moment de la migration. Rejouable.
--
-- Inversement, BP_PF_v7pp_evaluations.analystId était NOT NULL en base alors que la
-- relation prévoit de la mettre à NULL à la suppression de l'analyste : la suppression
-- d'un utilisateur ayant une évaluation historique aurait échoué.

DO $$
DECLARE
  cible record;
  nuls bigint;
BEGIN
  FOR cible IN SELECT * FROM (VALUES
    ('BP_PF_audit_logs', 'details'),
    ('BP_PF_clients', 'status'),
    ('BP_PF_countries', 'riskScore'),
    ('BP_PF_criteria', 'isActive'),
    ('BP_PF_criteria', 'type'),
    ('BP_PF_domains', 'isActive'),
    ('BP_PF_domains', 'weight'),
    ('BP_PF_evaluation_answers', 'answerType'),
    ('BP_PF_form_presets', 'fieldIds'),
    ('BP_PF_projects', 'description'),
    ('BP_PF_projects', 'devise'),
    ('BP_PF_projects', 'secteur'),
    ('BP_PF_projects', 'status'),
    ('BP_PF_scorings', 'composantes'),
    ('BP_PF_scorings', 'grade'),
    ('BP_PF_v7pp_scoring_nodes', 'isScoringLeaf')
  ) AS v(t, c)
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = cible.t AND column_name = cible.c AND is_nullable = 'YES') THEN
      EXECUTE format('SELECT count(*) FROM %I WHERE %I IS NULL', cible.t, cible.c) INTO nuls;
      IF nuls = 0 THEN
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET NOT NULL', cible.t, cible.c);
      ELSE
        RAISE NOTICE '% valeur(s) NULL dans %.% : contrainte non posée, à corriger d''abord', nuls, cible.t, cible.c;
      END IF;
    END IF;
  END LOOP;
END $$;

ALTER TABLE "BP_PF_v7pp_evaluations" ALTER COLUMN "analystId" DROP NOT NULL;
