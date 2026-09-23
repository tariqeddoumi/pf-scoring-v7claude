-- Unification des tables d'évaluation.
--
-- CONTEXTE
-- Deux tables d'évaluation coexistaient : BP_PF_v7pp_evaluations (modèle Evaluation)
-- et BP_PF_v7pp_scoring_evaluations (modèle ScoringEvaluation). Le parcours de saisie
-- écrivait dans la seconde tandis que la liste et la fiche lisaient la première : une
-- évaluation terminée renvoyait « non trouvée » et n'apparaissait jamais dans la liste.
--
-- BP_PF_v7pp_scoring_evaluations est retenue comme table unique. Elle porte la version
-- de modèle utilisée (reproductibilité de la note), les réponses, les résultats par nœud,
-- la trace de calcul et le circuit de validation.
--
-- CETTE MIGRATION EST ADDITIVE ET RÉVERSIBLE.
-- Elle ajoute à la table cible les colonnes de décision et d'archivage qui n'existaient
-- que sur la table héritée, afin de ne perdre aucune fonctionnalité de l'interface
-- (l'écran /evaluations propose un filtre « archivées » et une action d'archivage).
-- Aucune donnée n'est déplacée ni supprimée : la table héritée est vide (0 ligne).

ALTER TABLE "BP_PF_v7pp_scoring_evaluations"
  ADD COLUMN IF NOT EXISTS "rejectedAt"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "isArchived"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "archivedAt"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "archivedBy"      TEXT;

CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_evaluations_isArchived_idx"
  ON "BP_PF_v7pp_scoring_evaluations" ("isArchived");

-- RETOUR ARRIÈRE
--   DROP INDEX IF EXISTS "BP_PF_v7pp_scoring_evaluations_isArchived_idx";
--   ALTER TABLE "BP_PF_v7pp_scoring_evaluations"
--     DROP COLUMN IF EXISTS "rejectedAt",
--     DROP COLUMN IF EXISTS "rejectionReason",
--     DROP COLUMN IF EXISTS "isArchived",
--     DROP COLUMN IF EXISTS "archivedAt",
--     DROP COLUMN IF EXISTS "archivedBy";

-- NON INCLUS VOLONTAIREMENT : la suppression de la table héritée
-- BP_PF_v7pp_evaluations. Elle est vide et n'est plus lue par aucun écran, mais
-- lib/db-scoring.ts la référence encore pour trois routes d'API qu'aucune interface
-- n'appelle. Sa suppression fera l'objet d'une décision distincte.
