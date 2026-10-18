/**
 * Moteur de scoring Project Finance — reproduit exactement les formules de l'outil Excel
 * (sections 1 à 12 d'un onglet de dossier) et le moteur de référence Python
 * (docs/outil-excel/generateur/moteur_reference.py). La concordance est vérifiée sur les
 * dix-huit cas d'étude (__tests__/unit/modele-pf-moteur.test.ts).
 */
import {
  PARAMETRES_DEFAUT, ORDRE_DOMAINES, DOMAINES_GRILLE, ORDRE_PLAFONDS, ORDRE_VERROUS,
  type ParametresModele, type CodeRegime, type CodePhase, type CodeSecteur, type CodeDomaine,
  type DomaineGrille, type CodePlafond, type CodeVerrou,
} from "./parametres";

export const INFO_INSUFFISANTE = "Info. insuffisante" as const;
/** Note d'un critère : une ancre (100, 80, 50, 20 par défaut), « Info. insuffisante » ou non saisie. */
export type Note = number | typeof INFO_INSUFFISANTE | null;
export type OuiNon = "Oui" | "Non" | null;
export type QualiteAcheteur = "≥ BBB−" | "< BBB−" | "Non noté" | null;
export type NatureRessource =
  | "Dette senior" | "Dette subordonnée" | "Fonds propres" | "Quasi-fonds propres" | "Engagement sponsor"
  | "Ligne dédiée engagée" | "Subvention encaissée" | "Autre ressource";

export interface Periode { libelle: string; cfads: number; service: number; cfadsStresse?: number | null }

export interface DossierPF {
  regime: CodeRegime | null;
  secteur: CodeSecteur | null;
  phase: CodePhase | null;
  climatEleve: OuiNon;
  proportionnalite: {
    exposition: number | null; toutEnMad: OuiNon; duree: number | null; technologieEprouvee: OuiNon;
    epcCleEnMain: OuiNon; acheteurUnique: OuiNon; premiereReference: OuiNon; consortium: OuiNon;
    contratPlus20Ans: OuiNon; nbContreparties: number | null;
  };
  emplois: { libelle: string; montant: number }[];
  ressources: { libelle: string; montant: number; nature: NatureRessource | null }[];
  planRemediation: OuiNon;
  /** Baisse du CFADS appliquée à chaque période sans CFADS stressé saisi (0,15 = 15 %). */
  choc: number | null;
  periodes: Periode[];
  /** N3 hors phase P1 (note fondée sur le LLCR). */
  n3Llcr: Note;
  n4: Note; n5: Note; n6: Note;
  donneesPlafonds: {
    llcr: number | null; dsraMois: number | null; expositionDevises: number | null; detteARefinancer: number | null;
    strategieRefinancement: OuiNon; partAcheteur: number | null; qualiteAcheteur: QualiteAcheteur;
    dureeContrat: number | null; dureeDette: number | null; solutionContrat: OuiNon; planClimat: OuiNon;
    capaciteSponsor: OuiNon; operateurRemplacable: OuiNon; ecartOm: number | null; expositionGroupe: OuiNon;
  };
  grille: Partial<Record<DomaineGrille, Note[]>>;
  /** « Oui » = verrou constaté (pour B6 : modèle de flux absent ou non rapproché). */
  verrous: Partial<Record<CodeVerrou, OuiNon>>;
}

export type Classe = "Critique" | "Vigilance" | "Favorable" | "Très favorable" | "Différé";
export type EtatPlafond = "Oui" | "Non" | "n.r." | "n.a.";

export interface ResultatPeriode { libelle: string; cfads: number; service: number; dscr: number | null; classe: Classe; dscrStresse: number | null }

export interface ResultatPF {
  capex: number; ressources: number; dette: number; couverture: number | null; quotePart: number | null;
  seuils: [number, number, number] | null;
  periodes: ResultatPeriode[];
  dscrMin: number | null; dscrMinStresse: number | null; cfadsNegatifs: number;
  noyau: (number | typeof INFO_INSUFFISANTE | null)[];
  d7: number;
  domaines: Record<DomaineGrille, number | null>;
  couvertureGrille: number | null; completude: number | null;
  contributions: Record<CodeDomaine, number>; poids: Record<CodeDomaine, number> | null;
  score: number | null; noteCalculee: number | null;
  verrousActifs: CodeVerrou[];
  plafonds: Record<CodePlafond, EtatPlafond>; plafondsActifs: CodePlafond[]; plafond: number;
  regimeCalcule: "S" | "M" | "L" | null; regimeRetenu: "S" | "M" | "L" | null; motifsEscalade: string[];
  noteApprouvee: number | "—" | null;
  statut: string; libelle: string; orientation: string;
  /** Saisies requises encore manquantes (libellés), pour guider l'analyste. */
  manquants: string[];
}

