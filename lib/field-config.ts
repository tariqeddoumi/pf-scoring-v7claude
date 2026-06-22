/**
 * Field Configuration for CRUD Operations
 * Centralized configuration for all entity fields
 * Allows easy customization without changing component code
 *
 * IMPORTANT: every `name` below MUST match the corresponding column on the
 * Prisma model (and the Zod validation schema) for the entity. The dynamic
 * form renderer (DynamicEntityForm) binds inputs to formData[name] and the
 * payload is sent verbatim to the API, so a mismatch silently drops the value
 * on save. Keep this file in sync with prisma/schema.prisma + validation-schemas.ts.
 */

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: string;
  help?: string;
  step?: string | number;
}

export interface FormSection {
  id: string;
  title: string;
  icon?: string;
  description?: string;
  fields: FieldConfig[];
  columns?: number; // 1 or 2 columns layout
}

// Shared option lists (kept here so dynamic + hardcoded forms agree)
export const SECTOR_OPTIONS: { label: string; value: string }[] = [
  { label: "Énergies renouvelables", value: "ENR" },
  { label: "Eau / Dessalement", value: "EAU" },
  { label: "Transport / Autoroutes", value: "TRA" },
  { label: "Ports / Logistique", value: "POR" },
  { label: "Industrie / Manufacturing", value: "IND" },
  { label: "Mines / Extraction", value: "MIN" },
  { label: "Tourisme / Hôtellerie", value: "TOU" },
  { label: "Télécom / Data Centers", value: "TEL" },
  { label: "Santé / Cliniques", value: "SAN" },
  { label: "Agro-industrie", value: "AGR" },
  { label: "Énergie thermique / Gaz", value: "ETH" },
  { label: "Immobilier / Promotion structurée", value: "IMM" },
];

const PROJECT_STATUS_OPTIONS = [
  { label: "Brouillon", value: "brouillon" },
  { label: "En cours", value: "en_cours" },
  { label: "En revue", value: "en_revue" },
  { label: "Approuvé", value: "approuve" },
  { label: "Rejeté", value: "rejete" },
];

const DEVISE_OPTIONS = [
  { label: "MAD (Dirham)", value: "MAD" },
  { label: "EUR (Euro)", value: "EUR" },
  { label: "USD (Dollar)", value: "USD" },
  { label: "GBP (Livre)", value: "GBP" },
];

