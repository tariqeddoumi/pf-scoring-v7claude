import { ROLE_HIERARCHY, type UserRole } from "@/lib/permissions";

/**
 * Contrôles communs à toute décision ou validation favorable.
 *
 * Plusieurs routes pouvaient valider ou approuver un dossier en ne vérifiant que son
 * statut : une règle rédhibitoire (NO_GO) déclenchée, une demande d'approbation
 * supérieure ou un analyste qui valide sa propre analyse n'empêchaient rien, et une
 * recommandation REJECT pouvait mettre le projet « approuvé ». Toutes les routes de
 * décision appellent désormais ces fonctions, testées sans base de données.
 */

export const DECISIONS_FAVORABLES = ["APPROVE", "APPROVE_WITH_CONDITIONS", "CONDITIONAL_APPROVAL"] as const;
export const DECISIONS_ADMISES = [...DECISIONS_FAVORABLES, "REJECT"] as const;

export function estFavorable(decision: string | null | undefined): boolean {
  return (DECISIONS_FAVORABLES as readonly string[]).includes(String(decision));
}

export interface BlocagesTrace {
  blockingRuleCodes: string[];
  publicationBlocked: boolean;
  /** Trace absente ou illisible : impossible de démontrer l'absence de blocage. */
  traceIlisible: boolean;
}

/** Lit les blocages consignés dans la trace du dernier calcul (summaryJson). */
export function lireBlocages(summaryJson: string | null | undefined): BlocagesTrace {
  if (!summaryJson) return { blockingRuleCodes: [], publicationBlocked: false, traceIlisible: true };
  try {
    const t = JSON.parse(summaryJson);
    if (!t || typeof t !== "object") throw new Error("trace invalide");
    const codes = Array.isArray(t.blockingRuleCodes) ? t.blockingRuleCodes.map(String).filter(Boolean) : [];
    return { blockingRuleCodes: codes, publicationBlocked: t.publicationBlocked === true, traceIlisible: false };
  } catch {
    return { blockingRuleCodes: [], publicationBlocked: false, traceIlisible: true };
  }
}

export interface EvaluationADecider {
  status: string;
  finalScore: number | null;
  summaryJson: string | null;
  analystId: string | null;
}

export interface ContexteDecision {
  evaluation: EvaluationADecider;
  /** Auteur de la décision ou de la validation. */
  decideurId: string;
  /** Auteur de la soumission, s'il est connu (circuit de validation). */
  soumisPar?: string | null;
  /** Statuts d'évaluation à partir desquels la décision est possible. */
  statutsAdmis?: string[];
}

/**
 * Motifs qui interdisent une décision FAVORABLE. Liste vide : la décision est possible.
 * Un refus (REJECT) n'est pas soumis à ces contrôles.
 */
export function motifsRefusDecisionFavorable(ctx: ContexteDecision): string[] {
  const { evaluation, decideurId } = ctx;
  const statuts = ctx.statutsAdmis ?? ["soumis"];
  const motifs: string[] = [];

  if (!statuts.includes(String(evaluation.status))) {
    motifs.push(`L'évaluation doit être soumise (statut actuel : « ${evaluation.status} »).`);
  }
  if (evaluation.finalScore === null || evaluation.finalScore === undefined) {
    motifs.push("La note n'est pas calculée sur les dernières réponses : relancez le calcul.");
  }
  const blocages = lireBlocages(evaluation.summaryJson);
  if (blocages.traceIlisible) {
    motifs.push("La trace du calcul est absente ou illisible : impossible de vérifier les règles rédhibitoires.");
  }
  if (blocages.blockingRuleCodes.length > 0) {
    motifs.push(`Règle(s) rédhibitoire(s) déclenchée(s) : ${blocages.blockingRuleCodes.join(", ")}.`);
  }
  if (blocages.publicationBlocked) {
    motifs.push("Une règle interdit la publication de cette évaluation.");
  }
  if (evaluation.analystId && evaluation.analystId === decideurId) {
    motifs.push("L'analyste du dossier ne peut pas valider sa propre analyse.");
  }
  if (ctx.soumisPar && ctx.soumisPar === decideurId) {
    motifs.push("L'auteur de la soumission ne peut pas rendre la décision.");
  }
  return motifs;
}

export interface DecisionAnterieure {
  decidedBy: string;
  requiresHigherApproval: boolean;
  /** Rôle de l'auteur de la décision antérieure. */
  role: string | null | undefined;
}

const niveau = (role: string | null | undefined) => ROLE_HIERARCHY[role as UserRole] ?? 0;

/**
 * Délégation : lorsqu'une décision demande une approbation supérieure, seule une
 * personne distincte, de rang strictement supérieur, peut clore le circuit.
 * Renvoie le motif de refus, ou null.
 */
export function motifRefusDelegation(
  derniere: DecisionAnterieure | null | undefined,
  decideurId: string,
  decideurRole: string
): string | null {
  if (!derniere || !derniere.requiresHigherApproval) return null;
  if (derniere.decidedBy === decideurId) {
    return "Une approbation supérieure est demandée : elle ne peut pas venir de l'auteur de l'avis précédent.";
  }
  if (niveau(decideurRole) <= niveau(derniere.role)) {
    return "Une approbation supérieure est demandée : votre niveau de délégation ne suffit pas.";
  }
  return null;
}

/**
 * Statut du circuit après une décision. Une décision favorable qui demande elle-même
 * une approbation supérieure laisse le dossier en attente (REVIEWED), jamais APPROVED.
 */
export function statutApresDecision(decision: string, requiertApprobationSuperieure: boolean): string {
  if (decision === "REJECT") return "REJECTED";
  if (estFavorable(decision)) return requiertApprobationSuperieure ? "REVIEWED" : "APPROVED";
  throw new Error(`Type de décision inconnu : ${decision}`);
}