const estNombre = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const arrondi6 = (x: number) => Math.round(x * 1e6) / 1e6;

export function evaluer(d: DossierPF, P: ParametresModele = PARAMETRES_DEFAUT): ResultatPF {
  const A = P.ancres, T = P.seuils;
  const manquants: string[] = [];
  const reg = d.regime, sec = d.secteur, ph = d.phase;
  if (!reg) manquants.push("Régime de revenus");
  if (!sec) manquants.push("Secteur");
  if (!ph) manquants.push("Phase");

  // 3 · sources et emplois
  const capex = d.emplois.reduce((s, e) => s + (estNombre(e.montant) ? e.montant : 0), 0);
  const ressources = d.ressources.reduce((s, r) => s + (estNombre(r.montant) ? r.montant : 0), 0);
  const dette = d.ressources.filter((r) => r.nature === "Dette senior" || r.nature === "Dette subordonnée")
    .reduce((s, r) => s + (estNombre(r.montant) ? r.montant : 0), 0);
  const couverture = capex > 0 ? ressources / capex : null;
  const quotePart = capex > 0 ? dette / capex : null;
  if (capex <= 0) manquants.push("Emplois (besoin à terminaison)");

  // 5 · seuils applicables
  const seuils = reg && sec && ph
    ? (P.regimes[reg].seuils.map((x) => arrondi6(x + P.secteurs[sec].delta + P.phases[ph].majoration)) as [number, number, number])
    : null;
  const classe = (v: number): "C" | "V" | "F" | "TF" =>
    !seuils ? "C" : v < seuils[0] ? "C" : v < seuils[1] ? "V" : v < seuils[2] ? "F" : "TF";
  const ancre = { C: A.critique, V: A.vigilance, F: A.favorable, TF: A.tresFavorable };
  const nomClasse = { C: "Critique", V: "Vigilance", F: "Favorable", TF: "Très favorable" } as const;

  // 6 · échéancier
  const choc = estNombre(d.choc) ? d.choc : 0;
  const periodes: ResultatPeriode[] = d.periodes.filter((p) => estNombre(p.cfads) && estNombre(p.service)).map((p) => {
    if (p.service === 0) return { libelle: p.libelle, cfads: p.cfads, service: 0, dscr: null, classe: "Différé", dscrStresse: null };
    const dscr = p.cfads / p.service;
    const cl: Classe = p.cfads < 0 ? "Critique" : nomClasse[classe(dscr)];
    const cfs = estNombre(p.cfadsStresse) ? p.cfadsStresse : p.cfads * (1 - choc);
    return { libelle: p.libelle, cfads: p.cfads, service: p.service, dscr, classe: cl, dscrStresse: cfs / p.service };
  });
  const dscrs = periodes.map((p) => p.dscr).filter(estNombre);
  const dscrsS = periodes.map((p) => p.dscrStresse).filter(estNombre);
  const cfadsNegatifs = periodes.filter((p) => p.cfads < 0).length;
  const dscrMin = dscrs.length ? Math.min(...dscrs) : null;
  const dscrMinStresse = dscrsS.length ? Math.min(...dscrsS) : null;
  if (periodes.length < 2) manquants.push("Échéancier (au moins deux périodes)");
  if (!estNombre(d.choc)) manquants.push("Choc du scénario défavorable");

  // 7 · noyau
  const N: (number | typeof INFO_INSUFFISANTE | null)[] = [null, null, null, null, null, null];
  if (dscrMin !== null && seuils) N[0] = cfadsNegatifs > 0 ? A.critique : ancre[classe(dscrMin)];
  if (dscrMinStresse !== null && seuils) N[1] = ancre[classe(dscrMinStresse)];
  if (ph === "P1") {
    if (couverture !== null) {
      N[2] = couverture >= T.n3TresFavorable ? A.tresFavorable : couverture >= T.n3Favorable ? A.favorable
        : couverture >= T.n3Vigilance && d.planRemediation === "Oui" ? A.vigilance : A.critique;
    }
  } else N[2] = d.n3Llcr ?? null;
  N[3] = d.n4 ?? null; N[4] = d.n5 ?? null; N[5] = d.n6 ?? null;
  ["N1", "N2", "N3", "N4", "N5", "N6"].forEach((c, i) => { if (N[i] === null) manquants.push(`Indicateur ${c}`); });
  const d7 = N.reduce<number>((s, n, i) => s + (estNombre(n) ? n : A.infoInsuffisante) * P.poidsNoyau[i], 0);

  // 8 · grille
  const pw = ph ? P.poidsDomaines[ph] : null;
  const domaines = {} as Record<DomaineGrille, number | null>;
  let couvNum = 0, couvDen = 0, nbReq = 0, nbReqNum = 0;
  for (const dom of DOMAINES_GRILLE) {
    const scs = P.sousCriteres[dom];
    const notes = d.grille[dom] ?? [];
    const w = pw ? pw[dom] : 0;
    let sc = 0;
    scs.forEach((s, j) => { const n = notes[j]; sc += estNombre(n) ? n * s.poids : A.infoInsuffisante * s.poids; });
    domaines[dom] = w > 0 ? sc : null;
    couvNum += w * scs.reduce((s, x, j) => s + (estNombre(notes[j]) ? x.poids : 0), 0);
    couvDen += w;
    if (w > 0) {
      nbReq += scs.length;
      scs.forEach((x, j) => {
        if (estNombre(notes[j])) nbReqNum += 1;
        else if (notes[j] === null || notes[j] === undefined) manquants.push(`Sous-critère ${x.cle} ${x.libelle}`);
      });
    }
  }
  const couvertureGrille = pw && couvDen > 0 ? couvNum / couvDen : null;
  const completude = pw ? (N.filter(estNombre).length + nbReqNum) / (6 + nbReq) : null;

  // 9 · agrégation
  const contributions = {} as Record<CodeDomaine, number>;
  let score: number | null = null;
  if (pw) {
    score = 0;
    for (const dom of ORDRE_DOMAINES) {
      const v = dom === "D7" ? d7 : domaines[dom as DomaineGrille];
      contributions[dom] = (estNombre(v) ? v : 0) * pw[dom];
      score += contributions[dom];
    }
  } else ORDRE_DOMAINES.forEach((dom) => (contributions[dom] = 0));
  const ligneConv = score === null ? null : [...P.conversion].reverse().find((c) => score! >= c.seuil) ?? P.conversion[0];
  const noteCalculee = ligneConv ? ligneConv.note : null;

  // 10 · verrous
  const v: Partial<Record<CodeVerrou, OuiNon>> = { ...d.verrous };
  if (ph === "P1" && couverture !== null && couverture < T.n3Vigilance) v.B3 = "Oui";
  if (completude !== null && completude < 1) v.B7 = "Oui";
  const verrousActifs = ORDRE_VERROUS.filter((c) => v[c] === "Oui");

  // 11 · plafonds
  const p = d.donneesPlafonds;
  const vide = (x: unknown) => x === null || x === undefined || x === "";
  const ouiNon = (dispo: boolean, cond: boolean): EtatPlafond => (!dispo ? "n.r." : cond ? "Oui" : "Non");
  const pl = {} as Record<CodePlafond, EtatPlafond>;
  pl.C1 = ouiNon(dscrMin !== null, dscrMin !== null && dscrMin < T.c1);
  pl.C2 = ouiNon(dscrMin !== null && !!seuils, dscrMin !== null && !!seuils && dscrMin < seuils[0]);
  pl.C3 = ouiNon(dscrMinStresse !== null, dscrMinStresse !== null && dscrMinStresse < T.c3);
  pl.C4 = ouiNon(!vide(p.llcr), (p.llcr ?? 0) < T.c4);
  pl.C5 = reg === "R4" ? "n.a." : ouiNon(!vide(p.dureeContrat) && !vide(p.dureeDette),
    (p.dureeContrat ?? 0) < (p.dureeDette ?? 0) && p.solutionContrat !== "Oui");
  pl.C6 = ouiNon(!vide(p.expositionDevises), (p.expositionDevises ?? 0) > T.c6);
  pl.C7 = ouiNon(!vide(p.dsraMois), (p.dsraMois ?? 0) < T.c7);
  pl.C8 = ouiNon(!vide(p.detteARefinancer), (p.detteARefinancer ?? 0) > T.c8 && p.strategieRefinancement !== "Oui");
  pl.C9 = ouiNon(quotePart !== null, (quotePart ?? 0) > T.c9);
  pl.C10 = ouiNon(!vide(p.partAcheteur) && !vide(p.qualiteAcheteur), (p.partAcheteur ?? 0) > T.c10 && p.qualiteAcheteur !== "≥ BBB−");
  pl.C11 = ouiNon(!vide(d.climatEleve), d.climatEleve === "Oui" && p.planClimat !== "Oui");
  pl.C12 = ouiNon(!vide(p.capaciteSponsor), p.capaciteSponsor === "Non");
  pl.C13 = ouiNon(!vide(p.operateurRemplacable), p.operateurRemplacable === "Non" && (p.ecartOm ?? 0) > T.c13);
  pl.C14 = ouiNon(!vide(p.expositionGroupe), p.expositionGroupe === "Oui");
  pl.C15 = ouiNon(couvertureGrille !== null && completude !== null,
    (couvertureGrille ?? 1) < T.couvertureGrille || (completude ?? 1) < 1);
  const plafondsActifs = ORDRE_PLAFONDS.filter((c) => pl[c] === "Oui");
  const plafond = Math.min(10, ...plafondsActifs.map((c) => P.plafonds[c].niveau));

  // 2 · proportionnalité (après verrous et plafonds, comme dans l'Excel)
  const pr = d.proportionnalite;
  const motifs: string[] = [];
  if (capex > T.lCapex) motifs.push(`CAPEX > ${T.lCapex} MMAD`);
  if ((pr.exposition ?? 0) > T.lExpo) motifs.push(`exposition > ${T.lExpo} MMAD`);
  if (reg === "R4") motifs.push("régime de revenus R4");
  if (pr.premiereReference === "Oui") motifs.push("première référence technologique");
  if ((p.expositionDevises ?? 0) > 0) motifs.push("exposition en devises non couverte");
  if (pr.consortium === "Oui") motifs.push("opération consortiale (directive 3/W/2025)");
  if (pr.contratPlus20Ans === "Oui") motifs.push("concession ou contrat de revenus > 20 ans");
  if (d.climatEleve === "Oui") motifs.push("site à risque climatique élevé");
  if ((pr.nbContreparties ?? 0) > T.lNbContreparties) motifs.push(`plus de ${T.lNbContreparties} contreparties clés`);
  let regimeCalcule: "S" | "M" | "L" | null = null;
  if (capex > 0 && reg) {
    if (motifs.length) regimeCalcule = "L";
    else if (capex <= T.sCapex && estNombre(pr.exposition) && pr.exposition <= T.sExpo && (reg === "R1" || reg === "R2")
      && pr.technologieEprouvee === "Oui" && pr.toutEnMad === "Oui" && estNombre(pr.duree) && pr.duree <= T.sDuree
      && (ph !== "P1" || pr.epcCleEnMain === "Oui") && pr.acheteurUnique === "Oui" && verrousActifs.length === 0) regimeCalcule = "S";
    else regimeCalcule = "M";
  }
  let regimeRetenu = regimeCalcule;
  if (regimeRetenu === "S" && verrousActifs.length) regimeRetenu = "M";
  if (regimeRetenu === "M" && plafondsActifs.length) regimeRetenu = "L";

  // 12 · note approuvée et statut
  const x = verrousActifs.filter((c) => c.startsWith("X"));
  const b = verrousActifs.filter((c) => c.startsWith("B"));
  let noteApprouvee: number | "—" | null;
  let statut: string;
  if (noteCalculee === null) { noteApprouvee = null; statut = "Dossier incomplet"; }
  else if (x.length) { noteApprouvee = "—"; statut = "Hors périmètre — aucune note produite"; }
  else {
    noteApprouvee = Math.min(noteCalculee, plafond);
    if (b.length) statut = "Note provisoire — stade bloqué : " + b.map((c) => `${c} (${P.verrous[c].stade})`).join(", ");
    else if (pl.C15 === "Oui") statut = "Note provisoire — évaluation partielle (C15)";
    else statut = "Note validable, à soumettre au comité";
  }
  const ligne = typeof noteApprouvee === "number" ? P.conversion.find((c) => c.note === noteApprouvee) : undefined;

  return {
    capex, ressources, dette, couverture, quotePart, seuils, periodes, dscrMin, dscrMinStresse, cfadsNegatifs,
    noyau: N, d7, domaines, couvertureGrille, completude, contributions, poids: pw, score, noteCalculee,
    verrousActifs, plafonds: pl, plafondsActifs, plafond, regimeCalcule, regimeRetenu, motifsEscalade: motifs,
    noteApprouvee, statut,
    libelle: ligne?.libelle ?? "—",
    orientation: ligne?.orientation ?? (noteApprouvee === "—" ? "Aucune note : dossier hors périmètre" : "—"),
    manquants,
  };
}
