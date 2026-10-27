import { relireSaisie, saisieVide } from "@/lib/modele-pf/saisie";
import { cleDeLaCible, fusionnerOrigines, memeValeur, type OrigineChamp } from "@/lib/modele-pf/origines";

const o = (type: OrigineChamp["type"], valeur: string | number): OrigineChamp =>
  ({ type, valeur, source: "Rapport.pdf, p. 3", detail: "", confiance: null, le: "2026-10-26T10:00:00.000Z", par: "" });

describe("origine des valeurs de la saisie", () => {
  it("relit une saisie ancienne sans origines", () => {
    const ancienne = { ...saisieVide() } as Record<string, unknown>;
    delete ancienne.origines;
    expect(relireSaisie(ancienne).origines).toEqual({});
  });

  it("garde les origines IA de la base : le navigateur ne peut ni en forger ni en retirer", () => {
    const enBase = { llcr: o("ia", 1.35), dsra: o("ia", 6) };
    const envoyees = { llcr: o("ia", 9), fx: o("ia", 0.1), choc: o("calcul", 0.14) };
    const r = fusionnerOrigines(envoyees, enBase);
    expect(r.llcr.valeur).toBe(1.35);
    expect(r.dsra).toBeDefined();
    expect(r.fx).toBeUndefined();
    expect(r.choc.type).toBe("calcul");
  });

  it("laisse une origine plus récente (calcul, collage) remplacer celle de l'IA", () => {
    const r = fusionnerOrigines({ choc: o("calcul", 0.14) }, { choc: o("ia", 0.2) });
    expect(r.choc.type).toBe("calcul");
  });

  it("compare la valeur actuelle à la valeur d'origine", () => {
    expect(memeValeur(1.35, 1.35)).toBe(true);
    expect(memeValeur("Oui", " Oui")).toBe(true);
    expect(memeValeur(1.35, 1.4)).toBe(false);
    expect(memeValeur(null, "")).toBe(true);
  });

  it("retrouve la clé du fichier d'échange depuis la cible de l'écran", () => {
    expect(cleDeLaCible("dsraMois")).toBe("dsra");
    expect(cleDeLaCible("descriptionStress")).toBe("choc.description");
    expect(cleDeLaCible("llcr")).toBe("llcr");
  });
});
