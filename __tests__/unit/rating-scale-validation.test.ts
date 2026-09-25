import {
  validateRatingScales,
  type RatingScaleInput,
} from "@/lib/services/scoring-configuration-service";

const palier = (
  id: string,
  minScore: number,
  maxScore: number,
  displayOrder = 1
): RatingScaleInput => ({ id, label: id, minScore, maxScore, displayOrder });

describe("validateRatingScales", () => {
  test("accepte le barème livré sans le noyer d'alertes sur ses intervalles à 0,01", () => {
    const r = validateRatingScales([
      palier("AAA", 95, 100),
      palier("AA", 90, 94.99),
      palier("A", 85, 89.99),
      palier("BBB", 75, 84.99),
      palier("BB", 65, 74.99),
      palier("B", 55, 64.99),
      palier("CCC", 45, 54.99),
      palier("CC", 35, 44.99),
      palier("C", 25, 34.99),
      palier("D", 0, 24.99),
    ]);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
  });

  test("refuse deux paliers qui se recouvrent", () => {
    const r = validateRatingScales([palier("A", 70, 85), palier("B", 80, 95)]);
    expect(r.errors.join(" ")).toMatch(/se recouvrent/);
  });

  test("refuse une borne basse supérieure à la borne haute", () => {
    const r = validateRatingScales([palier("A", 90, 70)]);
    expect(r.errors.join(" ")).toMatch(/supérieure à la borne haute/);
  });

  test("refuse un libellé vide", () => {
    const r = validateRatingScales([{ ...palier("A", 0, 100), label: "  " }]);
    expect(r.errors.join(" ")).toMatch(/libellé manquant/);
  });

  test("refuse un identifiant en double", () => {
    const r = validateRatingScales([palier("A", 0, 50), palier("A", 51, 100)]);
    expect(r.errors.join(" ")).toMatch(/en double/);
  });

  test("refuse un barème vide", () => {
    expect(validateRatingScales([]).errors).toHaveLength(1);
  });

  test("signale sans refuser un trou entre deux paliers", () => {
    const r = validateRatingScales([palier("D", 0, 40), palier("A", 60, 100)]);
    expect(r.errors).toEqual([]);
    expect(r.warnings.join(" ")).toMatch(/entre 40 et 60/);
  });

  test("signale une échelle qui ne couvre ni 0 ni 100", () => {
    const r = validateRatingScales([palier("A", 10, 90)]);
    expect(r.errors).toEqual([]);
    expect(r.warnings.join(" ")).toMatch(/inférieurs à 10/);
    expect(r.warnings.join(" ")).toMatch(/supérieurs à 90/);
  });

  test("refuse des bornes non numériques", () => {
    const r = validateRatingScales([
      { ...palier("A", 0, 100), minScore: Number.NaN },
    ]);
    expect(r.errors.join(" ")).toMatch(/non numériques/);
  });

  test("l'interstice d'un centième entre deux paliers adjacents n'est pas signalé", () => {
    const r = validateRatingScales([palier("D", 0, 50), palier("A", 50.01, 100)]);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
  });

  test("un trou plus large qu'un centième reste signalé", () => {
    const r = validateRatingScales([palier("D", 0, 50), palier("A", 50.5, 100)]);
    expect(r.warnings.join(" ")).toMatch(/entre 50 et 50.5/);
  });
});
