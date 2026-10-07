/**
 * Circuit d'une dérogation (ScoringOverride).
 *
 * Le statut se changeait librement, et l'approbateur pouvait être fourni dans la
 * requête — y compris l'auteur de la proposition lui-même. Transitions admises :
 * PENDING → APPROVED | REJECTED, APPROVED → REVERTED. L'approbateur est toujours
 * l'utilisateur connecté et doit être distinct de l'auteur de la proposition.
 */
export const TRANSITIONS_DEROGATION: Record<string, string[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["REVERTED"],
  REJECTED: [],
  REVERTED: [],
};

export function motifRefusTransitionDerogation(params: {
  statutActuel: string;
  cible: string;
  proposePar: string;
  utilisateur: string;
}): string | null {
  const { statutActuel, cible, proposePar, utilisateur } = params;
  if (!(TRANSITIONS_DEROGATION[statutActuel] ?? []).includes(cible)) {
    return `Transition impossible : ${statutActuel} → ${cible}.`;
  }
  if (cible === "APPROVED" && proposePar === utilisateur) {
    return "L'auteur d'une dérogation ne peut pas l'approuver lui-même.";
  }
  return null;
}

/** Une dérogation APPROUVÉE ou ANNULÉE change la note : le calcul doit être refait. */
export function exigeRecalcul(cible: string): boolean {
  return cible === "APPROVED" || cible === "REVERTED";
}
