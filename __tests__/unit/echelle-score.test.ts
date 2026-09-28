import { AggregationEngine, ScoreCalculator } from "@/lib/services/scoring/score-calculator";
import {
  BAREME_REPLI,
  resolveRatingFromBands,
} from "@/lib/services/scoring/rating-scale";

/** Barème de notation tel qu'il est persisté : bornes sur 0–100. */
const REFERENTIEL = [
  { rating: "AAA", minScore: 95, maxScore: 100 },
  { rating: "AA", minScore: 90, maxScore: 94.99 },
  { rating: "A", minScore: 85, maxScore: 89.99 },
  { rating: "BBB", minScore: 75, maxScore: 84.99 },
  { rating: "BB", minScore: 65, maxScore: 74.99 },
  { rating: "B", minScore: 55, maxScore: 64.99 },
  { rating: "CCC", minScore: 45, maxScore: 54.99 },
  { rating: "CC", minScore: 35, maxScore: 44.99 },
  { rating: "C", minScore: 25, maxScore: 34.99 },
  { rating: "D", minScore: 0, maxScore: 24.99 },
];

/** Échelle déclarée par les critères de la grille V7++. */
const CRITERE = { scoreMin: 0, scoreMax: 10 };

/** Poids des neuf domaines du socle : D3 et D7 à 15, les autres à 10. */
const POIDS_DOMAINES = [
  { code: "D1", weight: 10 },
  { code: "D2", weight: 10 },
  { code: "D3", weight: 15 },
  { code: "D4", weight: 10 },
  { code: "D5", weight: 10 },
  { code: "D6", weight: 10 },
  { code: "D7", weight: 15 },
  { code: "D8", weight: 10 },
  { code: "D9", weight: 10 },
];

/**
 * Reproduit la chaîne du moteur : conversion des feuilles, agrégation pondérée,
 * puis lecture du barème.
 */
function noterDossier(scoresOptions: number[]): { score: number; note: string } {
  const domaines = POIDS_DOMAINES.map((d, i) => ({
    nodeId: d.code,
    rawScore: AggregationEngine.rescaleTo100(
      scoresOptions[i],
      CRITERE.scoreMin,
      CRITERE.scoreMax
    ),
    weight: d.weight,
  }));

  const score = AggregationEngine.aggregate("WEIGHTED_AVERAGE", domaines as never);
  return { score, note: resolveRatingFromBands(score, REFERENTIEL, "referentiel").rating };
}

describe("échelle des scores du moteur", () => {
  test("le barème d'un critère est converti sur 0–100 depuis son échelle déclarée", () => {
    expect(AggregationEngine.rescaleTo100(10, 0, 10)).toBe(100);
    expect(AggregationEngine.rescaleTo100(8, 0, 10)).toBe(80);
    expect(AggregationEngine.rescaleTo100(5, 0, 10)).toBe(50);
    expect(AggregationEngine.rescaleTo100(2, 0, 10)).toBe(20);
  });

  test("la conversion s'appuie sur les bornes déclarées, non sur l'étendue des options", () => {
    // La plus mauvaise option de la grille vaut 2 sur 10 : elle doit valoir 20 sur 100,
    // et non zéro. Étirer l'échelle sur l'étendue observée changerait le sens du barème.
    expect(AggregationEngine.rescaleTo100(2, 0, 10)).toBe(20);
  });

  test("un score déjà centésimal n'est pas retouché", () => {
    expect(AggregationEngine.rescaleTo100(73.5, 0, 100)).toBe(73.5);
    expect(AggregationEngine.rescaleTo100(73.5, null, null)).toBe(73.5);
  });

  test("une échelle inexploitable laisse le score intact plutôt que de le fausser", () => {
    expect(AggregationEngine.rescaleTo100(7, 10, 10)).toBe(7);
    expect(AggregationEngine.rescaleTo100(7, 10, 5)).toBe(7);
    expect(AggregationEngine.rescaleTo100(7, 0, Number.NaN)).toBe(7);
  });
});

describe("notation d'un dossier de bout en bout", () => {
  test("un dossier excellent obtient la meilleure note", () => {
    const { score, note } = noterDossier(Array(9).fill(10));
    expect(score).toBe(100);
    expect(note).toBe("AAA");
  });

  test("un dossier médiocre obtient la plus basse", () => {
    const { score, note } = noterDossier(Array(9).fill(2));
    expect(score).toBe(20);
    expect(note).toBe("D");
  });

  test("un dossier moyen se situe au milieu de l'échelle, et non en défaut", () => {
    // Avant la correction, la moyenne pondérée restait entre 2 et 10 : ce dossier
    // valait 8 sur 100 et recevait « D », comme tous les autres.
    const { score, note } = noterDossier(Array(9).fill(8));
    expect(score).toBe(80);
    expect(note).toBe("BBB");
  });

  test("le barème discrimine les dossiers au lieu de tous les classer en défaut", () => {
    const notes = [10, 8, 5, 2].map((s) => noterDossier(Array(9).fill(s)).note);
    expect(notes).toEqual(["AAA", "BBB", "CCC", "D"]);
    expect(new Set(notes).size).toBe(4);
  });

  test("un profil hétérogène est noté sur la moyenne pondérée des domaines", () => {
    // D3 et D7 pèsent 15, les sept autres 10 : un défaut sur un domaine lourd coûte
    // davantage qu'un défaut sur un domaine léger.
    const faibleSurD3 = noterDossier([8, 8, 2, 8, 8, 8, 8, 8, 8]);
    const faibleSurD1 = noterDossier([2, 8, 8, 8, 8, 8, 8, 8, 8]);
    expect(faibleSurD3.score).toBeLessThan(faibleSurD1.score);
  });

  test("le poids total du socle vaut 100", () => {
    expect(POIDS_DOMAINES.reduce((s, d) => s + d.weight, 0)).toBe(100);
  });
});

describe("cohérence du barème de repli", () => {
  test("le repli couvre la même échelle 0–100 que le référentiel", () => {
    for (const score of [0, 20, 50, 80, 100]) {
      expect(resolveRatingFromBands(score, BAREME_REPLI, "repli").warning).toBeUndefined();
    }
  });
});

describe("notation par plages du DSCR, inchangée par la conversion", () => {
  test("le DSCR reste noté sur son barème puis converti comme les autres critères", () => {
    // Les plages du DSCR sont exprimées sur la même échelle 0–10 que les options :
    // la conversion leur est donc appliquée à l'identique.
    const plages = [
      { min: 1.5, max: 999, score: 10 },
      { min: 1.3, max: 1.4999, score: 8 },
      { min: 1.2, max: 1.2999, score: 5 },
      { min: 0, max: 1.1999, score: 2 },
    ];
    const brut = ScoreCalculator.scoreFromRanges(1.35, plages).rawScore;
    expect(brut).toBe(8);
    expect(AggregationEngine.rescaleTo100(brut, 0, 10)).toBe(80);
  });
});
