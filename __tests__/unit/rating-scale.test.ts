import {
  BAREME_REPLI,
  resolveRatingFromBands,
  type RatingBand,
} from "@/lib/services/scoring/rating-scale";

/** Le barème tel qu'il est réellement persisté dans BP_PF_v7pp_rating_scales. */
const REFERENTIEL: RatingBand[] = [
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

describe("resolveRatingFromBands", () => {
  test("retient le palier contenant le score", () => {
    expect(resolveRatingFromBands(86, REFERENTIEL, "referentiel").rating).toBe("A");
    expect(resolveRatingFromBands(70, REFERENTIEL, "referentiel").rating).toBe("BB");
    expect(resolveRatingFromBands(0, REFERENTIEL, "referentiel").rating).toBe("D");
    expect(resolveRatingFromBands(100, REFERENTIEL, "referentiel").rating).toBe("AAA");
  });

  test("les bornes des paliers sont inclusives des deux côtés", () => {
    expect(resolveRatingFromBands(95, REFERENTIEL, "referentiel").rating).toBe("AAA");
    expect(resolveRatingFromBands(94.99, REFERENTIEL, "referentiel").rating).toBe("AA");
    expect(resolveRatingFromBands(90, REFERENTIEL, "referentiel").rating).toBe("AA");
    expect(resolveRatingFromBands(24.99, REFERENTIEL, "referentiel").rating).toBe("D");
    expect(resolveRatingFromBands(25, REFERENTIEL, "referentiel").rating).toBe("C");
  });

  test("le référentiel diverge du barème codé — c'est bien le référentiel qui tranche", () => {
    // 86 : « AA » selon l'ancien barème du moteur, « A » selon la base.
    expect(resolveRatingFromBands(86, BAREME_REPLI, "repli").rating).toBe("AA");
    expect(resolveRatingFromBands(86, REFERENTIEL, "referentiel").rating).toBe("A");
  });

  test("un score dans un interstice de bornes reçoit une note et un avertissement", () => {
    // 94,995 : au-dessus du plafond de AA (94,99), sous le plancher de AAA (95).
    const r = resolveRatingFromBands(94.995, REFERENTIEL, "referentiel");
    expect(r.rating).toBe("AA");
    expect(r.warning).toMatch(/hors des bornes/);
  });

  test("un score au-dessus du plafond le plus haut reste noté", () => {
    const r = resolveRatingFromBands(120, REFERENTIEL, "referentiel");
    expect(r.rating).toBe("AAA");
    expect(r.warning).toMatch(/hors des bornes/);
  });

  test("un score sous toutes les bornes reçoit la note la plus basse", () => {
    const r = resolveRatingFromBands(-5, REFERENTIEL, "referentiel");
    expect(r.rating).toBe("D");
    expect(r.warning).toMatch(/inférieur à toutes les bornes/);
  });

  test("un barème vide ne fabrique pas de note silencieuse", () => {
    const r = resolveRatingFromBands(80, [], "referentiel");
    expect(r.warning).toBe("barème vide");
  });

  test("l'ordre de déclaration des paliers n'influe pas sur le résultat", () => {
    const melange = [...REFERENTIEL].reverse();
    for (const score of [12, 33, 58, 77, 88, 97]) {
      expect(resolveRatingFromBands(score, melange, "referentiel").rating).toBe(
        resolveRatingFromBands(score, REFERENTIEL, "referentiel").rating
      );
    }
  });

  test("la source est reportée telle quelle", () => {
    expect(resolveRatingFromBands(80, REFERENTIEL, "referentiel").source).toBe(
      "referentiel"
    );
    expect(resolveRatingFromBands(80, BAREME_REPLI, "repli").source).toBe("repli");
  });

  test("le barème de repli couvre toute l'échelle 0–100 sans trou", () => {
    for (let s = 0; s <= 100; s += 0.5) {
      expect(resolveRatingFromBands(s, BAREME_REPLI, "repli").warning).toBeUndefined();
    }
  });
});
