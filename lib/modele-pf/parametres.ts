/**
 * Paramètres candidats du modèle de scoring Project Finance (identiques à l'onglet
 * « Paramètres » de l'outil Excel). Ils ne sont pas approuvés par le Comité de validation :
 * une banque peut les remplacer par l'écran Paramétrage (voir `fusionnerParametres`).
 */

export type CodeRegime = "R1" | "R2" | "R3" | "R4";
export type CodePhase = "P1" | "P2" | "P3";
export type CodeSecteur =
  | "ENR" | "EAU" | "TEL" | "TRA" | "POR" | "SAN" | "ETH" | "IMMO-REND" | "IND" | "AGR" | "TOU" | "MIN";
export type CodeDomaine = "D1" | "D2" | "D3" | "D4" | "D5" | "D6" | "D7" | "D8" | "D9";
export type DomaineGrille = Exclude<CodeDomaine, "D7">;
export type CodePlafond = `C${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`;
export type CodeVerrou = "X1" | "X2" | "X3" | "X4" | "B1" | "B2" | "B3" | "B4" | "B5" | "B6" | "B7" | "B8";

export interface ParametresModele {
  /** Seuils DSCR de base : critique, vigilance, favorable (phase stabilisée). */
  regimes: Record<CodeRegime, { libelle: string; seuils: [number, number, number] }>;
  secteurs: Record<CodeSecteur, { libelle: string; delta: number }>;
  phases: Record<CodePhase, { libelle: string; majoration: number }>;
  /** Poids des domaines par phase (somme = 1 par phase). */
  poidsDomaines: Record<CodePhase, Record<CodeDomaine, number>>;
  libellesDomaines: Record<CodeDomaine, string>;
  /** Poids des indicateurs N1 à N6 du noyau D7. */
  poidsNoyau: [number, number, number, number, number, number];
  sousCriteres: Record<DomaineGrille, { cle: string; libelle: string; poids: number }[]>;
  ancres: { tresFavorable: number; favorable: number; vigilance: number; critique: number; infoInsuffisante: number };
  /** Score à partir duquel s'applique chaque note (1 à 10). */
  conversion: { seuil: number; note: number; libelle: string; orientation: string }[];
  plafonds: Record<CodePlafond, { libelle: string; niveau: number }>;
  verrous: Record<CodeVerrou, { libelle: string; stade: string }>;
  seuils: {
    sCapex: number; sExpo: number; sDuree: number; lCapex: number; lExpo: number; lNbContreparties: number;
    n3TresFavorable: number; n3Favorable: number; n3Vigilance: number;
    c1: number; c3: number; c4: number; c6: number; c7: number; c8: number; c9: number; c10: number; c13: number;
    couvertureGrille: number;
  };
}

