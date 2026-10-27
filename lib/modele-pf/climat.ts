/**
 * Volet climatique, lot 1 : fiche des risques physiques par aléa, données de transition,
 * scénario climatique indicatif et données de la directive BAM 2/W/2025 (grands
 * emprunteurs). Rien ici ne modifie la note : les indicateurs sont affichés à côté de la
 * case « site à risque climatique élevé » du bloc 2, qui reste la donnée du moteur.
 *
 * Les règles marquées « lot 2 » (C11 bis, C16) ne sont calculées qu'en aperçu, pour
 * préparer leur calibrage par le comité de validation du modèle.
 *
 * Valeurs candidates (aléas pertinents, seuils, scénarios), à valider par le comité.
 */
import { z } from "zod";
import type { CodeSecteur } from "./parametres";

export const ALEAS = ["chaleur", "secheresse", "inondation", "submersion", "feux", "vents"] as const;
export type CodeAlea = (typeof ALEAS)[number];

export const LIBELLES_ALEAS: Record<CodeAlea, string> = {
  chaleur: "Chaleur extrême",
  secheresse: "Stress hydrique et sécheresse",
  inondation: "Inondation et crue",
  submersion: "Submersion marine et élévation du niveau de la mer",
  feux: "Feux de forêt",
  vents: "Tempêtes, vents violents, vents de sable",
};

export const EFFETS_ALEAS: Record<CodeAlea, string> = {
  chaleur: "Rendement des panneaux et des turbines, refroidissement, fréquentation",
  secheresse: "Récoltes, eau de process, eau de refroidissement",
  inondation: "Dommages, arrêt d'exploitation, accès coupé",
  submersion: "Prises d'eau, quais, installations côtières",
  feux: "Dommages, coupures de réseau",
  vents: "Dommages, encrassement des panneaux, arrêt des quais",
};

/** Aléas présélectionnés selon le secteur ; l'analyste peut en évaluer d'autres. */
export const ALEAS_PAR_SECTEUR: Record<CodeSecteur, CodeAlea[]> = {
  ENR: ["chaleur", "feux", "vents"],
  EAU: ["submersion", "vents", "chaleur"],
  TEL: ["chaleur", "inondation"],
  TRA: ["inondation", "feux"],
  POR: ["submersion", "vents"],
  SAN: ["inondation", "chaleur"],
  ETH: ["chaleur", "secheresse"],
  "IMMO-REND": ["inondation", "chaleur"],
  IND: ["secheresse", "inondation"],
  AGR: ["secheresse", "chaleur"],
  TOU: ["chaleur", "secheresse", "submersion", "feux"],
  MIN: ["secheresse", "inondation"],
};

export const NIVEAUX_ALEA = ["Faible", "Moyen", "Élevé"] as const;
export type NiveauAlea = (typeof NIVEAUX_ALEA)[number];

const ouiNon = z.enum(["Oui", "Non"]).nullable().default(null);

export const climatSchema = z.object({
  aleas: z.partialRecord(z.enum(ALEAS), z.object({
    niveau: z.enum(NIVEAUX_ALEA).nullable().default(null),
    source: z.string().max(300).default(""),
    adaptation: ouiNon,
  })).default({}),
  /** Commune, province ou coordonnées du site. */
  localisation: z.string().max(200).default(""),
  /** Émissions annuelles de gaz à effet de serre, scopes 1 et 2 (tCO₂e par an). */
  emissions: z.number().finite().min(0).nullable().default(null),
  /** Part du chiffre d'affaires exportée vers l'Union européenne en produits couverts par le MACF (fraction). */
  exportMacf: z.number().finite().min(0).max(1).nullable().default(null),
  /** Actif dépendant des énergies fossiles (production, combustible, procédé). */
  actifFossile: ouiNon,
  /** Plan de transition crédible et financé. */
  planTransition: ouiNon,
  /** Scénario climatique indicatif : baisse du CFADS et description. */
  chocClimatique: z.number().min(0).max(0.95).nullable().default(null),
  descriptionClimatique: z.string().max(500).default(""),
}).prefault({});

export type ClimatPF = z.infer<typeof climatSchema>;

/** Repères de transition (valeurs candidates). */
export const SEUILS_CLIMAT = {
  /** Quantification des émissions exigée par la norme de performance 3 de la SFI. */
  emissionsQuantification: 25_000,
  /** Analyse des alternatives exigée par les Principes de l'Équateur (EP4). */
  emissionsAlternatives: 100_000,
  /** Part des exportations couvertes par le MACF jugée significative. */
  macfSignificatif: 0.2,
};

