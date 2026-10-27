/**
 * Saisie d'un scoring Project Finance : les treize blocs de l'outil Excel, sous une forme
 * stockée telle quelle (EvaluationPF.saisie). La grille et N4 à N6 se saisissent par une
 * situation décrite (niveau 1 à 4, ou 5 = « Info. insuffisante ») : la note s'en déduit
 * avec les ancres du paramétrage.
 */
import { z } from "zod";
import { INFO_INSUFFISANTE, evaluer, type DossierPF, type Note, type ResultatPF } from "./moteur";
import {
  PARAMETRES_DEFAUT, DOMAINES_GRILLE, ORDRE_VERROUS,
  type ParametresModele, type DomaineGrille, type CodeVerrou,
} from "./parametres";
import { options as optionsReferentiel, NIVEAUX_LIBELLES } from "./referentiel";
import { originesSchema } from "./origines";
import { ALEAS, ALEAS_PAR_SECTEUR, LIBELLES_ALEAS, climatSchema } from "./climat";

/** 1 Très favorable · 2 Favorable · 3 Vigilance · 4 Critique · 5 Info. insuffisante */
export type Niveau = 1 | 2 | 3 | 4 | 5;

const ouiNon = z.enum(["Oui", "Non"]).nullable().default(null);
const nombre = z.number().finite().nullable().default(null);
const texte = (max = 2000) => z.string().max(max).default("");
const niveau = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).nullable().default(null);

export const saisieSchema = z.object({
  // Bloc 1 · identification et routage (les codes client et projet sont ceux des fiches)
  regime: z.enum(["R1", "R2", "R3", "R4"]).nullable().default(null),
  secteur: z.enum(["ENR", "EAU", "TEL", "TRA", "POR", "SAN", "ETH", "IMMO-REND", "IND", "AGR", "TOU", "MIN"]).nullable().default(null),
  phase: z.enum(["P1", "P2", "P3"]).nullable().default(null),
  periodicite: z.enum(["Semestrielle", "Trimestrielle", "Mensuelle"]).default("Semestrielle"),
  famille: z.literal("PF-FLUX").default("PF-FLUX"),
  // Bloc 2 · proportionnalité (le régime S/M/L est calculé)
  proportionnalite: z.object({
    exposition: nombre, toutEnMad: ouiNon, duree: nombre, technologieEprouvee: ouiNon, epcCleEnMain: ouiNon,
    acheteurUnique: ouiNon, premiereReference: ouiNon, consortium: ouiNon, contratPlus20Ans: ouiNon, nbContreparties: nombre,
  }).prefault({}),
  climatEleve: ouiNon,
  // Bloc 3 · sources et emplois (les crédits de la banque sont ceux du projet)
  emplois: z.array(z.object({ libelle: texte(200), montant: nombre })).max(20).default([]),
  ressources: z.array(z.object({
    libelle: texte(200), montant: nombre,
    nature: z.enum(["Dette senior", "Dette subordonnée", "Fonds propres", "Quasi-fonds propres", "Engagement sponsor",
      "Ligne dédiée engagée", "Subvention encaissée", "Autre ressource"]).nullable().default(null),
  })).max(20).default([]),
  planRemediation: ouiNon,
  // Bloc 4 · données sectorielles (dans l'ordre des champs du secteur) et hypothèses libres
  donneesSecteur: z.array(z.object({ valeur: z.union([z.string().max(200), z.number().finite()]).nullable().default(null), source: texte(300) })).max(10).default([]),
  hypotheses: z.array(z.object({ libelle: texte(200), valeur: texte(300) })).max(20).default([]),
  // Bloc 6 · échéancier daté
  choc: z.number().min(0).max(0.95).nullable().default(null),
  descriptionStress: texte(500),
  periodes: z.array(z.object({
    libelle: texte(60), cfads: nombre, service: z.number().min(0).nullable().default(null), cfadsStresse: nombre,
  })).max(60).default([]),
  // Bloc 7 · noyau financier
  n3Llcr: z.union([z.literal(100), z.literal(80), z.literal(50), z.literal(20), z.literal(INFO_INSUFFISANTE)]).nullable().default(null),
  noyau: z.partialRecord(z.enum(["N4", "N5", "N6"]), z.object({ niveau, justification: texte() })).default({}),
  donneesPlafonds: z.object({
    llcr: nombre, dsraMois: nombre, expositionDevises: nombre, detteARefinancer: nombre, strategieRefinancement: ouiNon,
    partAcheteur: nombre, qualiteAcheteur: z.enum(["≥ BBB−", "< BBB−", "Non noté"]).nullable().default(null),
    dureeContrat: nombre, dureeDette: nombre, solutionContrat: ouiNon, planClimat: ouiNon, capaciteSponsor: ouiNon,
    operateurRemplacable: ouiNon, ecartOm: nombre, expositionGroupe: ouiNon,
  }).prefault({}),
  // Bloc 8 · grille : situation choisie et commentaire par sous-critère (clé « D2.1 »)
  grille: z.record(z.string().regex(/^D[1-9]\.[1-4]$/), z.object({ niveau, commentaire: texte() })).default({}),
  commentairesDomaines: z.record(z.string().regex(/^D[1-9]$/), texte()).default({}),
  // Bloc 10 · verrous constatés (« Oui » = fait générateur constaté ; B3 et B7 sont aussi détectés)
  verrous: z.partialRecord(z.enum(ORDRE_VERROUS as [CodeVerrou, ...CodeVerrou[]]), ouiNon).default({}),
  // Bloc 13 · commentaires et conditions
  bloc13: z.object({
    synthese: texte(5000), forces: texte(5000), faiblesses: texte(5000), conditions: texte(5000), justification: texte(5000),
    avis: z.enum(["Favorable", "Favorable sous conditions", "Réservé", "Défavorable"]).nullable().default(null), avisMotif: texte(),
    decision: z.enum(["Accord", "Accord sous conditions", "Ajournement", "Refus"]).nullable().default(null), decisionCommentaire: texte(),
  }).prefault({}),  // Volet climatique (lot 1, sans effet sur la note) : aléas, transition, scénario climatique
  climat: climatSchema,
  // Origine des valeurs non tapées (IA, calcul d'aide, référence, collage), par clé du fichier d'échange
  origines: originesSchema,
});

