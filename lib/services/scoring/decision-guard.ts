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
  /** Critères obligatoires sans donnée réelle. */
  donneesObligatoiresManquantes: string[];
  /** Règles bloquantes non évaluables. */
  reglesCritiquesNonEvaluees: string[];
  /** Calibrage sectoriel actif sans profil pour le secteur du projet. */
  profilSectorielManquant: boolean;
  /** Trace absente ou illisible : impossible de démontrer l'absence de blocage. */
  traceIlisible: boolean;
}

/** Lit les blocages consignés dans la trace du dernier calcul (summaryJson). */
export function lireBlocages(summaryJson: string | null | undefined): BlocagesTrace {
  const vide: BlocagesTrace = {
    blockingRuleCodes: [],
    publicationBlocked: false,
    donneesObligatoiresManquantes: [],
    reglesCritiquesNonEvaluees: [],
    profilSectorielManquant: false,
    traceIlisible: true,
  };
  if (!summaryJson) return vide;
  try {
    const t = JSON.parse(summaryJson);
    if (!t || typeof t !== "object") throw new Error("trace invalide");
    const liste = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
    return {
      blockingRuleCodes: liste(t.blockingRuleCodes),
      publicationBlocked: t.publicationBlocked === true,
      donneesObligatoiresManquantes: liste(t.donneesObligatoiresManquantes),
      reglesCritiquesNonEvaluees: liste(t.reglesCritiquesNonEvaluees),
      profilSectorielManquant: t.profilSectorielManquant === true,
      traceIlisible: false,
    };
  } catch {
    return vide;
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
  motifs.push(...motifsIncompletude(blocages));
  if (evaluation.analystId && evaluation.analystId === decideurId) {
    motifs.push("L'analyste du dossier ne peut pas valider sa propre analyse.");
  }
  if (ctx.soumisPar && ctx.soumisPar === decideurId) {
    motifs.push("L'auteur de la soumission ne peut pas rendre la décision.");
  }
  return motifs;
}

function motifsIncompletude(b: BlocagesTrace): string[] {
  const motifs: string[] = [];
  if (b.donneesObligatoiresManquantes.length > 0) {
    motifs.push(`Donnée(s) obligatoire(s) manquante(s) : ${b.donneesObligatoiresManquantes.join(", ")}.`);
  }
  if (b.reglesCritiquesNonEvaluees.length > 0) {
    motifs.push(`Règle(s) critique(s) non évaluable(s) : ${b.reglesCritiquesNonEvaluees.join(", ")}.`);
  }
  if (b.profilSectorielManquant) {
    motifs.push("Aucun profil sectoriel ne correspond au secteur du projet : choisissez un secteur de la liste.");
  }
  return motifs;
}

/**
 * Préconditions de soumission : un calcul lisible, aucune donnée obligatoire manquante,
 * aucune règle critique non évaluée. L'aperçu reste disponible pendant la saisie.
 */
export function motifsRefusSoumission(summaryJson: string | null | undefined): string[] {
  const b = lireBlocages(summaryJson);
  if (b.traceIlisible) return ["La note n'est pas calculée : relancez le calcul."];
  return motifsIncompletude(b);
}

export interface DecisionAnterieure {
  decidedBy: string;
  requiresHigherApproval: boolean;
  /** Rôle de l'auteur de la décision antérieure. */
  role: string | null | undefined;
}

const niveau = (role: string | null | undefined) => ROLE_HIERARCHY[role as UserRole] ?? 0;

const NIVEAU_MAX = Math.max(...Object.values(ROLE_HIERARCHY));

/**
 * Délégation : lorsqu'une décision demande une approbation supérieure, seule une
 * personne distincte peut clore le circuit :
 * - une décision favorable exige un rang strictement supérieur — ou, si l'avis
 *   précédent vient déjà du rang le plus élevé, une autre personne de ce rang ;
 * - un refus exige un rang au moins égal (refuser ne lève aucune exigence).
 * Sans cette nuance, un administrateur système demandant une approbation supérieure
 * bloquait le dossier à jamais (personne au-dessus de lui).
 * Renvoie le motif de refus, ou null.
 */
export function motifRefusDelegation(
  derniere: DecisionAnterieure | null | undefined,
  decideurId: string,
  decideurRole: string,
  decision: string = "APPROVE"
): string | null {
  if (!derniere || !derniere.requiresHigherApproval) return null;
  if (derniere.decidedBy === decideurId) {
    return "Une approbation supérieure est demandée : elle ne peut pas venir de l'auteur de l'avis précédent.";
  }
  const moi = niveau(decideurRole);
  const avant = niveau(derniere.role);
  const suffisant = estFavorable(decision) ? moi > avant || (avant === NIVEAU_MAX && moi === NIVEAU_MAX) : moi >= avant;
  return suffisant ? null : "Une approbation supérieure est demandée : votre niveau de délégation ne suffit pas.";
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

/**
 * Matrice de délégation par montant, paramétrée par la banque (clé de configuration
 * `delegation.matrice`) : liste de paliers { montantMax (MAD, null = sans limite),
 * roleMinimum }. Renvoie le rôle minimum exigé pour un montant, ou null si la matrice
 * est vide ou illisible (aucune contrainte de montant n'est alors inventée).
 */
export interface PalierDelegation {
  montantMax: number | null;
  roleMinimum: string;
}

export function lireMatriceDelegation(brut: string | null | undefined): PalierDelegation[] {
  if (!brut) return [];
  try {
    const v = JSON.parse(brut);
    if (!Array.isArray(v)) return [];
    return v
      .filter((p) => p && typeof p.roleMinimum === "string" && p.roleMinimum in ROLE_HIERARCHY)
      .map((p) => ({ montantMax: typeof p.montantMax === "number" ? p.montantMax : null, roleMinimum: p.roleMinimum }))
      .sort((a, b) => (a.montantMax ?? Infinity) - (b.montantMax ?? Infinity));
  } catch {
    return [];
  }
}

export function roleRequisPourMontant(matrice: PalierDelegation[], montant: number | null | undefined): string | null {
  if (matrice.length === 0 || montant === null || montant === undefined) return null;
  const palier = matrice.find((p) => p.montantMax === null || montant <= p.montantMax);
  return palier?.roleMinimum ?? matrice[matrice.length - 1].roleMinimum;
}

/** Le décideur a-t-il la délégation pour ce montant ? */
export function delegationSuffisante(roleDecideur: string, roleRequis: string | null): boolean {
  return roleRequis === null || niveau(roleDecideur) >= niveau(roleRequis);
}
