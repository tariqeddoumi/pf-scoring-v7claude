/**
 * Fichier d'échange « PF-PROPOSITIONS-IA v1 » et propositions de l'IA pour les 13 blocs :
 * la saisie exportée puis réimportée redonne la même note (18 cas), et une proposition
 * que l'écran de saisie refuserait n'est jamais proposée.
 */
import cas from "@/lib/modele-pf/cas-etude.json";
import { saisieDepuisCasExcel } from "@/lib/modele-pf/conversion";
import { calculer, saisieVide } from "@/lib/modele-pf/saisie";
import { champ, ecrireChamp, lireChamp, normaliser, tousLesChamps, valeursDeLaSaisie } from "@/lib/modele-pf/champs-ia";
import { construirePropositionsPF, criteresIA } from "@/lib/modele-pf/ia";
import type { ResultatAnalyse } from "@/lib/services/ia-documents/resultat";

type Cas = (typeof cas)[number];

describe("format d'échange avec l'outil Excel", () => {
  it.each(cas.map((c: Cas) => [c.dossier.onglet, c] as const))("%s : export puis import de la saisie, même note", (_n, c) => {
    const s = saisieDepuisCasExcel(c.dossier);
    const reprise = saisieVide();
    for (const { cle, valeur } of valeursDeLaSaisie(s)) {
      const n = normaliser(cle, valeur);
      expect([cle, n.ok]).toEqual([cle, true]);
      if (n.ok) ecrireChamp(reprise, cle, n.valeur);
    }
    const a = calculer(s).resultat;
    const b = calculer(reprise).resultat;
    expect(b.score).toBeCloseTo(a.score as number, 9);
    expect(b.noteApprouvee).toBe(a.noteApprouvee);
    expect(b.plafondsActifs).toEqual(a.plafondsActifs);
    expect(b.verrousActifs).toEqual(a.verrousActifs);
  });

  it("clés uniques et toutes résolues", () => {
    const cles = tousLesChamps().map((c) => c.cle);
    expect(new Set(cles).size).toBe(cles.length);
    expect(cles).toContain("D9.4.commentaire");
    expect(cles).toContain("echeance.60.cfads_stresse");
    expect(champ("echeance.61.cfads")).toBeNull();
    expect(champ("inconnue")).toBeNull();
  });

  it("B6 se saisit à l'inverse dans l'outil Excel", () => {
    const s = saisieVide();
    s.verrous.B6 = "Oui"; // blocage constaté dans la saisie web
    expect(lireChamp(s, "verrou.B6")).toBe("Non"); // « modèle de flux complet ? » Non
    ecrireChamp(s, "verrou.B6", "Oui");
    expect(s.verrous.B6).toBe("Non");
  });

  it("normalise pourcentages, listes et situations", () => {
    expect(normaliser("choc", "15 %")).toEqual({ ok: true, valeur: 0.15 });
    expect(normaliser("choc", 0.99).ok).toBe(false);
    expect(normaliser("secteur", "imm")).toEqual({ ok: true, valeur: "IMMO-REND" });
    expect(normaliser("D2.1", "Favorable — technologie éprouvée")).toEqual({ ok: true, valeur: "Favorable" });
    expect(normaliser("regime", "R5").ok).toBe(false);
    expect(normaliser("llcr", "1,35")).toEqual({ ok: true, valeur: 1.35 });
  });
});

const extrait = (code: string, champs: Partial<ResultatAnalyse["criteres"][number]>): ResultatAnalyse["criteres"][number] => ({
  code, statut: "trouve", optionChoisie: null, valeurNombre: null, valeurBooleen: null, valeurTexte: null, confiance: "elevee",
  justification: "", sources: [{ document: "Modèle financier (fictif).xlsx", localisation: "Feuille Dette, B12", extrait: "" }], documentAttendu: null, ...champs,
});

describe("propositions de l'IA pour les 13 blocs", () => {
  const s = saisieVide();
  s.secteur = "ENR";
  const criteres = criteresIA(s);

  it("demande les champs simples, la grille, les listes et les commentaires de domaine, sans les commentaires déduits", () => {
    const codes = criteres.map((c) => c.code);
    expect(codes).toEqual(expect.arrayContaining(["regime", "llcr", "D1.1", "N4", "verrou.X1", "liste.echeancier", "secteur.1.valeur"]));
    expect(codes.some((c) => /^D\d\.\d\.commentaire$/.test(c) || c.endsWith(".justification"))).toBe(false);
    // Le commentaire de chaque domaine est rédigé par l'IA à partir des pièces.
    expect(codes).toEqual(expect.arrayContaining(["D1.commentaire", "D9.commentaire"]));
    expect(criteres.find((c) => c.code === "choc")?.description).toContain("CFADS central");
    expect(codes).not.toContain("bloc13.avis");
    expect(criteres.find((c) => c.code === "D1.1")?.options).toHaveLength(5);
  });

  it("éclate l'échéancier, déduit commentaire et source, refuse une valeur hors liste", () => {
    const resultat: ResultatAnalyse = {
      synthese: "", documents: [], questions: [],
      criteres: [
        extrait("liste.echeancier", { valeurTexte: "S1 2028 ; 120,5 ; 90\nS2 2028 ; 118 ; 90 ; 101" }),
        extrait("D1.1", { optionChoisie: "Vigilance", justification: "Sponsor faiblement capitalisé" }),
        extrait("regime", { optionChoisie: "R9" }),
        extrait("fx", { valeurNombre: 0.12 }),
        extrait("secteur.1.valeur", { valeurNombre: 60 }),
        extrait("dsra", { statut: "absent", documentAttendu: "Term sheet" }),
      ],
    };
    const { propositions, manquants } = construirePropositionsPF(resultat, s, criteres);
    const v = Object.fromEntries(propositions.map((p) => [p.cle, p.valeur]));
    expect(v["echeance.1.cfads"]).toBe(120.5);
    expect(v["echeance.2.cfads_stresse"]).toBe(101);
    expect(v["echeance.1.libelle"]).toBe("S1 2028");
    expect(v["D1.1"]).toBe("Vigilance");
    expect(String(v["D1.1.commentaire"])).toContain("Sponsor faiblement capitalisé");
    expect(v["fx"]).toBe(0.12);
    expect(v["secteur.1.source"]).toContain("Modèle financier");
    expect(v["regime"]).toBeUndefined();
    expect(manquants.find((m) => m.cle === "regime")?.motif).toContain("refusée");
    expect(manquants.find((m) => m.cle === "dsra")?.documentAttendu).toBe("Term sheet");
    expect(propositions.every((p) => p.decision === "en_attente")).toBe(true);
  });
});