export type SaisiePF = z.infer<typeof saisieSchema>;

export function saisieVide(): SaisiePF {
  return saisieSchema.parse({});
}

export const AVIS = ["Favorable", "Favorable sous conditions", "Réservé", "Défavorable"] as const;
export const DECISIONS = ["Accord", "Accord sous conditions", "Ajournement", "Refus"] as const;

/** Note correspondant à un niveau choisi, selon les ancres du paramétrage. */
export function noteDuNiveau(n: Niveau | null | undefined, P: ParametresModele = PARAMETRES_DEFAUT): Note {
  if (!n) return null;
  if (n === 5) return INFO_INSUFFISANTE;
  return [P.ancres.tresFavorable, P.ancres.favorable, P.ancres.vigilance, P.ancres.critique][n - 1];
}

/** Niveau correspondant à une note (pour reprendre un cas noté 100 / 80 / 50 / 20). */
export function niveauDeLaNote(note: Note, P: ParametresModele = PARAMETRES_DEFAUT): Niveau | null {
  if (note === null || note === undefined) return null;
  if (note === INFO_INSUFFISANTE) return 5;
  const i = [P.ancres.tresFavorable, P.ancres.favorable, P.ancres.vigilance, P.ancres.critique].indexOf(note);
  return i < 0 ? null : ((i + 1) as Niveau);
}

/** Saisie → données du moteur. */
export function versDossier(s: SaisiePF, P: ParametresModele = PARAMETRES_DEFAUT): DossierPF {
  const grille: Partial<Record<DomaineGrille, Note[]>> = {};
  for (const d of DOMAINES_GRILLE) grille[d] = P.sousCriteres[d].map((sc) => noteDuNiveau(s.grille[sc.cle]?.niveau, P));
  return {
    regime: s.regime, secteur: s.secteur, phase: s.phase, climatEleve: s.climatEleve,
    proportionnalite: s.proportionnalite,
    emplois: s.emplois.filter((e) => e.montant !== null).map((e) => ({ libelle: e.libelle, montant: e.montant as number })),
    ressources: s.ressources.filter((r) => r.montant !== null).map((r) => ({ libelle: r.libelle, montant: r.montant as number, nature: r.nature })),
    planRemediation: s.planRemediation,
    choc: s.choc,
    periodes: s.periodes.filter((p) => p.cfads !== null && p.service !== null)
      .map((p) => ({ libelle: p.libelle, cfads: p.cfads as number, service: p.service as number, cfadsStresse: p.cfadsStresse })),
    n3Llcr: s.phase === "P1" ? null : s.n3Llcr,
    n4: noteDuNiveau(s.noyau.N4?.niveau, P), n5: noteDuNiveau(s.noyau.N5?.niveau, P), n6: noteDuNiveau(s.noyau.N6?.niveau, P),
    donneesPlafonds: s.donneesPlafonds,
    grille,
    verrous: s.verrous,
    climat: s.climat,
  };
}

export interface Controle { bloc: number; libelle: string; cible?: string }

/**
 * Saisies exigées encore manquantes, dans l'ordre des blocs (la ligne « À SAISIR » de
 * l'Excel) : saisies du moteur, commentaires exigés, synthèse et justification des écarts.
 */