export const PARAMETRES_DEFAUT: ParametresModele = {
  regimes: {
    R1: { libelle: "Contrat ferme à quantité garantie (take-or-pay)", seuils: [1.10, 1.20, 1.30] },
    R2: { libelle: "Paiement à la disponibilité", seuils: [1.12, 1.22, 1.32] },
    R3: { libelle: "Contrat à risque de volume", seuils: [1.20, 1.35, 1.50] },
    R4: { libelle: "Exposition au marché", seuils: [1.35, 1.55, 1.80] },
  },
  secteurs: {
    ENR: { libelle: "Énergies renouvelables", delta: -0.05 },
    EAU: { libelle: "Eau et dessalement", delta: 0 },
    TEL: { libelle: "Télécom et data centers", delta: 0 },
    TRA: { libelle: "Transport", delta: 0.05 },
    POR: { libelle: "Ports et logistique", delta: 0.05 },
    SAN: { libelle: "Santé", delta: 0.05 },
    ETH: { libelle: "Thermique et gaz", delta: 0.05 },
    "IMMO-REND": { libelle: "Immobilier de rendement", delta: 0.05 },
    IND: { libelle: "Industrie", delta: 0.1 },
    AGR: { libelle: "Agro-industrie", delta: 0.15 },
    TOU: { libelle: "Tourisme et hôtellerie", delta: 0.2 },
    MIN: { libelle: "Mines et extraction", delta: 0.25 },
  },
  phases: {
    P1: { libelle: "Construction", majoration: 0 },
    P2: { libelle: "Montée en charge", majoration: 0.05 },
    P3: { libelle: "Exploitation stabilisée", majoration: 0 },
  },
  poidsDomaines: {
    P1: { D1: 0.1, D2: 0.1, D3: 0.2, D4: 0.05, D5: 0.05, D6: 0.1, D7: 0.25, D8: 0.1, D9: 0.05 },
    P2: { D1: 0.08, D2: 0.07, D3: 0.08, D4: 0.12, D5: 0.12, D6: 0.12, D7: 0.28, D8: 0.08, D9: 0.05 },
    P3: { D1: 0.05, D2: 0.05, D3: 0, D4: 0.15, D5: 0.15, D6: 0.15, D7: 0.3, D8: 0.1, D9: 0.05 },
  },
  libellesDomaines: {
    D1: "Sponsors et actionnariat", D2: "Projet, site, technologie", D3: "Construction et achèvement",
    D4: "Mécanisme des recettes", D5: "Exploitation et maintenance", D6: "Contreparties et consortium",
    D7: "Finance et trésorerie (noyau)", D8: "Juridique, sûretés, continuité", D9: "ESG et climat résiduel",
  },
  poidsNoyau: [0.25, 0.2, 0.15, 0.15, 0.15, 0.1],
  sousCriteres: {
    D1: [{ cle: "D1.1", libelle: "Capacité financière du sponsor", poids: 0.4 }, { cle: "D1.2", libelle: "Obligation juridique de soutien", poids: 0.35 }, { cle: "D1.3", libelle: "Structure actionnariale et gouvernance", poids: 0.25 }],
    D2: [{ cle: "D2.1", libelle: "Technologie et performance", poids: 0.35 }, { cle: "D2.2", libelle: "Site, foncier physique et accès", poids: 0.4 }, { cle: "D2.3", libelle: "Planning et complexité d'exécution", poids: 0.25 }],
    D3: [{ cle: "D3.1", libelle: "Contrat EPC et constructeur", poids: 0.4 }, { cle: "D3.2", libelle: "Interfaces et gouvernance de chantier", poids: 0.25 }, { cle: "D3.3", libelle: "Assurances et garanties mobilisables", poids: 0.35 }],
    D4: [{ cle: "D4.1", libelle: "Structure contractuelle des recettes", poids: 0.45 }, { cle: "D4.2", libelle: "Mécanisme de prix et indexation", poids: 0.3 }, { cle: "D4.3", libelle: "Marché et concurrence", poids: 0.25 }],
    D5: [{ cle: "D5.1", libelle: "Opérateur et contrat O&M", poids: 0.35 }, { cle: "D5.2", libelle: "Performance technique et disponibilité", poids: 0.4 }, { cle: "D5.3", libelle: "Coûts, gros entretien et dépendances", poids: 0.25 }],
    D6: [{ cle: "D6.1", libelle: "Acheteur ou payeur principal", poids: 0.5 }, { cle: "D6.2", libelle: "Fournisseurs critiques", poids: 0.2 }, { cle: "D6.3", libelle: "Prêteurs et consortium", poids: 0.3 }],
    D8: [{ cle: "D8.1", libelle: "Documentation contractuelle et droits directs", poids: 0.35 }, { cle: "D8.2", libelle: "Sûretés et opposabilité", poids: 0.4 }, { cle: "D8.3", libelle: "Autorisations, cadre réglementaire, litiges", poids: 0.25 }],
    D9: [{ cle: "D9.1", libelle: "Environnement et ressources", poids: 0.3 }, { cle: "D9.2", libelle: "Social et acceptabilité", poids: 0.3 }, { cle: "D9.3", libelle: "Gouvernance ESG et exécution", poids: 0.15 }, { cle: "D9.4", libelle: "Climat résiduel", poids: 0.25 }],
  },
  ancres: { tresFavorable: 100, favorable: 80, vigilance: 50, critique: 20, infoInsuffisante: 20 },
  conversion: [
    { seuil: 0, note: 1, libelle: "Très critique", orientation: "Refus ou restructuration complète" },
    { seuil: 32, note: 2, libelle: "Critique", orientation: "Refus en l'état" },
    { seuil: 42, note: 3, libelle: "Préoccupant", orientation: "Révision de fond" },
    { seuil: 50, note: 4, libelle: "Fragile", orientation: "Restructuration à examiner" },
    { seuil: 58, note: 5, libelle: "Moyen", orientation: "Sous surveillance" },
    { seuil: 66, note: 6, libelle: "Acceptable", orientation: "Conditions et mitigants" },
    { seuil: 73, note: 7, libelle: "Satisfaisant", orientation: "Conditions légères" },
    { seuil: 80, note: 8, libelle: "Solide", orientation: "Réserves mineures à documenter" },
    { seuil: 86, note: 9, libelle: "Très solide", orientation: "Conditions minimales" },
    { seuil: 92, note: 10, libelle: "Excellent", orientation: "Profil de référence" },
  ],
  plafonds: {
    C1: { libelle: "DSCR minimum de base inférieur à 1,05x sur une échéance", niveau: 3 },
    C2: { libelle: "DSCR minimum de base sous le seuil critique du couple régime × secteur", niveau: 5 },
    C3: { libelle: "DSCR minimum sous scénario défavorable inférieur à 1,00x", niveau: 4 },
    C4: { libelle: "LLCR inférieur à 1,10x", niveau: 4 },
    C5: { libelle: "Contrat de revenus expirant avant la dernière échéance de dette, sans solution documentée", niveau: 5 },
    C6: { libelle: "Exposition nette en devises non couverte supérieure à 25 % du service de dette annuel", niveau: 5 },
    C7: { libelle: "DSRA absente ou inférieure à 3 mois de service de dette", niveau: 6 },
    C8: { libelle: "Dette à refinancer à maturité supérieure à 30 % du nominal, sans stratégie approuvée", niveau: 5 },
    C9: { libelle: "Quote-part de dette supérieure à 85 % du plan de financement", niveau: 5 },
    C10: { libelle: "Acheteur portant plus de 85 % des recettes et de qualité interne inférieure à BBB−", niveau: 6 },
    C11: { libelle: "Risque climatique physique élevé au site sans plan d'adaptation financé", niveau: 6 },
    C12: { libelle: "Capacité résiduelle du sponsor insuffisante pour l'appel d'equity restant", niveau: 6 },
    C13: { libelle: "Opérateur non remplaçable et contrat O&M expirant plus de 5 ans avant la dette", niveau: 7 },
    C14: { libelle: "Exposition du groupe bancaire sur un facteur commun au-delà de la limite interne", niveau: 6 },
    C15: { libelle: "Note issue d'une évaluation partielle (statut provisoire)", niveau: 6 },
  },
  verrous: {
    X1: { libelle: "Activité interdite par la loi marocaine ou par la politique d'exclusion de la banque", stade: "Aucune note" },
    X2: { libelle: "Autorisation légalement indispensable juridiquement impossible à obtenir", stade: "Aucune note" },
    X3: { libelle: "Contrepartie clé sous sanctions ou signalée au titre du dispositif LBC-FT", stade: "Aucune note" },
    X4: { libelle: "Contrepartie clé en défaut avéré non régularisé", stade: "Aucune note" },
    B1: { libelle: "Contrat de revenus principal non signé (régimes R1 à R3)", stade: "Octroi" },
    B2: { libelle: "Contrat EPC non signé en phase P1", stade: "Octroi" },
    B3: { libelle: "Besoin à terminaison supérieur aux ressources engagées (couverture < 95 % en P1)", stade: "Décaissement" },
    B4: { libelle: "Droit d'occupation du site non établi, ou durée < dette + 24 mois", stade: "Octroi" },
    B5: { libelle: "Avis juridique d'opposabilité des sûretés absent ou avec réserve substantielle", stade: "Décaissement" },
    B6: { libelle: "Modèle de flux datés absent ou non rapproché des états financiers", stade: "Notation validée" },
    B7: { libelle: "Complétude des critères critiques inférieure à 100 %", stade: "Notation validée" },
    B8: { libelle: "Acceptabilité environnementale non obtenue au stade requis", stade: "Octroi" },
  },
  seuils: {
    sCapex: 200, sExpo: 100, sDuree: 12, lCapex: 1500, lExpo: 500, lNbContreparties: 3,
    n3TresFavorable: 1.1, n3Favorable: 1.0, n3Vigilance: 0.95,
    c1: 1.05, c3: 1.0, c4: 1.1, c6: 0.25, c7: 3, c8: 0.3, c9: 0.85, c10: 0.85, c13: 5,
    couvertureGrille: 0.95,
  },
};