// ============================================
// CLIENTS CONFIGURATION
// Field names map 1:1 to the Client model / createClientSchema.
// ============================================
export const CLIENT_SECTIONS: FormSection[] = [
  {
    id: "identity",
    title: "Identité & Administration",
    description: "Informations légales du client",
    icon: "User",
    columns: 2,
    fields: [
      {
        name: "nom",
        label: "Raison Sociale *",
        type: "text",
        required: true,
        placeholder: "Nom légal de l'entreprise",
      },
      {
        name: "raisonSociale",
        label: "Raison Sociale (officielle)",
        type: "text",
        placeholder: "Dénomination légale",
      },
      {
        name: "nomCommercial",
        label: "Nom Commercial",
        type: "text",
        placeholder: "Nom d'exploitation",
      },
      {
        name: "typeClient",
        label: "Type de Client",
        type: "select",
        options: [
          { label: "Société Privée", value: "Société Privée" },
          { label: "Entreprise Publique", value: "Entreprise Publique" },
          { label: "PME", value: "PME" },
          { label: "ETI", value: "ETI" },
          { label: "Grand Groupe", value: "Grand Groupe" },
        ],
      },
      {
        name: "formeJuridique",
        label: "Forme Juridique",
        type: "select",
        options: [
          { label: "SARL", value: "SARL" },
          { label: "SA", value: "SA" },
          { label: "SAS", value: "SAS" },
          { label: "SNC", value: "SNC" },
          { label: "Autre", value: "Autre" },
        ],
      },
    ],
  },
  {
    id: "organization",
    title: "Organisation & Secteur",
    description: "Secteur d'activité et organisation",
    icon: "Briefcase",
    columns: 2,
    fields: [
      {
        name: "secteur",
        label: "Secteur Principal",
        type: "text",
        placeholder: "Ex: Énergie, Banque, Retail",
      },
      {
        name: "segmentClientele",
        label: "Segment de Clientèle",
        type: "select",
        options: [
          { label: "Corporates", value: "Corporates" },
          { label: "SME", value: "SME" },
          { label: "Retail", value: "Retail" },
          { label: "Public Sector", value: "Public Sector" },
        ],
      },
      {
        name: "effectifs",
        label: "Nombre d'Employés",
        type: "number",
        placeholder: "Effectifs",
      },
      {
        name: "capitalSocial",
        label: "Capital Social (MAD)",
        type: "number",
        placeholder: "Montant",
      },
      {
        name: "chiffreAffaires",
        label: "Chiffre d'Affaires (MAD)",
        type: "number",
        placeholder: "Montant annuel",
      },
    ],
  },
  {
    id: "location",
    title: "Localisation",
    description: "Adresse et contact",
    icon: "MapPin",
    columns: 2,
    fields: [
      {
        name: "pays",
        label: "Pays *",
        type: "text",
        required: true,
        placeholder: "Ex: Maroc",
      },
      {
        name: "ville",
        label: "Ville",
        type: "text",
        placeholder: "Ex: Casablanca",
      },
      {
        name: "adresse",
        label: "Adresse",
        type: "textarea",
        placeholder: "Adresse complète",
      },
      {
        name: "codePostal",
        label: "Code Postal",
        type: "text",
        placeholder: "Code postal",
      },
    ],
  },
  {
    id: "contact",
    title: "Coordonnées",
    description: "Moyens de contact",
    icon: "Phone",
    columns: 2,
    fields: [
      {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "email@example.com",
      },
      {
        name: "telephone",
        label: "Téléphone",
        type: "tel",
        placeholder: "+212 5XX XXX XXX",
      },
      {
        name: "website",
        label: "Site Web",
        type: "text",
        placeholder: "https://exemple.com",
      },
    ],
  },
  {
    id: "banking",
    title: "Relations Bancaires",
    description: "Historique et statut bancaire",
    icon: "DollarSign",
    columns: 2,
    fields: [
      {
        name: "centreAffaires",
        label: "Centre d'Affaires",
        type: "text",
        placeholder: "Agence",
      },
      {
        name: "gestionnaire",
        label: "Chargé d'Affaires",
        type: "text",
        placeholder: "Nom du chargé",
      },
      {
        name: "ratingInterne",
        label: "Rating Interne",
        type: "select",
        options: [
          { label: "AAA", value: "AAA" },
          { label: "AA", value: "AA" },
          { label: "A", value: "A" },
          { label: "BBB", value: "BBB" },
          { label: "BB", value: "BB" },
        ],
      },
      {
        name: "statutBancaire",
        label: "Statut Bancaire",
        type: "select",
        options: [
          { label: "Prospect", value: "Prospect" },
          { label: "Client", value: "Client" },
          { label: "Client Inactif", value: "Client Inactif" },
        ],
      },
      {
        name: "dateRelation",
        label: "Date Début Relation",
        type: "date",
      },
      {
        name: "exposition",
        label: "Exposition Globale (MAD)",
        type: "number",
        placeholder: "Montant total",
      },
    ],
  },
  {
    id: "compliance",
    title: "KYC & Conformité",
    description: "Statuts réglementaires",
    icon: "Shield",
    columns: 2,
    fields: [
      {
        name: "statusKYC",
        label: "Statut KYC",
        type: "select",
        options: [
          { label: "En attente", value: "En attente" },
          { label: "Validé", value: "Validé" },
          { label: "Rejeté", value: "Rejeté" },
        ],
      },
      {
        name: "statusConformite",
        label: "Statut Conformité",
        type: "select",
        options: [
          { label: "En attente", value: "En attente" },
          { label: "Conforme", value: "Conforme" },
          { label: "Non Conforme", value: "Non Conforme" },
        ],
      },
      {
        name: "status",
        label: "Statut",
        type: "select",
        options: [
          { label: "Actif", value: "Actif" },
          { label: "Inactif", value: "Inactif" },
        ],
      },
    ],
  },
];