/** Scénarios climatiques de référence, par secteur (valeurs candidates). */
export const SCENARIOS_CLIMAT: Record<CodeSecteur, { description: string; baisseRecettes: number; hausseCharges: number }> = {
  ENR: { description: "Canicule prolongée et vents de sable : production − 5 %, charges de nettoyage + 5 %", baisseRecettes: 0.05, hausseCharges: 0.05 },
  EAU: { description: "Tempête : prise d'eau indisponible un mois (redevance − 8 %), réparations (charges + 5 %)", baisseRecettes: 0.08, hausseCharges: 0.05 },
  TEL: { description: "Canicule : surcoût de refroidissement (charges + 15 %)", baisseRecettes: 0, hausseCharges: 0.15 },
  TRA: { description: "Crue : section coupée deux mois (trafic − 10 %), réparations (charges + 10 %)", baisseRecettes: 0.1, hausseCharges: 0.1 },
  POR: { description: "Tempête : quais arrêtés trois semaines (− 6 %), réparations (charges + 10 %)", baisseRecettes: 0.06, hausseCharges: 0.1 },
  SAN: { description: "Inondation : pénalités de disponibilité (− 3 %), remise en état (charges + 10 %)", baisseRecettes: 0.03, hausseCharges: 0.1 },
  ETH: { description: "Canicule et restriction d'eau de refroidissement (− 8 %), prix du carbone (charges + 15 %)", baisseRecettes: 0.08, hausseCharges: 0.15 },
  "IMMO-REND": { description: "Inondation : locaux indisponibles deux mois (loyers − 15 %), réparations (charges + 10 %)", baisseRecettes: 0.15, hausseCharges: 0.1 },
  IND: { description: "Sécheresse : restrictions d'eau de process (volumes − 10 %), coût de l'eau et du carbone (charges + 10 %)", baisseRecettes: 0.1, hausseCharges: 0.1 },
  AGR: { description: "Sécheresse sur deux campagnes consécutives : récolte − 35 %, charges + 5 %", baisseRecettes: 0.35, hausseCharges: 0.05 },
  TOU: { description: "Canicule et pénurie d'eau : fréquentation − 20 %, charges + 10 %", baisseRecettes: 0.2, hausseCharges: 0.1 },
  MIN: { description: "Sécheresse : restrictions d'eau (production − 15 %), charges + 10 %", baisseRecettes: 0.15, hausseCharges: 0.1 },
};

export type NiveauTransition = "Faible" | "Moyen" | "Élevé";

export interface EvaluationClimat {
  /** Aléas présélectionnés pour le secteur, puis ceux évalués en plus. */
  aleasPertinents: CodeAlea[];
  aleasEleves: CodeAlea[];
  aleasElevesSansAdaptation: CodeAlea[];
  /** Exposition déduite de la fiche : au moins un aléa élevé (null si rien n'est évalué). */
  expositionDeduite: boolean | null;
  /** Écart entre la fiche et la case du bloc 2, à expliquer par l'analyste. */
  incoherence: string | null;
  niveauTransition: NiveauTransition | null;
  motifsTransition: string[];
  /** DSCR minimum sous le scénario climatique (indicatif, sans effet sur la note). */
  dscrMinClimatique: number | null;
  classeClimatique: "Critique" | "Vigilance" | "Favorable" | "Très favorable" | null;
  /** Plafonds que les règles proposées au lot 2 déclencheraient (aperçu, non appliqué). */
  apercuLot2: { code: string; libelle: string; noteMax: number }[];
  /** Complétude des données 2/W/2025 de la fiche. */
  completude: { faits: number; attendus: number };
}

type PeriodeCalculee = { cfads: number; service: number };

/**
 * Indicateurs climatiques d'une saisie. `periodes` et `seuils` viennent du calcul du
 * moteur (échéancier retenu et seuils DSCR du dossier).
 */
