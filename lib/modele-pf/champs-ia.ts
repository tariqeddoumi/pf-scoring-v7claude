/**
 * Champs que la lecture des pièces par l'IA peut alimenter, avec les clés du fichier
 * d'échange « PF-PROPOSITIONS-IA v1 » de l'outil Excel (feuille « Champs IA » ; cf.
 * liste_champs_ia dans docs/outil-excel/generateur/build_tool.py). Une même clé se lit
 * et s'écrit dans la saisie web : la macro Excel et l'écran web partagent le format.
 *
 * Valeurs canoniques : texte ; nombre ; pourcentage en fraction (0,15 = 15 %) ; « Oui »
 * ou « Non » ; valeur d'une liste ; situation par son niveau (« Favorable »…).
 */
import { PARAMETRES_DEFAUT, DOMAINES_GRILLE, ORDRE_VERROUS, type CodeVerrou } from "./parametres";
import { INFO_INSUFFISANTE } from "./moteur";
import { AVIS, NIVEAUX_LIBELLES, type Niveau, type SaisiePF } from "./saisie";
import { champsSecteur } from "./referentiel";

export const FORMAT_PROPOSITIONS = "PF-PROPOSITIONS-IA v1";

export type TypeChamp = "texte" | "nombre" | "pourcentage" | "ouinon" | "liste" | "situation";
export type ValeurChamp = string | number;

export interface ChampIA {
  cle: string;
  libelle: string;
  bloc: number;
  type: TypeChamp;
  /** Valeurs admises (liste, oui/non, situation). */
  valeurs?: readonly string[];
}

/** Tailles des listes de l'outil Excel (lignes disponibles dans la feuille de saisie). */
export const NB_EMPLOIS = 8;
export const NB_RESSOURCES = 8;
export const NB_HYPOTHESES = 8;
export const NB_ECHEANCES = 60;
export const NB_DONNEES_SECTEUR = 6;

const OUI_NON = ["Oui", "Non"] as const;
const NATURES = ["Dette senior", "Dette subordonnée", "Fonds propres", "Quasi-fonds propres", "Engagement sponsor",
  "Ligne dédiée engagée", "Subvention encaissée", "Autre ressource"] as const;
const QUALITES = ["≥ BBB−", "< BBB−", "Non noté"] as const;
const NOTES_N3 = ["100", "80", "50", "20", INFO_INSUFFISANTE] as const;

type Acces = { lire: (s: SaisiePF) => ValeurChamp | null | undefined; ecrire: (s: SaisiePF, v: ValeurChamp | null) => void };
type Def = Omit<ChampIA, "cle"> & Acces;

const ouiNon = (v: ValeurChamp | null) => (v === "Oui" || v === "Non" ? v : null);
const num = (v: ValeurChamp | null) => (typeof v === "number" ? v : null);
const txt = (v: ValeurChamp | null) => (v === null ? "" : String(v));