// ============================================
// PROJECTS CONFIGURATION
// Field names map 1:1 to the Project model / createProjectSchema and mirror
// the hardcoded tabs in app/projects/new/page.tsx so dynamic and hardcoded
// rendering produce the exact same payload.
// ============================================
export const PROJECT_SECTIONS: FormSection[] = [
  {
    id: "identification",
    title: "Identification",
    description: "Informations principales du projet",
    icon: "Briefcase",
    columns: 2,
    fields: [
      {
        name: "nom",
        label: "Nom du Projet *",
        type: "text",
        required: true,
        placeholder: "Nom du projet",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Description détaillée du projet",
      },
      {
        name: "secteur",
        label: "Secteur *",
        type: "select",
        required: true,
        options: SECTOR_OPTIONS,
      },
      {
        name: "status",
        label: "Statut",
        type: "select",
        options: PROJECT_STATUS_OPTIONS,
      },
      {
        name: "countryCode",
        label: "Code Pays ISO",
        type: "text",
        placeholder: "MA, FR, etc.",
      },
    ],
  },
  {
    id: "location",
    title: "Localisation",
    description: "Localisation géographique",
    icon: "MapPin",
    columns: 2,
    fields: [
      {
        name: "pays",
        label: "Pays",
        type: "text",
        placeholder: "Ex: Maroc",
      },
    ],
  },
  {
    id: "financing",
    title: "Finances",
    description: "Structure de financement",
    icon: "DollarSign",
    columns: 2,
    fields: [
      {
        name: "montant",
        label: "Montant (MAD)",
        type: "number",
        step: "0.01",
        placeholder: "Montant du projet",
      },
      {
        name: "devise",
        label: "Devise",
        type: "select",
        options: DEVISE_OPTIONS,
      },
      {
        name: "coutTotal",
        label: "Coût Total (MAD)",
        type: "number",
        step: "0.01",
        placeholder: "Coût total",
      },
      {
        name: "financement",
        label: "Financement (MAD)",
        type: "number",
        step: "0.01",
        placeholder: "Montant financé",
      },
      {
        name: "apportPropre",
        label: "Apport Propre (MAD)",
        type: "number",
        step: "0.01",
        placeholder: "Equity",
      },
      {
        name: "taux",
        label: "Taux (%)",
        type: "number",
        step: "0.01",
        placeholder: "Ex: 4.5",
      },
      {
        name: "typeCredit",
        label: "Type de Crédit",
        type: "text",
        placeholder: "Ex: Senior Debt",
      },
      {
        name: "dureeCredit",
        label: "Durée du Crédit (ans)",
        type: "number",
        placeholder: "Ex: 18",
      },
      {
        name: "tauxCouverture",
        label: "Taux de Couverture / DSCR",
        type: "number",
        step: "0.01",
        placeholder: "Ex: 1.35",
      },
      {
        name: "ratio",
        label: "Ratio",
        type: "number",
        step: "0.01",
        placeholder: "Ex: 1.2",
      },
    ],
  },
  {
    id: "technical",
    title: "Technique & Parties Prenantes",
    description: "Spécifications techniques et acteurs",
    icon: "Zap",
    columns: 2,
    fields: [
      {
        name: "sponsorPrincipal",
        label: "Sponsor Principal",
        type: "text",
        placeholder: "Nom du sponsor",
      },
      {
        name: "nomSPV",
        label: "Nom du SPV",
        type: "text",
        placeholder: "Société de projet",
      },
      {
        name: "constructeurEPC",
        label: "Constructeur EPC",
        type: "text",
        placeholder: "Entreprise de construction",
      },
      {
        name: "operateurOM",
        label: "Opérateur O&M",
        type: "text",
        placeholder: "Opérateur de maintenance",
      },
      {
        name: "technologie",
        label: "Technologie",
        type: "text",
        placeholder: "Ex: Solaire PV, Éolien",
      },
      {
        name: "capaciteInstallee",
        label: "Capacité Installée (MW)",
        type: "number",
        step: "0.1",
        placeholder: "Ex: 100",
      },
      {
        name: "dureeProjet",
        label: "Durée du Projet (ans)",
        type: "number",
        placeholder: "Ex: 25",
      },
      {
        name: "periodeAmorce",
        label: "Période d'Amorce (ans)",
        type: "number",
        placeholder: "Ex: 2",
      },
      {
        name: "periodeRemboursement",
        label: "Période de Remboursement (ans)",
        type: "number",
        placeholder: "Ex: 18",
      },
    ],
  },
  {
    id: "timeline",
    title: "Calendrier",
    description: "Chronologie du projet",
    icon: "Calendar",
    columns: 2,
    fields: [
      {
        name: "debutConstruction",
        label: "Début Construction",
        type: "date",
      },
      {
        name: "finConstruction",
        label: "Fin Construction",
        type: "date",
      },
    ],
  },
  {
    id: "structure",
    title: "Structure Capital",
    description: "Structure capitalistique",
    icon: "Users",
    columns: 1,
    fields: [
      {
        name: "structureCapitalePrincipale",
        label: "Structure Capitale Principale",
        type: "textarea",
        placeholder: "Description de la structure capitalistique",
      },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get fields for a specific section
 */
export function getSectionFields(
  sections: FormSection[],
  sectionId: string
): FieldConfig[] {
  const section = sections.find((s) => s.id === sectionId);
  return section ? section.fields : [];
}

/**
 * Get all fields across all sections
 */
export function getAllFields(sections: FormSection[]): FieldConfig[] {
  return sections.flatMap((section) => section.fields);
}

/**
 * Get field by name
 */
export function getFieldConfig(
  sections: FormSection[],
  fieldName: string
): FieldConfig | undefined {
  return getAllFields(sections).find((field) => field.name === fieldName);
}

/**
 * Filter sections by visibility (useful for future enhancement)
 */
export function getVisibleSections(
  sections: FormSection[],
  visibleSectionIds?: string[]
): FormSection[] {
  if (!visibleSectionIds) return sections;
  return sections.filter((s) => visibleSectionIds.includes(s.id));
}