export function evaluerClimat(c: ClimatPF, secteur: CodeSecteur | null, climatEleve: "Oui" | "Non" | null,
  periodes: PeriodeCalculee[], seuils: [number, number, number] | null): EvaluationClimat {
  const base = secteur ? ALEAS_PAR_SECTEUR[secteur] : [];
  const evalues = ALEAS.filter((a) => c.aleas[a]?.niveau);
  const aleasPertinents = [...base, ...evalues.filter((a) => !base.includes(a))];
  const aleasEleves = aleasPertinents.filter((a) => c.aleas[a]?.niveau === "Élevé");
  const aleasElevesSansAdaptation = aleasEleves.filter((a) => c.aleas[a]?.adaptation !== "Oui");
  const expositionDeduite = evalues.length ? aleasEleves.length > 0 : null;

  let incoherence: string | null = null;
  if (expositionDeduite === true && climatEleve === "Non") {
    incoherence = "La fiche signale un aléa élevé, mais le bloc 2 déclare le site non exposé : corrigez l'un ou l'autre, ou justifiez l'écart.";
  } else if (climatEleve === "Oui" && base.length && base.every((a) => c.aleas[a]?.niveau) && !aleasEleves.length) {
    incoherence = "Le bloc 2 déclare le site exposé, mais aucun aléa n'est évalué élevé dans la fiche.";
  }

  const motifsTransition: string[] = [];
  let niveauTransition: NiveauTransition | null = null;
  const connu = c.emissions !== null || c.exportMacf !== null || c.actifFossile !== null;
  if (connu) {
    const eleve: string[] = [], moyen: string[] = [];
    if (c.emissions !== null) {
      if (c.emissions > SEUILS_CLIMAT.emissionsAlternatives) eleve.push(`émissions supérieures à ${SEUILS_CLIMAT.emissionsAlternatives.toLocaleString("fr-FR")} tCO₂e par an`);
      else if (c.emissions > SEUILS_CLIMAT.emissionsQuantification) moyen.push(`émissions supérieures à ${SEUILS_CLIMAT.emissionsQuantification.toLocaleString("fr-FR")} tCO₂e par an`);
    }
    if (c.exportMacf !== null) {
      if (c.exportMacf >= SEUILS_CLIMAT.macfSignificatif) eleve.push("exportations significatives soumises au MACF");
      else if (c.exportMacf > 0) moyen.push("exportations soumises au MACF");
    }
    if (c.actifFossile === "Oui") {
      if (c.planTransition === "Oui") moyen.push("actif fossile avec plan de transition");
      else eleve.push("actif fossile sans plan de transition");
    }
    niveauTransition = eleve.length ? "Élevé" : moyen.length ? "Moyen" : "Faible";
    motifsTransition.push(...(eleve.length ? eleve : moyen));
  }

  let dscrMinClimatique: number | null = null;
  if (c.chocClimatique !== null) {
    const v = periodes.filter((p) => p.service > 0).map((p) => (p.cfads * (1 - (c.chocClimatique as number))) / p.service);
    dscrMinClimatique = v.length ? Math.min(...v) : null;
  }
  const classeClimatique = dscrMinClimatique === null || !seuils ? null
    : dscrMinClimatique < seuils[0] ? "Critique" : dscrMinClimatique < seuils[1] ? "Vigilance" : dscrMinClimatique < seuils[2] ? "Favorable" : "Très favorable";

  const apercuLot2: EvaluationClimat["apercuLot2"] = [];
  if (aleasElevesSansAdaptation.length) apercuLot2.push({ code: "C11", libelle: "Aléa pertinent élevé sans adaptation financée", noteMax: 6 });
  if (aleasElevesSansAdaptation.length >= 2) apercuLot2.push({ code: "C11 bis", libelle: "Au moins deux aléas élevés sans adaptation", noteMax: 5 });
  if (niveauTransition === "Élevé" && c.planTransition !== "Oui") apercuLot2.push({ code: "C16", libelle: "Risque de transition élevé sans plan de transition", noteMax: 6 });

  const attendus = base.length + 6;
  const faits = base.filter((a) => c.aleas[a]?.niveau).length
    + [c.localisation.trim() || null, c.emissions, c.exportMacf, c.actifFossile, c.planTransition, c.chocClimatique].filter((x) => x !== null).length;

  return {
    aleasPertinents, aleasEleves, aleasElevesSansAdaptation, expositionDeduite, incoherence,
    niveauTransition, motifsTransition, dscrMinClimatique, classeClimatique, apercuLot2,
    completude: { faits, attendus },
  };
}

/** Fiche climat au format CSV (séparateur « ; »), pour le reporting grands emprunteurs. */
export function ficheClimatCsv(c: ClimatPF, e: EvaluationClimat, entete: Record<string, string>): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lignes: unknown[][] = [["Rubrique", "Donnée", "Valeur", "Source ou précision"]];
  for (const [k, v] of Object.entries(entete)) lignes.push(["Dossier", k, v, ""]);
  lignes.push(["Dossier", "Localisation du site", c.localisation, ""]);
  for (const a of ALEAS) {
    const x = c.aleas[a];
    if (!x?.niveau && !e.aleasPertinents.includes(a)) continue;
    lignes.push(["Risque physique", LIBELLES_ALEAS[a], x?.niveau ?? "Non évalué", [x?.source, x?.adaptation === "Oui" ? "adaptation financée" : x?.adaptation === "Non" ? "pas d'adaptation financée" : ""].filter(Boolean).join(" ; ")]);
  }
  lignes.push(["Risque de transition", "Émissions scopes 1 et 2 (tCO₂e/an)", c.emissions, ""]);
  lignes.push(["Risque de transition", "Exportations UE couvertes par le MACF (% du CA)", c.exportMacf === null ? "" : (c.exportMacf * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 }), ""]);
  lignes.push(["Risque de transition", "Actif dépendant des énergies fossiles", c.actifFossile, ""]);
  lignes.push(["Risque de transition", "Plan de transition crédible et financé", c.planTransition, ""]);
  lignes.push(["Risque de transition", "Niveau indicatif", e.niveauTransition, e.motifsTransition.join(" ; ")]);
  lignes.push(["Scénario climatique", "Description", c.descriptionClimatique, ""]);
  lignes.push(["Scénario climatique", "Baisse du CFADS (%)", c.chocClimatique === null ? "" : (c.chocClimatique * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 }), ""]);
  lignes.push(["Scénario climatique", "DSCR minimum climatique", e.dscrMinClimatique === null ? "" : e.dscrMinClimatique.toLocaleString("fr-FR", { maximumFractionDigits: 2 }), e.classeClimatique ?? ""]);
  return "﻿" + lignes.map((l) => l.map(esc).join(";")).join("\r\n");
}
