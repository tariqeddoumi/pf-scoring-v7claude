import type { Perimetre } from "./perimetre";

/**
 * Cloisonnement des données par entité, appliqué à TOUTES les requêtes Prisma sur
 * les dossiers (clients, projets, évaluations et ce qui en dépend). Placé dans le
 * client de base de données plutôt que dans chaque route : une route oubliée ou
 * ajoutée plus tard ne peut pas exposer les dossiers d'une autre banque (OWASP API1
 * « Broken Object Level Authorization »).
 *
 * - Lectures : filtre sur les entités visibles (l'entité et sa descendance).
 * - Modifications et suppressions : filtre sur les entités où l'on peut écrire ; un
 *   dossier visible en consultation seulement est introuvable pour une modification.
 * - Créations : l'entité du nouveau client est celle de l'utilisateur (ou une entité
 *   où il peut écrire) ; un projet prend l'entité de son client ; une évaluation,
 *   une pièce, une réponse… n'est créée que sur un dossier où l'on peut écrire.
 */

type Filtre = (ids: string[]) => Record<string, unknown>;

const parProjet: Filtre = (ids) => ({ project: { entiteId: { in: ids } } });
const parEvaluation: Filtre = (ids) => ({ evaluation: { project: { entiteId: { in: ids } } } });
const parWorkflow: Filtre = (ids) => ({ workflow: { evaluation: { project: { entiteId: { in: ids } } } } });

/** Modèles cloisonnés et chemin jusqu'à l'entité. */
export const FILTRES: Record<string, Filtre> = {
  Client: (ids) => ({ entiteId: { in: ids } }),
  GroupeAffaires: (ids) => ({ entiteId: { in: ids } }),
  Project: (ids) => ({ entiteId: { in: ids } }),
  ScoringEvaluation: parProjet,
  Evaluation: parProjet,
  ScoringEvaluationAnswer: parEvaluation,
  ScoringDocument: parEvaluation,
  ScoringWorkflow: parEvaluation,
  ScoringOverride: parEvaluation,
  ScoringEvaluationNodeResult: parEvaluation,
  ScoringWorkflowStep: parWorkflow,
  ScoringDecision: parWorkflow,
  ScoringComment: parWorkflow,
  ScoringApproval: parWorkflow,
  Scoring: parProjet,
  // Journaux : une entrée liée à un dossier suit le dossier ; les entrées générales
  // (paramétrage de la grille) restent visibles.
  ScoringChangeLog: (ids) => ({ OR: [{ evaluationId: null }, { evaluation: { project: { entiteId: { in: ids } } } }] }),
  // Journal d'audit : par dossier, sinon par l'entité de l'auteur.
  AuditLog: (ids) => ({ OR: [{ project: { entiteId: { in: ids } } }, { projectId: null, user: { entiteId: { in: ids } } }] }),
};

export const LECTURES = new Set([
  "findMany", "findFirst", "findFirstOrThrow", "findUnique", "findUniqueOrThrow",
  "count", "aggregate", "groupBy",
]);
export const MODIFICATIONS = new Set(["update", "updateMany", "delete", "deleteMany", "upsert"]);
export const CREATIONS = new Set(["create", "createMany", "createManyAndReturn"]);

export class HorsPerimetreError extends Error {
  readonly code = "HORS_PERIMETRE";
  constructor(message = "Ce dossier n'appartient pas à votre périmètre.") {
    super(message);
    this.name = "HorsPerimetreError";
  }
}

/** Ajoute le filtre d'entité au « where » sans toucher aux champs uniques (findUnique). */
export function restreindre(where: unknown, filtre: Record<string, unknown>): Record<string, unknown> {
  const w = (where ?? {}) as Record<string, unknown>;
  const and = w.AND === undefined ? [] : Array.isArray(w.AND) ? w.AND : [w.AND];
  return { ...w, AND: [...and, filtre] };
}

/** Identifiant référencé par une donnée de création (champ direct ou connect). */
export function reference(data: Record<string, unknown>, champ: string, relation: string): string | null {
  const direct = data[champ];
  if (typeof direct === "string") return direct;
  const rel = data[relation] as { connect?: { id?: string } } | undefined;
  return rel?.connect?.id ?? null;
}

/** Arguments réécrits pour une lecture ou une modification sur un modèle cloisonné. */
export function argumentsFiltres(
  modele: string,
  operation: string,
  args: Record<string, unknown> | undefined,
  p: Perimetre
): Record<string, unknown> | undefined {
  const filtre = FILTRES[modele];
  if (!filtre || p.tout) return args;
  const a = { ...(args ?? {}) };
  if (LECTURES.has(operation)) {
    a.where = restreindre(a.where, filtre(p.lecture));
  } else if (MODIFICATIONS.has(operation)) {
    a.where = restreindre(a.where, filtre(p.ecriture));
  }
  return a;
}
