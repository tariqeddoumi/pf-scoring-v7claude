/**
 * Concordance du moteur web avec l'outil Excel : les dix-huit cas d'étude (six cas d'origine,
 * douze cas sectoriels) doivent donner exactement les résultats du moteur de référence, qui
 * reproduit lui-même l'Excel (vérifié par recalcul du classeur).
 */
import cas from "@/lib/modele-pf/cas-etude.json";
import { evaluer } from "@/lib/modele-pf/moteur";
import { dossierDepuisCasExcel, saisieDepuisCasExcel } from "@/lib/modele-pf/conversion";
import { calculer } from "@/lib/modele-pf/saisie";

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

describe("saisie web des 13 blocs — aller-retour avec les cas Excel", () => {
  it.each(cas.map((c: Cas) => [c.dossier.onglet, c] as const))("%s : même note par la saisie à situations", (_n, c) => {
    const s = saisieDepuisCasExcel(c.dossier);
    const { resultat, controles } = calculer(s, undefined, { codeClientT24: c.dossier.code_client, radical: c.dossier.radical, codeProjet: c.dossier.code_projet });
    expect(resultat.score).toBeCloseTo(c.attendu.score as number, 9);
    expect(resultat.noteApprouvee).toBe(c.attendu.note_approuvee ?? "—");
    expect(resultat.plafondsActifs).toEqual(c.attendu.plafonds_actifs);
    // Les cas de référence sont complets : aucune saisie exigée ne manque (comme dans l'Excel).
    expect(controles).toEqual([]);
  });
});
