/**
 * Visibilité des scores.
 *
 * Un analyste qui voit le score évoluer à chaque réponse peut ajuster ses réponses
 * pour obtenir une note élevée. Les scores, notes, contributions et avis calculés ne
 * sont donc visibles que des rôles qui administrent le modèle ou décident :
 * administrateur système, administrateur du modèle, responsable des risques, membre
 * du comité. Pour les autres (analyste, auditeur, lecture seule), ils sont retirés
 * des réponses de l'API — pas seulement masqués à l'écran.
 */
export const ROLES_VOIENT_SCORES = ["system_admin", "scoring_admin", "risk_manager", "committee_member"] as const;

export function peutVoirScores(role: string | null | undefined): boolean {
  return (ROLES_VOIENT_SCORES as readonly string[]).includes(String(role));
}

/**
 * Clés retirées des réponses. Restent visibles : les données saisies ou mesurées
 * (DSCR, montants, ratios), les bornes d'échelle des critères, les blocages et
 * données manquantes (qui disent quoi compléter, pas quelle note en résulte).
 */
export const CLES_SCORE = new Set([
  "score",
  "scores",
  "rawScore",
  "weightedScore",
  "normalizedScore",
  "finalScore",
  "scoreGlobal",
  "globalScore",
  "scoreMoyen",
  "nodeScore",
  "nodeScores",
  "baseScore",
  "adjustedScore",
  "manualScore",
  "originalScore",
  "overriddenScore",
  "scoreCalcule",
  "scoreRetenu",
  "rating",
  "grade",
  "riskRating",
  "ratingSource",
  "ratingWarning",
  "recommendation",
  "malusTotal",
  "probabilityOfDefault",
  "distributionNotes",
  "pointsNotes",
  "encoursNote",
  "summaryJson",
  "triggeredRulesJson",
  "traceJson",
  "ruleImpactJson",
  "ruleImpacts",
  "derogations",
]);

/** Copie de la valeur sans les clés de score, à toute profondeur. */
export function masquerScores<T>(valeur: T): T {
  if (Array.isArray(valeur)) return valeur.map((v) => masquerScores(v)) as unknown as T;
  if (valeur && typeof valeur === "object" && !(valeur instanceof Date)) {
    const sortie: Record<string, unknown> = {};
    for (const [cle, v] of Object.entries(valeur as Record<string, unknown>)) {
      if (CLES_SCORE.has(cle)) continue;
      sortie[cle] = masquerScores(v);
    }
    return sortie as T;
  }
  return valeur;
}