/** Champs simples (hors listes et grille), dans l'ordre de l'outil Excel. */
function champsSimples(): Record<string, Def> {
  const prop = (k: keyof SaisiePF["proportionnalite"], libelle: string, type: "nombre" | "ouinon"): Def => ({
    libelle, bloc: 2, type, ...(type === "ouinon" ? { valeurs: OUI_NON } : {}),
    lire: (s) => s.proportionnalite[k], ecrire: (s, v) => { (s.proportionnalite as Record<string, unknown>)[k] = type === "ouinon" ? ouiNon(v) : num(v); },
  });
  const pl = (k: keyof SaisiePF["donneesPlafonds"], libelle: string, type: TypeChamp, valeurs?: readonly string[]): Def => ({
    libelle, bloc: 7, type, valeurs,
    lire: (s) => s.donneesPlafonds[k],
    ecrire: (s, v) => { (s.donneesPlafonds as Record<string, unknown>)[k] = type === "nombre" || type === "pourcentage" ? num(v) : type === "ouinon" ? ouiNon(v) : v; },
  });
  return {
    regime: { libelle: "Régime de revenus", bloc: 1, type: "liste", valeurs: ["R1", "R2", "R3", "R4"], lire: (s) => s.regime, ecrire: (s, v) => { s.regime = v as SaisiePF["regime"]; } },
    secteur: { libelle: "Secteur du projet", bloc: 1, type: "liste", valeurs: Object.keys(PARAMETRES_DEFAUT.secteurs), lire: (s) => s.secteur, ecrire: (s, v) => { s.secteur = v as SaisiePF["secteur"]; } },
    phase: { libelle: "Phase", bloc: 1, type: "liste", valeurs: ["P1", "P2", "P3"], lire: (s) => s.phase, ecrire: (s, v) => { s.phase = v as SaisiePF["phase"]; } },
    periodicite: { libelle: "Périodicité des échéances", bloc: 1, type: "liste", valeurs: ["Semestrielle", "Trimestrielle", "Mensuelle"], lire: (s) => s.periodicite, ecrire: (s, v) => { s.periodicite = (v ?? "Semestrielle") as SaisiePF["periodicite"]; } },
    expo: prop("exposition", "Exposition de la banque (MMAD)", "nombre"),
    mad: prop("toutEnMad", "Recettes, coûts et dette en dirhams", "ouinon"),
    duree: prop("duree", "Durée du financement (ans)", "nombre"),
    techno: prop("technologieEprouvee", "Technologie éprouvée", "ouinon"),
    epc18: prop("epcCleEnMain", "EPC clé-en-main < 18 mois (P1)", "ouinon"),
    unique: prop("acheteurUnique", "Acheteur principal unique", "ouinon"),
    premiere: prop("premiereReference", "Première référence technologique", "ouinon"),
    consortium: prop("consortium", "Opération consortiale", "ouinon"),
    plus20: prop("contratPlus20Ans", "Contrat de revenus > 20 ans", "ouinon"),
    climat: { libelle: "Site à risque climatique élevé", bloc: 2, type: "ouinon", valeurs: OUI_NON, lire: (s) => s.climatEleve, ecrire: (s, v) => { s.climatEleve = ouiNon(v); } },
    nbcp: prop("nbContreparties", "Nombre de contreparties clés", "nombre"),
    remediation: { libelle: "Plan de remédiation approuvé", bloc: 3, type: "ouinon", valeurs: OUI_NON, lire: (s) => s.planRemediation, ecrire: (s, v) => { s.planRemediation = ouiNon(v); } },
    choc: { libelle: "Scénario défavorable : baisse du CFADS", bloc: 6, type: "pourcentage", lire: (s) => s.choc, ecrire: (s, v) => { s.choc = num(v); } },
    "choc.description": { libelle: "Description du scénario défavorable", bloc: 6, type: "texte", lire: (s) => s.descriptionStress, ecrire: (s, v) => { s.descriptionStress = txt(v).slice(0, 500); } },
    n3_llcr: {
      libelle: "N3 hors P1 (note LLCR)", bloc: 7, type: "liste", valeurs: NOTES_N3,
      lire: (s) => (s.n3Llcr === null ? null : String(s.n3Llcr)),
      ecrire: (s, v) => { s.n3Llcr = v === null ? null : String(v) === INFO_INSUFFISANTE ? INFO_INSUFFISANTE : (Number(v) as 100); },
    },
    llcr: pl("llcr", "LLCR (x)", "nombre"),
    dsra: pl("dsraMois", "DSRA (mois)", "nombre"),
    fx: pl("expositionDevises", "Exposition nette en devises (% du service)", "pourcentage"),
    refi: pl("detteARefinancer", "Dette à refinancer (% du nominal)", "pourcentage"),
    strat: pl("strategieRefinancement", "Stratégie de refinancement approuvée", "ouinon", OUI_NON),
    part_ach: pl("partAcheteur", "Part des recettes de l'acheteur principal", "pourcentage"),
    qual: pl("qualiteAcheteur", "Qualité de l'acheteur principal", "liste", QUALITES),
    duree_contrat: pl("dureeContrat", "Durée résiduelle du contrat de revenus (ans)", "nombre"),
    duree_dette: pl("dureeDette", "Durée résiduelle de la dette (ans)", "nombre"),
    solution: pl("solutionContrat", "Solution documentée (contrat < dette)", "ouinon", OUI_NON),
    plan_adapt: pl("planClimat", "Plan d'adaptation climatique financé", "ouinon", OUI_NON),
    sponsor: pl("capaciteSponsor", "Capacité résiduelle du sponsor suffisante", "ouinon", OUI_NON),
    operateur: pl("operateurRemplacable", "Opérateur remplaçable", "ouinon", OUI_NON),
    ecart_om: pl("ecartOm", "Écart fin O&M / fin de dette (ans)", "nombre"),
    facteur: pl("expositionGroupe", "Facteur commun au-delà de la limite", "ouinon", OUI_NON),
    "bloc13.synthese": bloc13("synthese", "Synthèse de l'analyste"),
    "bloc13.forces": bloc13("forces", "Forces"),
    "bloc13.faiblesses": bloc13("faiblesses", "Faiblesses et mitigants"),
    "bloc13.conditions": bloc13("conditions", "Conditions proposées"),
    "bloc13.justif": bloc13("justification", "Justification des écarts"),
    "bloc13.avis": { libelle: "Bloc 13 — avis risques", bloc: 13, type: "liste", valeurs: AVIS, lire: (s) => s.bloc13.avis, ecrire: (s, v) => { s.bloc13.avis = v as SaisiePF["bloc13"]["avis"]; } },
    "bloc13.avis.motif": bloc13("avisMotif", "Bloc 13 — motif de l'avis"),
  };
}

