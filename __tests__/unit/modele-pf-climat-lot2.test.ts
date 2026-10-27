/**
 * Volet climatique, lot 2 : règles derrière le paramètre `climat.lot2Actif`, inactif par
 * défaut. Inactif, le calcul reste celui de l'outil Excel (voir modele-pf-moteur) ; actif,
 * la fiche climat entre dans la note. Impact mesuré sur les 18 cas avec leurs fiches fictives.
 */
import { PARAMETRES_DEFAUT, anomaliesParametres, fusionnerParametres, type ParametresModele } from "@/lib/modele-pf/parametres";
import { surchargeSchema, resultatVisible } from "@/lib/modele-pf/serveur";
import { calculer, saisieVide } from "@/lib/modele-pf/saisie";
import { impactLot2 } from "@/scripts/docs/impact-climat-lot2";

const actif: ParametresModele = { ...PARAMETRES_DEFAUT, climat: { ...PARAMETRES_DEFAUT.climat, lot2Actif: true } };
const impact = Object.fromEntries(impactLot2().map((x) => [x.cas, x]));

describe("paramètres du lot 2", () => {
  it("est inactif par défaut, y compris pour des paramètres enregistrés avant lui", () => {
    expect(PARAMETRES_DEFAUT.climat.lot2Actif).toBe(false);
    const ancien = structuredClone(PARAMETRES_DEFAUT) as Partial<ParametresModele>;
    delete ancien.climat;
    const P = fusionnerParametres(ancien as never);
    expect(P.climat.lot2Actif).toBe(false);
    expect(P.plafonds.C16.niveau).toBe(6);
    expect(P.plafonds.C17.niveau).toBe(5);
  });

  it("s'active par le paramétrage, avec des poids de D9 qui totalisent 100 %", () => {
    expect(surchargeSchema.safeParse({ climat: { lot2Actif: true }, plafonds: { C17: { niveau: 4 } } }).success).toBe(true);
    expect(anomaliesParametres(actif)).toEqual([]);
    const faux = structuredClone(actif);
    faux.climat.poidsTransition = 0.3;
    expect(anomaliesParametres(faux).join()).toContain("Poids de D9");
  });

  it("laisse C16 et C17 sans objet tant qu'il est inactif", () => {
    const r = calculer(saisieVide()).resultat;
    expect(r.plafonds.C16).toBe("n.a.");
    expect(r.plafonds.C17).toBe("n.a.");
    expect(r.climat).toBeNull();
  });
});

describe("effet du lot 2 sur les 18 cas (fiches climat fictives)", () => {
  it("ne change que la note de l'huilerie : sécheresse élevée sans adaptation", () => {
    const changes = Object.values(impact).filter((x) => x.noteAvant !== x.noteApres);
    expect(changes.map((x) => x.cas)).toEqual(["AGR"]);
    expect(impact.AGR.noteAvant).toBe(8);
    expect(impact.AGR.noteApres).toBe(6);
    expect(impact.AGR.plafondsAjoutes).toEqual(["C11"]);
    // Site déclaré non exposé au bloc 2, exposé d'après la fiche ; le scénario climatique devient le plus sévère.
    expect(impact.AGR.exposition).toEqual({ bloc2: "Non", retenue: "Oui" });
    expect(impact.AGR.stressRetenu).toBe("climatique");
    expect(impact.AGR.n2Apres).toBe(20);
  });

  it("déclenche C16 sur les actifs à forte intensité carbone sans plan de transition", () => {
    for (const c of ["ETH", "IND", "TEL"]) expect(impact[c].plafondsAjoutes).toContain("C16");
    // Dessalement : émissions élevées mais plan de transition : pas de C16, D9.5 en vigilance.
    expect(impact.EAU.plafondsAjoutes).not.toContain("C16");
    expect(impact.EAU.transition).toBe("Élevé");
  });

  it("déclenche C17 quand plusieurs aléas élevés ne sont pas adaptés", () => {
    expect(impact.TOU.plafondsAjoutes).toContain("C17");
    expect(impact.C3.plafondsAjoutes).toEqual(["C11", "C17"]);
  });

  it("ne déclenche pas C11 quand l'aléa élevé est adapté", () => {
    expect(impact.C1.exposition.retenue).toBe("Oui");
    expect(impact.C1.plafondsAjoutes).toEqual([]);
  });
});

describe("saisie avec le lot 2 actif", () => {
  it("demande la fiche climat dans les contrôles", () => {
    const s = saisieVide();
    s.secteur = "AGR";
    s.climat.aleas.secheresse = { niveau: "Élevé", source: "", adaptation: null };
    const libelles = calculer(s, actif).controles.filter((c) => c.bloc === 14).map((c) => c.libelle);
    expect(libelles).toEqual(expect.arrayContaining([
      "Fiche climat : exposition des aléas présélectionnés",
      "Adaptation financée ? (Stress hydrique et sécheresse)",
      "Transition : émissions scopes 1 et 2",
      "Transition : exportations soumises au MACF",
      "Transition : actif dépendant des énergies fossiles ?",
      "Scénario climatique : baisse du CFADS (site exposé)",
    ]));
    expect(calculer(s).controles.some((c) => c.bloc === 14)).toBe(false);
  });

  it("n'établit pas la transition sur une seule donnée (pas de D9.5 maximal par défaut)", () => {
    const s = saisieVide();
    s.climat.emissions = 0;
    const { resultat, controles } = calculer(s, actif);
    expect(resultat.climat?.niveauTransition).toBeNull();
    expect(resultat.climat?.noteTransition).toBe("Info. insuffisante");
    expect(controles.map((c) => c.libelle)).toEqual(expect.arrayContaining(["Transition : exportations soumises au MACF"]));
  });

  it("masque la note D9.5 aux rôles qui ne voient pas les scores", () => {
    const s = saisieVide();
    s.climat.emissions = 0; s.climat.exportMacf = 0; s.climat.actifFossile = "Non";
    const r = calculer(s, actif).resultat;
    expect(r.climat?.noteTransition).toBe(100);
    expect(resultatVisible(r, "analyst")?.climat?.noteTransition).toBeNull();
    expect(resultatVisible(r, "analyst")?.climat?.niveauTransition).toBe("Faible");
  });

  it("garde la case du bloc 2 quand la fiche n'évalue aucun aléa", () => {
    const s = saisieVide();
    s.climatEleve = "Oui";
    const r = calculer(s, actif).resultat;
    expect(r.climat?.expositionRetenue).toBe("Oui");
    expect(r.climat?.expositionDeduite).toBeNull();
  });
});
