/**
 * Référentiels de la signalétique client.
 *
 * Les listes déroulantes de la création et de la modification d'un client étaient
 * codées en dur, dans chaque écran, avec des valeurs divergentes : le type de client
 * proposait « GE » quand les données portent « Grande Entreprise », la forme juridique
 * « SA » pour « S.A. », et l'échelle de notation interne s'arrêtait à CCC alors que le
 * barème de la banque compte dix paliers. Un client noté CC ne pouvait ni être saisi
 * ni être relu : le sélecteur affichait « Sélectionner ».
 *
 * Ces listes sont ici une fois, avec la valeur réellement stockée en base. Elles
 * servent de repli à /api/reference/lists, qui les sert depuis les tables de
 * paramétrage (BP_PF_client_types, BP_PF_legal_forms, …) dès qu'elles sont peuplées.
 */

import { GRADE_THRESHOLDS } from "./constants";

export interface OptionReferentiel {
  /** Valeur enregistrée en base — c'est le libellé, comme dans les données existantes. */
  valeur: string;
  libelle: string;
  /** Précision affichée en aide, pour les statuts dont le sens n'est pas évident. */
  aide?: string;
  /** Vrai si cette valeur appelle une action du chargé d'affaires. */
  aTraiter?: boolean;
}

export const TYPES_CLIENT: OptionReferentiel[] = [
  { valeur: "Grande Entreprise", libelle: "Grande Entreprise" },
  { valeur: "Entreprise", libelle: "Entreprise" },
  { valeur: "PME", libelle: "PME" },
  { valeur: "TPE", libelle: "TPE" },
  { valeur: "Établissement public", libelle: "Établissement public" },
  { valeur: "Collectivité territoriale", libelle: "Collectivité territoriale" },
  { valeur: "Association / ONG", libelle: "Association / ONG" },
];

export const FORMES_JURIDIQUES: OptionReferentiel[] = [
  { valeur: "S.A.", libelle: "S.A. — Société anonyme" },
  { valeur: "S.A.R.L.", libelle: "S.A.R.L. — Société à responsabilité limitée" },
  { valeur: "S.A.R.L. A.U.", libelle: "S.A.R.L. A.U. — à associé unique" },
  { valeur: "S.A.S.", libelle: "S.A.S. — Société par actions simplifiée" },
  { valeur: "S.C.A.", libelle: "S.C.A. — Société en commandite par actions" },
  { valeur: "S.N.C.", libelle: "S.N.C. — Société en nom collectif" },
  { valeur: "G.I.E.", libelle: "G.I.E. — Groupement d'intérêt économique" },
  { valeur: "Établissement public", libelle: "Établissement public" },
  { valeur: "Coopérative", libelle: "Coopérative" },
];

export const SEGMENTS_CLIENTELE: OptionReferentiel[] = [
  { valeur: "Corporate", libelle: "Corporate" },
  { valeur: "Entreprise", libelle: "Entreprise" },
  { valeur: "PME", libelle: "PME" },
  { valeur: "Institutionnel", libelle: "Institutionnel" },
  { valeur: "Secteur public", libelle: "Secteur public" },
];

export const STATUTS_BANCAIRES: OptionReferentiel[] = [
  { valeur: "VIP", libelle: "VIP", aide: "Relation stratégique, suivi rapproché" },
  { valeur: "Client", libelle: "Client", aide: "Relation bancaire ouverte" },
  { valeur: "Prospect", libelle: "Prospect", aide: "Pas encore de compte ouvert" },
  { valeur: "Inactif", libelle: "Inactif", aide: "Aucun mouvement récent" },
  { valeur: "Clôturé", libelle: "Clôturé", aide: "Relation terminée" },
];

/**
 * Notation interne, sur le barème de la banque. Les seuils viennent de la même
 * source que ceux du moteur : la note se lit de la même façon partout.
 */
export const RATINGS_INTERNES: OptionReferentiel[] = Object.entries(
  GRADE_THRESHOLDS
).map(([note, seuils]) => ({
  valeur: note,
  libelle: note,
  aide: `Score ${seuils.min} à ${seuils.max} sur 100`,
}));

export const STATUTS_KYC: OptionReferentiel[] = [
  { valeur: "Vérifiée", libelle: "Vérifiée", aide: "Dossier complet et validé par la conformité" },
  {
    valeur: "En attente",
    libelle: "En attente",
    aide: "Pièces demandées, pas encore reçues ou instruites",
    aTraiter: true,
  },
  {
    valeur: "À renouveler",
    libelle: "À renouveler",
    aide: "Dossier valide mais arrivé à échéance de revue périodique",
    aTraiter: true,
  },
  {
    valeur: "Expiration",
    libelle: "Expiration",
    aide: "Pièces d'identité ou statuts périmés : octroi bloqué",
    aTraiter: true,
  },
  {
    valeur: "Rejet",
    libelle: "Rejet",
    aide: "Entrée en relation refusée par la conformité",
    aTraiter: true,
  },
];

export const STATUTS_CONFORMITE: OptionReferentiel[] = [
  { valeur: "Conforme", libelle: "Conforme", aide: "Aucune réserve" },
  {
    valeur: "Alerte",
    libelle: "Alerte",
    aide: "Signalement à instruire (LAB-FT, sanctions, PPE)",
    aTraiter: true,
  },
  {
    valeur: "Non conforme",
    libelle: "Non conforme",
    aide: "Réserve bloquante : aucun nouvel engagement",
    aTraiter: true,
  },
  {
    valeur: "En attente",
    libelle: "En attente",
    aide: "Contrôle de conformité non encore rendu",
    aTraiter: true,
  },
];

export const STATUTS_CLIENT: OptionReferentiel[] = [
  { valeur: "Actif", libelle: "Actif" },
  { valeur: "Inactif", libelle: "Inactif" },
  { valeur: "Suspendu", libelle: "Suspendu" },
];

/** Valeurs qui appellent une action, dérivées des référentiels eux-mêmes. */
export const KYC_A_TRAITER = STATUTS_KYC.filter((o) => o.aTraiter).map((o) => o.valeur);
export const CONFORMITE_A_TRAITER = STATUTS_CONFORMITE.filter((o) => o.aTraiter).map(
  (o) => o.valeur
);

export const REFERENTIELS_CLIENT = {
  typeClient: TYPES_CLIENT,
  formeJuridique: FORMES_JURIDIQUES,
  segmentClientele: SEGMENTS_CLIENTELE,
  statutBancaire: STATUTS_BANCAIRES,
  ratingInterne: RATINGS_INTERNES,
  statusKYC: STATUTS_KYC,
  statusConformite: STATUTS_CONFORMITE,
  status: STATUTS_CLIENT,
} as const;

export type CleReferentielClient = keyof typeof REFERENTIELS_CLIENT;