function bloc13(k: "synthese" | "forces" | "faiblesses" | "conditions" | "justification" | "avisMotif", libelle: string): Def {
  return { libelle: libelle.startsWith("Bloc") ? libelle : `Bloc 13 — ${libelle}`, bloc: 13, type: "texte", lire: (s) => s.bloc13[k], ecrire: (s, v) => { s.bloc13[k] = txt(v).slice(0, 5000); } };
}

const SIMPLES = champsSimples();

const niveauLibelle = (n: Niveau | null | undefined) => (n ? NIVEAUX_LIBELLES[n - 1] : null);
const niveauDe = (v: ValeurChamp | null): Niveau | null => {
  if (v === null) return null;
  const t = String(v).trim().toLowerCase();
  const i = NIVEAUX_LIBELLES.findIndex((l) => t === l.toLowerCase() || t.startsWith(`${l.toLowerCase()} —`));
  return i < 0 ? null : ((i + 1) as Niveau);
};

/** Agrandit une liste jusqu'à l'indice demandé (lignes vides). */
function ligne<T>(liste: T[], i: number, vide: () => T): T {
  while (liste.length <= i) liste.push(vide());
  return liste[i];
}

/** Accès à un champ par sa clé, listes et grille comprises ; null si la clé est inconnue. */
function acces(cle: string): (Def & { cle: string }) | null {
  if (SIMPLES[cle]) return { cle, ...SIMPLES[cle] };
  let m: RegExpMatchArray | null;
  if ((m = cle.match(/^emploi\.(\d+)\.(libelle|montant)$/))) {
    const i = Number(m[1]) - 1, k = m[2] as "libelle" | "montant";
    if (i < 0 || i >= NB_EMPLOIS) return null;
    return { cle, libelle: `Emploi ${i + 1} — ${k === "libelle" ? "libellé" : "montant (MMAD)"}`, bloc: 3, type: k === "libelle" ? "texte" : "nombre",
      lire: (s) => s.emplois[i]?.[k], ecrire: (s, v) => { const l = ligne(s.emplois, i, () => ({ libelle: "", montant: null })); if (k === "libelle") l.libelle = txt(v).slice(0, 200); else l.montant = num(v); } };
  }
  if ((m = cle.match(/^ressource\.(\d+)\.(libelle|montant|nature)$/))) {
    const i = Number(m[1]) - 1, k = m[2] as "libelle" | "montant" | "nature";
    if (i < 0 || i >= NB_RESSOURCES) return null;
    return { cle, libelle: `Ressource ${i + 1} — ${k === "libelle" ? "libellé" : k === "montant" ? "montant (MMAD)" : "nature"}`, bloc: 3,
      type: k === "libelle" ? "texte" : k === "montant" ? "nombre" : "liste", ...(k === "nature" ? { valeurs: NATURES } : {}),
      lire: (s) => s.ressources[i]?.[k],
      ecrire: (s, v) => {
        const l = ligne(s.ressources, i, () => ({ libelle: "", montant: null, nature: null }));
        if (k === "libelle") l.libelle = txt(v).slice(0, 200); else if (k === "montant") l.montant = num(v); else l.nature = v as (typeof l)["nature"];
      } };
  }
  if ((m = cle.match(/^hypothese\.(\d+)\.(libelle|valeur)$/))) {
    const i = Number(m[1]) - 1, k = m[2] as "libelle" | "valeur";
    if (i < 0 || i >= NB_HYPOTHESES) return null;
    return { cle, libelle: `Hypothèse ${i + 1} — ${k === "libelle" ? "libellé" : "valeur"}`, bloc: 5, type: "texte",
      lire: (s) => s.hypotheses[i]?.[k], ecrire: (s, v) => { ligne(s.hypotheses, i, () => ({ libelle: "", valeur: "" }))[k] = txt(v).slice(0, k === "libelle" ? 200 : 300); } };
  }
  if ((m = cle.match(/^secteur\.(\d+)\.(valeur|source)$/))) {
    const i = Number(m[1]) - 1, k = m[2] as "valeur" | "source";
    if (i < 0 || i >= NB_DONNEES_SECTEUR) return null;
    return { cle, libelle: `Donnée sectorielle ${i + 1}${k === "source" ? " — source" : ""}`, bloc: 4, type: "texte",
      lire: (s) => s.donneesSecteur[i]?.[k],
      ecrire: (s, v) => { const l = ligne(s.donneesSecteur, i, () => ({ valeur: null, source: "" })); if (k === "source") l.source = txt(v).slice(0, 300); else l.valeur = v === null ? null : typeof v === "number" ? v : String(v).slice(0, 200); } };
  }
  if ((m = cle.match(/^echeance\.(\d+)\.(libelle|cfads|service|cfads_stresse)$/))) {
    const i = Number(m[1]) - 1, k = m[2];
    if (i < 0 || i >= NB_ECHEANCES) return null;
    const champ = k === "cfads_stresse" ? "cfadsStresse" : (k as "libelle" | "cfads" | "service");
    const noms = { libelle: "libellé", cfads: "CFADS central (MMAD)", service: "service de la dette (MMAD)", cfadsStresse: "CFADS stressé (MMAD)" };
    return { cle, libelle: `Échéance ${i + 1} — ${noms[champ]}`, bloc: 6, type: champ === "libelle" ? "texte" : "nombre",
      lire: (s) => s.periodes[i]?.[champ],
      ecrire: (s, v) => {
        const l = ligne(s.periodes, i, () => ({ libelle: "", cfads: null, service: null, cfadsStresse: null }));
        if (champ === "libelle") l.libelle = txt(v).slice(0, 60);
        else if (champ === "service") l.service = num(v) === null ? null : Math.max(0, num(v) as number);
        else l[champ] = num(v);
      } };
  }
  if ((m = cle.match(/^(N[4-6])(\.justification)?$/))) {
    const n = m[1] as "N4" | "N5" | "N6";
    if (m[2]) return { cle, libelle: `${n} — justification`, bloc: 7, type: "texte", lire: (s) => s.noyau[n]?.justification,
      ecrire: (s, v) => { s.noyau[n] = { niveau: s.noyau[n]?.niveau ?? null, justification: txt(v).slice(0, 2000) }; } };
    return { cle, libelle: `${n} — situation`, bloc: 7, type: "situation", valeurs: NIVEAUX_LIBELLES, lire: (s) => niveauLibelle(s.noyau[n]?.niveau),
      ecrire: (s, v) => { s.noyau[n] = { niveau: niveauDe(v), justification: s.noyau[n]?.justification ?? "" }; } };
  }
  if ((m = cle.match(/^(D[1-9])\.commentaire$/))) {
    const d = m[1];
    if (!(DOMAINES_GRILLE as string[]).includes(d)) return null;
    return { cle, libelle: `${d} — commentaire du domaine`, bloc: 8, type: "texte", lire: (s) => s.commentairesDomaines[d], ecrire: (s, v) => { s.commentairesDomaines[d] = txt(v).slice(0, 2000); } };
  }
  if ((m = cle.match(/^(D[1-9]\.[1-4])(\.commentaire)?$/))) {
    const sc = m[1];
    const def = DOMAINES_GRILLE.flatMap((d) => PARAMETRES_DEFAUT.sousCriteres[d]).find((x) => x.cle === sc);
    if (!def) return null;
    if (m[2]) return { cle, libelle: `${sc} — commentaire`, bloc: 8, type: "texte", lire: (s) => s.grille[sc]?.commentaire,
      ecrire: (s, v) => { s.grille[sc] = { niveau: s.grille[sc]?.niveau ?? null, commentaire: txt(v).slice(0, 2000) }; } };
    return { cle, libelle: `${sc} ${def.libelle} : situation`, bloc: 8, type: "situation", valeurs: NIVEAUX_LIBELLES,
      lire: (s) => niveauLibelle(s.grille[sc]?.niveau),
      ecrire: (s, v) => { s.grille[sc] = { niveau: niveauDe(v), commentaire: s.grille[sc]?.commentaire ?? "" }; } };
  }
  if ((m = cle.match(/^verrou\.([XB]\d)$/))) {
    const v = m[1] as CodeVerrou;
    if (!ORDRE_VERROUS.includes(v)) return null;
    // Dans l'outil Excel, B6 se saisit à l'inverse : « modèle de flux complet et rapproché ? ».
    if (v === "B6") return { cle, libelle: "B6 — modèle de flux complet et rapproché ? (Oui = pas de blocage)", bloc: 10, type: "ouinon", valeurs: OUI_NON,
      lire: (s) => (s.verrous.B6 === "Oui" ? "Non" : s.verrous.B6 === "Non" ? "Oui" : null),
      ecrire: (s, x) => { s.verrous.B6 = x === "Oui" ? "Non" : x === "Non" ? "Oui" : null; } };
    return { cle, libelle: `${v} — ${PARAMETRES_DEFAUT.verrous[v].libelle}`, bloc: 10, type: "ouinon", valeurs: OUI_NON,
      lire: (s) => s.verrous[v], ecrire: (s, x) => { s.verrous[v] = ouiNon(x); } };
  }
  return null;
}

