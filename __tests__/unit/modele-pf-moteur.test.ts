/**
 * Concordance du moteur web avec l'outil Excel : les dix-huit cas d'étude (six cas d'origine,
 * douze cas sectoriels) doivent donner exactement les résultats du moteur de référence, qui
 * reproduit lui-même l'Excel (vérifié par recalcul du classeur).
 */
import cas from "../fixtures/cas-pf-18.json";
import { evaluer } from "@/lib/modele-pf/moteur";
import { dossierDepuisCasExcel } from "@/lib/modele-pf/conversion";

type Cas = (typeof cas)[number];

describe("moteur de scoring Project Finance — concordance avec l'Excel (18 cas)", () => {
  it.each(cas.map((c: Cas) => [c.dossier.onglet, c] as const))("%s", (_nom, c) => {
    const r = evaluer(dossierDepuisCasExcel(c.dossier));
    const a = c.attendu;
    expect(r.score).toBeCloseTo(a.score as number, 9);
    expect(r.noteCalculee).toBe(a.note_calculee);
    expect(r.noteApprouvee).toBe(a.note_approuvee ?? "—");
    expect(r.plafond).toBe(a.plafond);
    expect(r.regimeCalcule).toBe(a.regime_calcule);
    expect(r.regimeRetenu).toBe(a.regime_retenu);
    expect(r.plafondsActifs).toEqual(a.plafonds_actifs);
    expect(r.verrousActifs).toEqual(a.verrous_actifs);
    expect(r.statut).toBe(a.statut);
    expect(r.dscrMin).toBeCloseTo(a.dscr_min as number, 9);
    expect(r.dscrMinStresse).toBeCloseTo(a.dscr_min_s as number, 9);
    expect(r.d7).toBeCloseTo(a.D7 as number, 9);
    expect(r.completude).toBeCloseTo(a.completude as number, 9);
    expect(r.noyau).toEqual(a.noyau);
    for (const [k, v] of Object.entries(a.plafonds as Record<string, string>)) {
      expect([k, r.plafonds[k as keyof typeof r.plafonds]]).toEqual([k, v]);
    }
    for (const [k, v] of Object.entries(a.domaines as Record<string, number | null>)) {
      const lu = r.domaines[k as keyof typeof r.domaines];
      if (v === null) expect(lu).toBeNull();
      else expect(lu).toBeCloseTo(v, 9);
    }
  });

  it("couvre les dix-huit cas", () => {
    expect(cas).toHaveLength(18);
  });
});
