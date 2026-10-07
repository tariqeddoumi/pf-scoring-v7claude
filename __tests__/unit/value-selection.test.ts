import { choisirValeur, valeurDeReponse } from "@/lib/services/scoring/value-selection";

const auto = (mode: string, valeur: unknown = 1.4, dispo = true) => ({
  bindingMode: mode,
  isAvailable: dispo,
  resolvedValue: valeur,
});
const vide = { valueString: null, valueNumber: null, valueBoolean: null, valueDate: null };

describe("value-selection", () => {
  it("une ligne de réponse vide ne masque pas la donnée automatique (T10)", () => {
    expect(choisirValeur(vide, auto("AUTO_IF_EMPTY"))).toEqual({ valeur: 1.4, origine: "SOURCE" });
    expect(choisirValeur(null, auto("AUTO_IF_EMPTY"))).toEqual({ valeur: 1.4, origine: "SOURCE" });
    expect(choisirValeur({ ...vide, valueString: "  " }, auto("AUTO_EDITABLE")).origine).toBe("SOURCE");
  });

  it("une saisie ne remplace pas une source AUTO_READONLY (T11)", () => {
    expect(choisirValeur({ ...vide, valueNumber: 3 }, auto("AUTO_READONLY", 0.8))).toEqual({
      valeur: 0.8,
      origine: "SOURCE",
    });
    expect(choisirValeur({ ...vide, valueNumber: 3 }, auto("CALCULATED_ONLY", 0.8)).valeur).toBe(0.8);
  });

  it("la saisie l'emporte en mode éditable, et seule compte en MANUAL_ONLY", () => {
    expect(choisirValeur({ ...vide, valueNumber: 3 }, auto("AUTO_EDITABLE")).valeur).toBe(3);
    expect(choisirValeur(vide, auto("MANUAL_ONLY")).origine).toBe("AUCUNE");
  });

  it("une valeur de repli est utilisée mais tracée comme défaut (T12)", () => {
    expect(choisirValeur(null, auto("AUTO_IF_EMPTY", 1.4, false))).toEqual({ valeur: 1.4, origine: "DEFAUT" });
    expect(choisirValeur(null, auto("AUTO_IF_EMPTY", null, false)).origine).toBe("AUCUNE");
  });

  it("valeur zéro et faux sont des réponses", () => {
    expect(valeurDeReponse({ ...vide, valueNumber: 0 })).toBe(0);
    expect(valeurDeReponse({ ...vide, valueBoolean: false })).toBe(false);
  });
});
