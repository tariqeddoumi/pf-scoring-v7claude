/**
 * Volet climatique, lot 1 : fiche des aléas, transition, scénario climatique indicatif,
 * fiche 2/W/2025 et champs proposés par l'IA. Rien ne doit changer la note.
 */
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import cas from "@/lib/modele-pf/cas-etude.json";
import { PARAMETRES_DEFAUT } from "@/lib/modele-pf/parametres";
import { calculer, saisieVide, relireSaisie } from "@/lib/modele-pf/saisie";
import { saisieDepuisCasExcel } from "@/lib/modele-pf/conversion";
import { ALEAS_PAR_SECTEUR, SCENARIOS_CLIMAT, evaluerClimat, ficheClimatCsv } from "@/lib/modele-pf/climat";
import { ecrireChamp, lireChamp, normaliser, tousLesChamps, valeursDeLaSaisie } from "@/lib/modele-pf/champs-ia";
import { construirePropositionsPF, criteresIA } from "@/lib/modele-pf/ia";
import type { ResultatAnalyse } from "@/lib/services/ia-documents/resultat";
import { SaisieContexte } from "@/components/scoring-pf/origine";
import { BlocClimat } from "@/components/scoring-pf/BlocClimat";

const periodes = [{ cfads: 30, service: 20 }, { cfads: 26, service: 20 }];
const seuils: [number, number, number] = [1.05, 1.15, 1.25];

describe("référentiel climatique", () => {
  it("présélectionne des aléas et un scénario pour chaque secteur", () => {
    for (const sec of Object.keys(PARAMETRES_DEFAUT.secteurs)) {
      expect(ALEAS_PAR_SECTEUR[sec as keyof typeof ALEAS_PAR_SECTEUR].length).toBeGreaterThan(0);
      expect(SCENARIOS_CLIMAT[sec as keyof typeof SCENARIOS_CLIMAT].description.length).toBeGreaterThan(10);
    }
  });
});

describe("indicateurs climatiques", () => {
  it("déduit l'exposition et signale l'écart avec la case du bloc 2 (cas de l'agro-industrie)", () => {
    const s = saisieVide();
    s.climat.aleas.secheresse = { niveau: "Élevé", source: "Étude d'impact p. 12", adaptation: null };
    const e = evaluerClimat(s.climat, "AGR", "Non", periodes, seuils);
    expect(e.expositionDeduite).toBe(true);
    expect(e.aleasElevesSansAdaptation).toEqual(["secheresse"]);
    expect(e.incoherence).toContain("non exposé");
    expect(e.apercuLot2.map((p) => p.code)).toEqual(["C11"]);
  });

  it("n'alerte plus quand l'aléa élevé est adapté et déclaré", () => {
    const s = saisieVide();
    s.climat.aleas.secheresse = { niveau: "Élevé", source: "", adaptation: "Oui" };
    const e = evaluerClimat(s.climat, "AGR", "Oui", periodes, seuils);
    expect(e.incoherence).toBeNull();
    expect(e.apercuLot2).toEqual([]);
  });

  it("classe le risque de transition selon les repères", () => {
    const s = saisieVide();
    expect(evaluerClimat(s.climat, "ETH", null, [], null).niveauTransition).toBeNull();
    s.climat.emissions = 1_000_000;
    s.climat.actifFossile = "Oui";
    // Une donnée manque encore : pas de niveau (elle pourrait révéler un risque plus élevé).
    expect(evaluerClimat(s.climat, "ETH", null, [], null).niveauTransition).toBeNull();
    s.climat.exportMacf = 0;
    const e = evaluerClimat(s.climat, "ETH", null, [], null);
    expect(e.niveauTransition).toBe("Élevé");
    expect(e.apercuLot2.map((p) => p.code)).toContain("C16");
    s.climat.emissions = 40_000; s.climat.actifFossile = "Oui"; s.climat.planTransition = "Oui";
    expect(evaluerClimat(s.climat, "ETH", null, [], null).niveauTransition).toBe("Moyen");
    s.climat.emissions = 2_000; s.climat.actifFossile = "Non"; s.climat.exportMacf = 0;
    expect(evaluerClimat(s.climat, "ENR", null, [], null).niveauTransition).toBe("Faible");
    s.climat.exportMacf = 0.3;
    expect(evaluerClimat(s.climat, "IND", null, [], null).niveauTransition).toBe("Élevé");
  });

  it("calcule le DSCR minimum sous le scénario climatique", () => {
    const s = saisieVide();
    s.climat.chocClimatique = 0.2;
    const e = evaluerClimat(s.climat, "ENR", null, periodes, seuils);
    expect(e.dscrMinClimatique).toBeCloseTo(26 * 0.8 / 20, 9);
    expect(e.classeClimatique).toBe("Critique");
  });

  it("produit la fiche 2/W/2025 en CSV", () => {
    const s = saisieVide();
    s.climat.localisation = "Province de Ouarzazate";
    s.climat.aleas.chaleur = { niveau: "Moyen", source: "Rapport technique; p. 8", adaptation: "Oui" };
    const csv = ficheClimatCsv(s.climat, evaluerClimat(s.climat, "ENR", null, [], null), { Projet: "Centrale PV" });
    expect(csv).toContain("Province de Ouarzazate");
    expect(csv).toContain("Chaleur extrême;Moyen;\"Rapport technique; p. 8 ; adaptation financée\"");
  });
});