export const ORDRE_DOMAINES: CodeDomaine[] = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"];
export const DOMAINES_GRILLE: DomaineGrille[] = ["D1", "D2", "D3", "D4", "D5", "D6", "D8", "D9"];
export const ORDRE_PLAFONDS = Object.keys(PARAMETRES_DEFAUT.plafonds) as CodePlafond[];
export const ORDRE_VERROUS = Object.keys(PARAMETRES_DEFAUT.verrous) as CodeVerrou[];

type Partiel<T> = { [K in keyof T]?: T[K] extends object ? Partiel<T[K]> : T[K] };

/** Remplace les paramètres par défaut par ceux de la banque (fusion profonde, tableaux remplacés). */
export function fusionnerParametres(surcharge?: Partiel<ParametresModele> | null): ParametresModele {
  if (!surcharge) return PARAMETRES_DEFAUT;
  const fusion = (base: unknown, sur: unknown): unknown => {
    if (sur === undefined || sur === null) return base;
    if (Array.isArray(sur) || typeof sur !== "object" || typeof base !== "object" || base === null) return sur;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [k, v] of Object.entries(sur as Record<string, unknown>)) out[k] = fusion(out[k], v);
    return out;
  };
  return fusion(PARAMETRES_DEFAUT, surcharge) as ParametresModele;
}

/** Contrôle de cohérence d'un jeu de paramètres complet (poids à 100 %, seuils croissants). */
export function anomaliesParametres(P: ParametresModele): string[] {
  const a: string[] = [];
  for (const ph of ["P1", "P2", "P3"] as const) {
    const t = Object.values(P.poidsDomaines[ph]).reduce((s, x) => s + x, 0);
    if (Math.abs(t - 1) > 1e-6) a.push(`Poids des domaines en ${ph} : total ${(t * 100).toFixed(1)} % au lieu de 100 %`);
  }
  const tn = P.poidsNoyau.reduce((s, x) => s + x, 0);
  if (Math.abs(tn - 1) > 1e-6) a.push(`Poids du noyau : total ${(tn * 100).toFixed(1)} % au lieu de 100 %`);
  for (const [r, v] of Object.entries(P.regimes)) {
    const [c, vg, f] = v.seuils;
    if (!(c < vg && vg < f)) a.push(`Seuils DSCR de ${r} : ils doivent croître (critique < vigilance < favorable)`);
  }
  return a;
}