export function controlesSaisie(s: SaisiePF, r: ResultatPF, P: ParametresModele = PARAMETRES_DEFAUT, codes?: { codeClientT24?: string | null; radical?: string | null; codeProjet?: string | null }): Controle[] {
  const c: Controle[] = [];
  const ajoute = (bloc: number, libelle: string, cible?: string) => c.push({ bloc, libelle, cible });
  if (codes) {
    if (!codes.codeClientT24) ajoute(1, "Code client T24 (fiche client)", "codes");
    if (!codes.radical) ajoute(1, "Radical du client (fiche client)", "codes");
    if (!codes.codeProjet) ajoute(1, "Code projet (fiche projet)", "codes");
  }
  if (!s.regime) ajoute(1, "Régime de revenus", "regime");
  if (!s.secteur) ajoute(1, "Secteur du projet", "secteur");
  if (!s.phase) ajoute(1, "Phase du projet", "phase");
  const pr = s.proportionnalite;
  if (pr.exposition === null) ajoute(2, "Exposition de la banque", "exposition");
  const ouiNonProp: [keyof typeof pr, string][] = [["toutEnMad", "Recettes, coûts et dette en dirhams ?"], ["technologieEprouvee", "Technologie éprouvée ?"],
    ["acheteurUnique", "Acheteur principal unique ?"], ["premiereReference", "Première référence technologique ?"], ["consortium", "Opération consortiale ?"],
    ["contratPlus20Ans", "Contrat de revenus de plus de 20 ans ?"]];
  for (const [k, l] of ouiNonProp) if (pr[k] === null) ajoute(2, l, k);
  if (pr.duree === null) ajoute(2, "Durée du financement", "duree");
  if (s.phase === "P1" && pr.epcCleEnMain === null) ajoute(2, "EPC clé-en-main de moins de 18 mois ?", "epcCleEnMain");
  if (s.climatEleve === null) ajoute(2, "Site à risque climatique élevé ?", "climatEleve");
  if (pr.nbContreparties === null) ajoute(2, "Nombre de contreparties clés", "nbContreparties");
  if (r.capex <= 0) ajoute(3, "Emplois : montants du besoin à terminaison", "emplois");
  if (r.ressources <= 0) ajoute(3, "Ressources engagées : montants", "ressources");
  if (s.ressources.some((x) => x.montant !== null && !x.nature)) ajoute(3, "Nature de chaque ressource", "ressources");
  if (s.phase === "P1" && r.couverture !== null && r.couverture >= P.seuils.n3Vigilance && r.couverture < P.seuils.n3Favorable && !s.planRemediation)
    ajoute(3, "Plan de remédiation (couverture entre 95 et 100 %)", "planRemediation");
  if (s.choc === null) ajoute(6, "Choc du scénario défavorable", "choc");
  if (r.periodes.length < 2) ajoute(6, "Échéancier : au moins deux périodes", "periodes");
  if (s.periodes.some((p) => p.cfads !== null && p.service === null)) ajoute(6, "Service de la dette de chaque période", "periodes");
  for (const n of ["N4", "N5", "N6"] as const) {
    const x = s.noyau[n];
    if (!x?.niveau) ajoute(7, `${n} : situation à choisir`, n);
    else if (x.niveau >= 4 && !x.justification.trim()) ajoute(7, `${n} : justification exigée (Critique ou Info. insuffisante)`, n);
  }
  if (s.phase && s.phase !== "P1" && s.n3Llcr === null) ajoute(7, "N3 hors phase P1 : note LLCR", "n3Llcr");
  const d = s.donneesPlafonds;
  const req: [keyof typeof d, string][] = [["llcr", "LLCR (plafond C4)"], ["dsraMois", "DSRA en mois (plafond C7)"], ["expositionDevises", "Exposition nette en devises (C6)"],
    ["detteARefinancer", "Dette à refinancer à maturité (C8)"], ["partAcheteur", "Part des recettes de l'acheteur principal (C10)"],
    ["qualiteAcheteur", "Qualité de crédit de l'acheteur principal"], ["dureeDette", "Durée résiduelle de la dette"],
    ["capaciteSponsor", "Capacité résiduelle du sponsor (C12)"], ["operateurRemplacable", "Opérateur remplaçable ? (C13)"],
    ["expositionGroupe", "Facteur commun au-delà de la limite interne (C14)"]];
  for (const [k, l] of req) if (d[k] === null) ajoute(7, l, String(k));
  if (s.regime !== "R4" && d.dureeContrat === null) ajoute(7, "Durée résiduelle du contrat de revenus (C5)", "dureeContrat");
  if ((d.detteARefinancer ?? 0) > P.seuils.c8 && !d.strategieRefinancement) ajoute(7, "Stratégie de refinancement approuvée ?", "strategieRefinancement");
  if (d.dureeContrat !== null && d.dureeDette !== null && d.dureeContrat < d.dureeDette && !d.solutionContrat)
    ajoute(7, "Solution documentée (contrat plus court que la dette) ?", "solutionContrat");
  // Lot 2 du volet climatique : l'adaptation se renseigne par aléa dans la fiche climat.
  if (s.climatEleve === "Oui" && !d.planClimat && !(r.climat && r.climat.expositionDeduite !== null)) ajoute(7, "Plan d'adaptation climatique financé ? (C11)", "planClimat");
  if (d.operateurRemplacable === "Non" && d.ecartOm === null) ajoute(7, "Écart fin O&M / fin de dette", "ecartOm");
  // Grille : sous-critères requis par la phase
  const pw = s.phase ? P.poidsDomaines[s.phase] : null;
  for (const dom of DOMAINES_GRILLE) {
    if (!pw || pw[dom] <= 0) continue;
    for (const sc of P.sousCriteres[dom]) {
      const x = s.grille[sc.cle];
      if (!x?.niveau) ajoute(8, `${sc.cle} ${sc.libelle} : situation à choisir`, sc.cle);
      else if (x.niveau >= 4 && !x.commentaire.trim()) ajoute(8, `${sc.cle} : commentaire exigé (Critique ou Info. insuffisante)`, sc.cle);
    }
  }
  for (const v of ORDRE_VERROUS) if (s.verrous[v] === undefined || s.verrous[v] === null) { ajoute(10, "Verrous X1 à B8 : répondre Oui ou Non", "verrous"); break; }
  if (r.climat) {
    const presel = s.secteur ? ALEAS_PAR_SECTEUR[s.secteur] : [];
    if (presel.some((a) => !s.climat.aleas[a]?.niveau)) ajoute(14, "Fiche climat : exposition des aléas présélectionnés", "climat.aleas");
    for (const a of ALEAS) {
      const x = s.climat.aleas[a];
      if (x?.niveau === "Élevé" && !x.adaptation) ajoute(14, `Adaptation financée ? (${LIBELLES_ALEAS[a]})`, "climat.aleas");
    }
    if (r.climat.niveauTransition === null) ajoute(14, "Données de transition : émissions, actif fossile, exportations MACF", "climat.emissions");
    if (r.climat.expositionRetenue === "Oui" && r.climat.dscrMinClimatique === null) ajoute(14, "Scénario climatique : baisse du CFADS (site exposé)", "climat.choc");
  }
  if (!s.bloc13.synthese.trim()) ajoute(13, "Synthèse de l'analyste", "synthese");
  if (justificationExigee(s, r) && !s.bloc13.justification.trim())
    ajoute(13, "Justification des écarts (plafond, verrou ou info. insuffisante actif)", "justification");
  return c;
}

