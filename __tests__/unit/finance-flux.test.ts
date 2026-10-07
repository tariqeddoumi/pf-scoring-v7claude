import { calculerFlux, calculerLlcr, financementATerminaison } from "@/lib/services/finance/flux";

/** Cas chiffrés du rapport de diagnostic (chapitres 18 et 19), en millions de MAD. */
describe("finance/flux — cas du diagnostic", () => {
  it("cas E : dette partiellement en EUR, hausse de 15 % non couverte puis couverte à 80 %", () => {
    const p = [{ libelle: "S1", cfads: 145, serviceMad: 30, serviceDevise: 70 }];
    expect(calculerFlux(p, { seuilDscr: 1.3 }).dscrMin).toBeCloseTo(1.45, 3);
    expect(calculerFlux(p, { seuilDscr: 1.3, scenario: { nom: "EUR+15", chocChange: 0.15 } }).dscrMin).toBeCloseTo(
      145 / 110.5,
      3
    );
    const couvert = [{ ...p[0], couvertureDevise: 0.8 }];
    expect(calculerFlux(couvert, { seuilDscr: 1.3, scenario: { nom: "EUR+15", chocChange: 0.15 } }).dscrMin).toBeCloseTo(
      145 / 102.1,
      3
    );
  });

  it("cas F : décalage d'encaissement, la DSRA comble le déficit sans relever le DSCR", () => {
    const p = [
      { libelle: "S1", cfads: 70, serviceMad: 50 },
      { libelle: "S2", cfads: 70, serviceMad: 50 },
    ];
    const r = calculerFlux(p, {
      seuilDscr: 1.2,
      dsraInitiale: 15,
      scenario: { nom: "retard", decalageEncaissement: { periode: 0, montant: 30 } },
    });
    expect(r.periodes[0].dscr).toBeCloseTo(0.8, 3);
    expect(r.periodes[0].deficit).toBe(10);
    expect(r.periodes[0].tirageDsra).toBe(10);
    expect(r.periodes[0].dsraFin).toBe(5);
    expect(r.periodes[0].deficitNonCouvert).toBe(0);
    expect(r.dscrMin).toBeCloseTo(0.8, 3);
    expect(r.nbPeriodesSousSeuil).toBe(1);
  });

  it("cas G : dépassement du coût à terminaison", () => {
    const g = financementATerminaison({ budget: 1000, depassements: [80, 20], detteEngagee: 750, fondsPropres: 250 });
    expect(g.besoin).toBe(1100);
    expect(g.deficit).toBe(100);
    const apresApport = financementATerminaison({ budget: 1000, depassements: [80, 20], detteEngagee: 750, fondsPropres: 350 });
    expect(apresApport.deficit).toBe(0);
    expect(apresApport.quotePartDette).toBeCloseTo(0.6818, 4);
  });

  it("cas H : sécheresse, CFADS 80 → 40 et DSCR 1,33 → 0,67", () => {
    const base = [{ libelle: "An", cfads: 200 - 100 - 20, serviceMad: 60 }];
    const secheresse = [{ libelle: "An", cfads: 170 - 110 - 20, serviceMad: 60 }];
    expect(calculerFlux(base, { seuilDscr: 1.2 }).dscrMin).toBeCloseTo(1.3333, 3);
    const r = calculerFlux(secheresse, { seuilDscr: 1.2 });
    expect(r.dscrMin).toBeCloseTo(0.6667, 3);
    expect(r.periodes[0].deficit).toBe(20);
  });

  it("cas I : échéance finale non refinancée", () => {
    const p = [{ libelle: "Dernière", cfads: 70, serviceMad: 50, ballon: 300 }];
    expect(calculerFlux(p, { seuilDscr: 1.2 }).dscrMin).toBeCloseTo(1.4, 3);
    expect(calculerFlux(p, { seuilDscr: 1.2, scenario: { nom: "sans refi", ballonNonRefinance: true } }).dscrMin).toBeCloseTo(
      0.2,
      3
    );
  });

  it("LLCR : valeur actualisée des CFADS sur la dette restante", () => {
    const p = [
      { libelle: "An1", cfads: 110, serviceMad: 100, dureeAnnees: 1 },
      { libelle: "An2", cfads: 121, serviceMad: 100, dureeAnnees: 1 },
    ];
    expect(calculerLlcr(p, 100, 0.1)).toBeCloseTo(2, 4);
    expect(calculerLlcr(p, 0, 0.1)).toBeNull();
  });
});