describe("le volet climatique ne change pas la note (lot 1)", () => {
  it.each(cas.map((c) => [c.dossier.onglet, c] as const))("%s", (_n, c) => {
    const s = saisieDepuisCasExcel(c.dossier);
    const avant = calculer(s).resultat;
    s.climat.aleas.chaleur = { niveau: "Élevé", source: "", adaptation: "Non" };
    s.climat.emissions = 500_000; s.climat.actifFossile = "Oui"; s.climat.chocClimatique = 0.5;
    const apres = calculer(relireSaisie(s)).resultat;
    expect(apres.score).toBe(avant.score);
    expect(apres.noteApprouvee).toBe(avant.noteApprouvee);
    expect(apres.plafondsActifs).toEqual(avant.plafondsActifs);
  });
});

const extrait = (code: string, champs: Partial<ResultatAnalyse["criteres"][number]>): ResultatAnalyse["criteres"][number] => ({
  code, statut: "trouve", optionChoisie: null, valeurNombre: null, valeurBooleen: null, valeurTexte: null, confiance: "elevee",
  justification: "", sources: [{ document: "Étude d'impact (fictive).pdf", localisation: "p. 42", extrait: "" }], documentAttendu: null, ...champs,
});

describe("champs climat pour l'IA", () => {
  it("lit et écrit les champs de la fiche", () => {
    const s = saisieVide();
    expect(ecrireChamp(s, "climat.alea.submersion.niveau", "Élevé")).toBe(true);
    expect(ecrireChamp(s, "climat.export_macf", 0.25)).toBe(true);
    expect(lireChamp(s, "climat.alea.submersion.niveau")).toBe("Élevé");
    expect(s.climat.exportMacf).toBe(0.25);
    expect(normaliser("climat.alea.chaleur.niveau", "élevé")).toEqual({ ok: true, valeur: "Élevé" });
    expect(normaliser("climat.export_macf", 1.5).ok).toBe(false);
    expect(tousLesChamps().some((c) => c.cle === "climat.emissions")).toBe(true);
  });

  it("fait partie du fichier d'échange avec l'outil Excel (version 4)", () => {
    const s = saisieVide();
    s.climat.emissions = 1000;
    s.climat.aleas.chaleur = { niveau: "Élevé", source: "Étude p. 3", adaptation: "Oui" };
    const cles = valeursDeLaSaisie(s).map((l) => l.cle);
    expect(cles).toEqual(expect.arrayContaining(["climat.emissions", "climat.alea.chaleur.niveau", "climat.alea.chaleur.adaptation"]));
  });

  it("demande les aléas à l'IA et déduit leur source", () => {
    const s = saisieVide();
    s.secteur = "EAU";
    const criteres = criteresIA(s);
    const codes = criteres.map((c) => c.code);
    expect(codes).toEqual(expect.arrayContaining(["climat.alea.submersion.niveau", "climat.alea.submersion.adaptation", "climat.emissions", "climat.choc"]));
    expect(codes.some((c) => /^climat\.alea\.[a-z]+\.source$/.test(c))).toBe(false);
    expect(criteres.find((c) => c.code === "climat.alea.submersion.niveau")?.description).toContain("Faible, Moyen ou Élevé");
    const r: ResultatAnalyse = { synthese: "", documents: [], questions: [], criteres: [extrait("climat.alea.submersion.niveau", { optionChoisie: "Élevé" })] };
    const v = Object.fromEntries(construirePropositionsPF(r, s, criteres).propositions.map((p) => [p.cle, p.valeur]));
    expect(v["climat.alea.submersion.niveau"]).toBe("Élevé");
    expect(v["climat.alea.submersion.source"]).toBe("Étude d'impact (fictive).pdf, p. 42");
  });
});

describe("écran du volet climatique", () => {
  it("affiche les aléas du secteur, l'alerte d'écart et l'aperçu du lot 2", () => {
    const s = saisieVide();
    s.secteur = "AGR";
    s.climatEleve = "Non";
    s.climat.aleas.secheresse = { niveau: "Élevé", source: "", adaptation: "Non" };
    const r = calculer(s).resultat;
    const html = renderToStaticMarkup(h(SaisieContexte.Provider, { value: s },
      h(BlocClimat, { s, r, P: PARAMETRES_DEFAUT, modifier: () => {}, lecture: false, voirScores: true, manquants: new Set<string>(), projet: { nom: "Huilerie", codeProjet: "PF-2026-0001" } })));
    expect(html).toContain("Stress hydrique et sécheresse");
    expect(html).toContain("sans effet sur la note");
    expect(html).toContain("non exposé");
    expect(html).toContain("C11");
    expect(html).toContain("Sécheresse sur deux campagnes consécutives");
  });
});