/** Justification des écarts obligatoire : un plafond, un verrou ou une information insuffisante est actif. */
export function justificationExigee(s: SaisiePF, r: ResultatPF): boolean {
  const info = Object.values(s.grille).some((x) => x?.niveau === 5) || Object.values(s.noyau).some((x) => x?.niveau === 5);
  return r.plafondsActifs.length > 0 || r.verrousActifs.length > 0 || info;
}

/** Calcul complet : résultat du moteur et contrôles de saisie. */
export function calculer(s: SaisiePF, P: ParametresModele = PARAMETRES_DEFAUT, codes?: Parameters<typeof controlesSaisie>[3]) {
  const resultat = evaluer(versDossier(s, P), P);
  return { resultat, controles: controlesSaisie(s, resultat, P, codes) };
}

/** Texte des situations proposées pour un sous-critère (ou N4 à N6), selon le secteur. */
export function situations(cle: string, secteur: string | null): string[] {
  return optionsReferentiel(cle, secteur);
}
export { NIVEAUX_LIBELLES };

/**
 * Relit une saisie stockée. Si elle ne passe plus le schéma (saisie enregistrée sous une
 * version antérieure du formulaire), chaque bloc valide est conservé et seul le bloc
 * fautif reprend sa valeur vide : l'écran s'ouvre, et rien d'autre n'est perdu.
 */
export function relireSaisie(brut: unknown): SaisiePF {
  const v = saisieSchema.safeParse(brut);
  if (v.success) return v.data;
  const source = brut && typeof brut === "object" ? (brut as Record<string, unknown>) : {};
  const garde: Record<string, unknown> = {};
  for (const [cle, champ] of Object.entries(saisieSchema.shape)) {
    if (cle in source && (champ as z.ZodTypeAny).safeParse(source[cle]).success) garde[cle] = source[cle];
  }
  return saisieSchema.parse(garde);
}
