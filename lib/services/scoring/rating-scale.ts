/**
 * Barème de conversion du score en note de crédit.
 *
 * Ce barème existait en DEUX exemplaires divergents : une table en base
 * (BP_PF_v7pp_rating_scales, 10 paliers) que personne ne lisait, et une table codée
 * en dur dans le moteur. Un score de 86 donnait « A » selon la base et « AA » selon
 * le moteur — deux crans d'écart sur une note de crédit.
 *
 * La base fait désormais foi. Le barème codé ne subsiste que comme repli explicite
 * lorsque la table est vide, afin qu'une base non initialisée ne produise pas de note
 * silencieusement fausse.
 */

export interface RatingBand {
  rating: string;
  minScore: number;
  maxScore: number;
}

export type RatingSource = "referentiel" | "repli";

export interface RatingResolution {
  rating: string;
  source: RatingSource;
  /** Renseigné lorsque le score ne tombe dans aucun palier du référentiel. */
  warning?: string;
}

/**
 * Repli utilisé uniquement si le référentiel est vide. Volontairement identique à
 * l'ancien barème du moteur, pour qu'une base non initialisée conserve le
 * comportement historique plutôt que d'en inventer un nouveau.
 */
export const BAREME_REPLI: RatingBand[] = [
  { rating: "AAA", minScore: 90, maxScore: 100 },
  { rating: "AA", minScore: 80, maxScore: 89.999999 },
  { rating: "A", minScore: 70, maxScore: 79.999999 },
  { rating: "BBB", minScore: 60, maxScore: 69.999999 },
  { rating: "BB", minScore: 50, maxScore: 59.999999 },
  { rating: "B", minScore: 40, maxScore: 49.999999 },
  { rating: "CCC", minScore: 30, maxScore: 39.999999 },
  { rating: "CC", minScore: 20, maxScore: 29.999999 },
  { rating: "C", minScore: 10, maxScore: 19.999999 },
  { rating: "D", minScore: 0, maxScore: 9.999999 },
];

/**
 * Résout une note à partir d'un barème, sans accès base — testable isolément.
 *
 * Les paliers sont parcourus du plus haut au plus bas et la borne supérieure est
 * traitée comme inclusive, de sorte qu'un score tombant dans un interstice de bornes
 * (94,995 entre un palier finissant à 94,99 et un autre commençant à 95) reçoive tout
 * de même une note, avec un avertissement, plutôt qu'aucune.
 */
export function resolveRatingFromBands(
  score: number,
  bands: RatingBand[],
  source: RatingSource
): RatingResolution {
  if (!bands || bands.length === 0) {
    return { rating: "D", source, warning: "barème vide" };
  }

  const tries = [...bands].sort((a, b) => b.minScore - a.minScore);

  for (const b of tries) {
    if (score >= b.minScore && score <= b.maxScore) {
      return { rating: b.rating, source };
    }
  }

  // Score hors de tout palier : on retient le palier le plus proche par le bas,
  // et on signale l'interstice au lieu de le masquer.
  const parDessous = tries.find((b) => score >= b.minScore);
  if (parDessous) {
    return {
      rating: parDessous.rating,
      source,
      warning: `score ${score} hors des bornes du palier ${parDessous.rating}`,
    };
  }

  const plusBas = tries[tries.length - 1];
  return {
    rating: plusBas.rating,
    source,
    warning: `score ${score} inférieur à toutes les bornes du barème`,
  };
}
