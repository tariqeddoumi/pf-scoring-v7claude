import { PARAMETRES_DEFAUT } from "@/lib/modele-pf/parametres";
import { SCENARIOS_REFERENCE, calculerChoc } from "@/lib/modele-pf/scenarios";

describe("scénarios défavorables de référence", () => {
  it("couvre chaque secteur du modèle", () => {
    expect(Object.keys(SCENARIOS_REFERENCE).sort()).toEqual(Object.keys(PARAMETRES_DEFAUT.secteurs).sort());
    for (const r of Object.values(SCENARIOS_REFERENCE)) {
      expect(r.baisseRecettes).toBeGreaterThanOrEqual(0);
      expect(r.hausseCharges).toBeGreaterThanOrEqual(0);
      expect(r.source.length).toBeGreaterThan(20);
    }
  });
});

describe("calcul du choc sur les CFADS", () => {
  it("reprend l'exemple de la note : recettes 100, charges 25, − 8 % et + 10 %", () => {
    const c = calculerChoc(100, 25, 0.08, 0.1)!;
    expect(c.cfadsCentral).toBe(75);
    expect(c.cfadsStresse).toBeCloseTo(64.5, 9);
    expect(c.choc).toBeCloseTo(0.14, 9);
  });

  it("amplifie la baisse des recettes quand les charges sont lourdes", () => {
    expect(calculerChoc(100, 70, 0.15, 0)!.choc).toBeCloseTo(0.5, 9);
  });

  it("refuse un CFADS central nul ou négatif et plafonne le choc à 95 %", () => {
    expect(calculerChoc(100, 100, 0.1, 0)).toBeNull();
    expect(calculerChoc(0, 0, 0.1, 0)).toBeNull();
    expect(calculerChoc(100, 90, 0.5, 0)!.choc).toBe(0.95);
  });
});