/** Description d'un champ par sa clé (null si inconnue). */
export function champ(cle: string): ChampIA | null {
  const a = acces(cle);
  return a ? { cle: a.cle, libelle: a.libelle, bloc: a.bloc, type: a.type, valeurs: a.valeurs } : null;
}

/** Tous les champs, dans l'ordre de l'outil Excel (listes à leur taille maximale). */
export function tousLesChamps(): ChampIA[] {
  const cles: string[] = [];
  const simples = Object.keys(SIMPLES);
  const avant = simples.slice(0, simples.indexOf("remediation"));
  cles.push(...avant);
  for (let i = 1; i <= NB_EMPLOIS; i++) cles.push(`emploi.${i}.libelle`, `emploi.${i}.montant`);
  for (let i = 1; i <= NB_RESSOURCES; i++) cles.push(`ressource.${i}.libelle`, `ressource.${i}.montant`, `ressource.${i}.nature`);
  cles.push("remediation");
  for (let i = 1; i <= NB_DONNEES_SECTEUR; i++) cles.push(`secteur.${i}.valeur`, `secteur.${i}.source`);
  for (let i = 1; i <= NB_HYPOTHESES; i++) cles.push(`hypothese.${i}.libelle`, `hypothese.${i}.valeur`);
  cles.push("choc", "choc.description");
  for (let i = 1; i <= NB_ECHEANCES; i++) cles.push(`echeance.${i}.libelle`, `echeance.${i}.cfads`, `echeance.${i}.service`, `echeance.${i}.cfads_stresse`);
  for (const n of ["N4", "N5", "N6"]) cles.push(n, `${n}.justification`);
  cles.push(...simples.slice(simples.indexOf("n3_llcr"), simples.indexOf("bloc13.synthese")));
  for (const d of DOMAINES_GRILLE) {
    cles.push(`${d}.commentaire`);
    for (const sc of PARAMETRES_DEFAUT.sousCriteres[d]) cles.push(sc.cle, `${sc.cle}.commentaire`);
  }
  for (const v of ORDRE_VERROUS) cles.push(`verrou.${v}`);
  cles.push(...simples.slice(simples.indexOf("bloc13.synthese")));
  return cles.map((c) => champ(c)!).filter(Boolean);
}

