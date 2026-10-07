/**
 * Calcul financier par période d'un financement de projet.
 *
 * Le parcours de scoring transformait des ratios DÉCLARÉS en points : aucun calcul
 * des flux, de la dette et du CFADS n'y était raccordé (constat F16). Ce module
 * recalcule les indicateurs à partir des séries datées, sans base de données, pour
 * pouvoir être rapproché d'un modèle financier validé :
 * - DSCR par période = CFADS / service de la dette de la même période ; minimum
 *   périodique et nombre de périodes sous seuil (pas une moyenne annuelle) ;
 * - LLCR = valeur actualisée des CFADS jusqu'à la maturité / dette restant due ;
 * - utilisation de la DSRA : elle comble un déficit de trésorerie SANS améliorer le
 *   DSCR opérationnel ;
 * - financement à terminaison en construction ;
 * - scénarios : choc de CFADS, choc de change avec couverture, décalage
 *   d'encaissement, échéance finale sans refinancement.
 *
 * Montants dans une unité unique (par convention, millions de MAD) ; ratios en
 * multiples ; taux en fractions (0,08 = 8 %).
 */

export interface Periode {
  libelle: string;
  /** CFADS de la période. */
  cfads: number;
  /** Service de la dette libellé en MAD (intérêts + principal). */
  serviceMad: number;
  /** Service de la dette libellé en devise, converti au cours de base. */
  serviceDevise?: number;
  /** Part du service en devise couverte au cours de base (0 à 1). */
  couvertureDevise?: number;
  /** Remboursement final (ballon) dû sur la période. */
  ballon?: number;
  /** Fraction d'année de la période (0,5 pour un semestre). */
  dureeAnnees?: number;
}

export interface Scenario {
  nom: string;
  /** Variation du CFADS (−0,15 = baisse de 15 %). */
  chocCfads?: number;
  /** Variation du cours de la devise contre MAD (+0,15 = hausse de 15 %). */
  chocChange?: number;
  /** Montant d'encaissement reporté de la période `periodeDecalee` à la suivante. */
  decalageEncaissement?: { periode: number; montant: number };
  /** Le ballon n'est pas refinancé : il est payé sur le CFADS de la période. */
  ballonNonRefinance?: boolean;
}

export interface ResultatPeriode {
  libelle: string;
  cfads: number;
  service: number;
  dscr: number | null;
  sousSeuil: boolean;
  deficit: number;
  tirageDsra: number;
  dsraFin: number;
  deficitNonCouvert: number;
}

export interface ResultatFlux {
  scenario: string;
  periodes: ResultatPeriode[];
  dscrMin: number | null;
  periodeDscrMin: string | null;
  nbPeriodesSousSeuil: number;
  dsraMinimale: number;
  deficitNonCouvertTotal: number;
}

const arrondi = (x: number, d = 4) => Math.round(x * 10 ** d) / 10 ** d;

/** Service de la dette d'une période, après choc de change et couverture. */
export function serviceDeLaPeriode(p: Periode, s: Scenario = { nom: "base" }): number {
  const devise = p.serviceDevise ?? 0;
  const couvert = Math.min(1, Math.max(0, p.couvertureDevise ?? 0));
  const choc = s.chocChange ?? 0;
  const deviseApresChoc = devise * couvert + devise * (1 - couvert) * (1 + choc);
  const ballon = s.ballonNonRefinance ? (p.ballon ?? 0) : 0;
  return p.serviceMad + deviseApresChoc + ballon;
}

export function calculerFlux(
  periodes: Periode[],
  options: { seuilDscr: number; dsraInitiale?: number; scenario?: Scenario }
): ResultatFlux {
  const s = options.scenario ?? { nom: "base" };
  const cfads = periodes.map((p) => p.cfads * (1 + (s.chocCfads ?? 0)));
  if (s.decalageEncaissement) {
    const { periode, montant } = s.decalageEncaissement;
    if (periode >= 0 && periode < cfads.length) {
      cfads[periode] -= montant;
      if (periode + 1 < cfads.length) cfads[periode + 1] += montant;
    }
  }

  let dsra = options.dsraInitiale ?? 0;
  const resultats: ResultatPeriode[] = periodes.map((p, i) => {
    const service = serviceDeLaPeriode(p, s);
    const dscr = service > 0 ? cfads[i] / service : null;
    const deficit = Math.max(0, service - cfads[i]);
    const tirage = Math.min(dsra, deficit);
    dsra -= tirage;
    return {
      libelle: p.libelle,
      cfads: arrondi(cfads[i]),
      service: arrondi(service),
      dscr: dscr === null ? null : arrondi(dscr),
      sousSeuil: dscr !== null && dscr < options.seuilDscr,
      deficit: arrondi(deficit),
      tirageDsra: arrondi(tirage),
      dsraFin: arrondi(dsra),
      deficitNonCouvert: arrondi(deficit - tirage),
    };
  });

  let min: ResultatPeriode | null = null;
  for (const r of resultats) if (r.dscr !== null && (min === null || r.dscr < (min.dscr as number))) min = r;
  return {
    scenario: s.nom,
    periodes: resultats,
    dscrMin: min?.dscr ?? null,
    periodeDscrMin: min?.libelle ?? null,
    nbPeriodesSousSeuil: resultats.filter((r) => r.sousSeuil).length,
    dsraMinimale: arrondi(Math.min(options.dsraInitiale ?? 0, ...resultats.map((r) => r.dsraFin))),
    deficitNonCouvertTotal: arrondi(resultats.reduce((t, r) => t + r.deficitNonCouvert, 0)),
  };
}

/**
 * LLCR à la date de calcul : valeur actualisée des CFADS restants jusqu'à la maturité
 * de la dette, divisée par la dette restant due. Taux annuel ; périodes de durée
 * `dureeAnnees` (0,5 par défaut). Les réserves ne sont pas ajoutées (pas de double
 * comptage).
 */
export function calculerLlcr(periodes: Periode[], detteRestante: number, tauxActualisation: number): number | null {
  if (detteRestante <= 0) return null;
  let t = 0;
  let va = 0;
  for (const p of periodes) {
    t += p.dureeAnnees ?? 0.5;
    va += p.cfads / Math.pow(1 + tauxActualisation, t);
  }
  return arrondi(va / detteRestante);
}

/** Financement à terminaison : besoin, ressources engagées, déficit, quote-part de dette. */
export function financementATerminaison(params: {
  budget: number;
  depassements?: number[];
  detteEngagee: number;
  fondsPropres: number;
  autresRessourcesEngagees?: number;
}) {
  const besoin = params.budget + (params.depassements ?? []).reduce((a, b) => a + b, 0);
  const ressources = params.detteEngagee + params.fondsPropres + (params.autresRessourcesEngagees ?? 0);
  return {
    besoin: arrondi(besoin),
    ressources: arrondi(ressources),
    deficit: arrondi(Math.max(0, besoin - ressources)),
    couverture: arrondi(ressources / besoin),
    quotePartDette: arrondi(params.detteEngagee / Math.max(besoin, ressources)),
  };
}