/** Libellé d'une donnée sectorielle selon le secteur du dossier. */
export function libelleChamp(cle: string, s: SaisiePF): string {
  const m = cle.match(/^secteur\.(\d+)\.(valeur|source)$/);
  if (m) {
    const f = champsSecteur(s.secteur)[Number(m[1]) - 1];
    if (f) return `${f.libelle}${f.unite ? ` (${f.unite})` : ""}${m[2] === "source" ? " — source" : ""}`;
  }
  return champ(cle)?.libelle ?? cle;
}

export function lireChamp(s: SaisiePF, cle: string): ValeurChamp | null {
  const v = acces(cle)?.lire(s);
  return v === undefined || v === null || v === "" ? null : v;
}

/**
 * Contrôle et normalise une valeur proposée pour un champ ; renvoie la valeur canonique
 * ou le motif du refus. Une valeur que l'écran de saisie refuserait n'est jamais proposée.
 */
export function normaliser(cle: string, brute: unknown): { ok: true; valeur: ValeurChamp } | { ok: false; motif: string } {
  const c = champ(cle);
  if (!c) return { ok: false, motif: "clé inconnue" };
  if (brute === null || brute === undefined || (typeof brute === "string" && brute.trim() === "")) return { ok: false, motif: "valeur vide" };
  if (c.type === "nombre" || c.type === "pourcentage") {
    let n = typeof brute === "number" ? brute : Number(String(brute).replace(/[\s  ]/g, "").replace(",", ".").replace(/%$/, ""));
    if (typeof brute === "string" && /%\s*$/.test(brute) && Number.isFinite(n)) n = n / 100;
    if (!Number.isFinite(n)) return { ok: false, motif: "nombre attendu" };
    if (c.type === "pourcentage" && n < 0) return { ok: false, motif: "pourcentage négatif" };
    // Une part (recettes, dette à refinancer) ne dépasse pas 100 % ; l'exposition en devises,
    // rapportée au service annuel de la dette, le peut.
    if ((cle === "part_ach" || cle === "refi") && n > 1) return { ok: false, motif: "part supérieure à 100 %" };
    if (cle === "choc" && n > 0.95) return { ok: false, motif: "choc supérieur à 95 %" };
    return { ok: true, valeur: n };
  }
  const t = String(brute).trim();
  if (c.type === "situation") {
    const i = NIVEAUX_LIBELLES.findIndex((l) => t.toLowerCase() === l.toLowerCase() || t.toLowerCase().startsWith(`${l.toLowerCase()} —`));
    return i < 0 ? { ok: false, motif: `situation attendue (${NIVEAUX_LIBELLES.join(", ")})` } : { ok: true, valeur: NIVEAUX_LIBELLES[i] };
  }
  if (c.type === "ouinon" || c.type === "liste") {
    const v = c.valeurs!.find((x) => x.toLowerCase() === t.toLowerCase()) ?? (cle === "secteur" && t.toUpperCase() === "IMM" ? "IMMO-REND" : undefined);
    return v === undefined ? { ok: false, motif: `valeur admise : ${c.valeurs!.join(", ")}` } : { ok: true, valeur: v };
  }
  return { ok: true, valeur: t.slice(0, 5000) };
}

/** Écrit une valeur (déjà normalisée) dans la saisie, en place. */
export function ecrireChamp(s: SaisiePF, cle: string, valeur: ValeurChamp | null): boolean {
  const a = acces(cle);
  if (!a) return false;
  a.ecrire(s, valeur);
  return true;
}

/** Affichage lisible d'une valeur canonique. */
export function afficherValeur(cle: string, v: ValeurChamp | null): string {
  if (v === null) return "—";
  const c = champ(cle);
  if (c?.type === "pourcentage" && typeof v === "number") return `${(v * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
  if (typeof v === "number") return v.toLocaleString("fr-FR", { maximumFractionDigits: 4 });
  return v;
}

/** Valeurs de la saisie, au format du fichier d'échange (export vers l'outil Excel). */
export function valeursDeLaSaisie(s: SaisiePF): { cle: string; valeur: ValeurChamp }[] {
  const out: { cle: string; valeur: ValeurChamp }[] = [];
  for (const c of tousLesChamps()) {
    const v = lireChamp(s, c.cle);
    if (v !== null) out.push({ cle: c.cle, valeur: c.cle === "n3_llcr" && /^\d+$/.test(String(v)) ? Number(v) : v });
  }
  return out;
}
