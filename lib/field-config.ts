/**
 * Field Configuration for CRUD Operations
 * Centralized configuration for all entity fields
 * Allows easy customization without changing component code
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

// ============================================
// CLIENTS CONFIGURATION
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
        name: "trade_name",
        label: "Nom Commercial",
        type: "text",
        placeholder: "Nom d'exploitation",
      },
      {
        name: "type",
        label: "Type de Client *",
        type: "select",
        required: true,
        options: [
          { label: "Société Privée", value: "Société Privée" },
          { label: "Entreprise Publique", value: "Entreprise Publique" },
          { label: "PME", value: "PME" },
          { label: "ETI", value: "ETI" },
          { label: "Grand Groupe", value: "Grand Groupe" },
        ],
      },
      {
        name: "legal_form",
        label: "Forme Juridique",
        type: "select",
        options: [
          { label: "SARL", value: "SARL" },
          { label: "SAPM", value: "SAPM" },
          { label: "SA", value: "SA" },
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
        label: "Secteur Principal *",
        type: "text",
        required: true,
        placeholder: "Ex: Énergie, Banque, Retail",
      },
      {
        name: "sub_sector",
        label: "Sous-Secteur",
        type: "text",
        placeholder: "Ex: Énergie Solaire",
      },
      {
        name: "segment",
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
        name: "employees",
        label: "Nombre d'Employés",
        type: "number",
        placeholder: "Effectifs",
      },
      {
        name: "capital_amount",
        label: "Capital Social (MAD)",
        type: "number",
        placeholder: "Montant",
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
        name: "city",
        label: "Ville",
        type: "text",
        placeholder: "Ex: Casablanca",
      },
      {
        name: "address",
        label: "Adresse",
        type: "textarea",
        placeholder: "Adresse complète",
      },
      {
        name: "postal_code",
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
      {
        name: "contact",
        label: "Personne de Contact",
        type: "text",
        placeholder: "Nom du contact",
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
        name: "business_center",
        label: "Centre d'Affaires",
        type: "text",
        placeholder: "Agence",
      },
      {
        name: "account_manager",
        label: "Chargé d'Affaires",
        type: "text",
        placeholder: "Nom du chargé",
      },
      {
        name: "rating",
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
        name: "banking_status",
        label: "Statut Bancaire",
        type: "select",
        options: [
          { label: "Prospect", value: "Prospect" },
          { label: "Client", value: "Client" },
          { label: "Client Inactif", value: "Client Inactif" },
        ],
      },
      {
        name: "relationship_start_date",
        label: "Date Début Relation",
        type: "date",
      },
      {
        name: "exposure",
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
        name: "kyc_status",
        label: "Statut KYC",
        type: "select",
        options: [
          { label: "En attente", value: "En attente" },
          { label: "Validé", value: "Validé" },
          { label: "Rejeté", value: "Rejeté" },
        ],
      },
      {
        name: "kyc_last_update",
        label: "Dernière Mise à Jour KYC",
        type: "date",
      },
      {
        name: "compliance_status",
        label: "Statut Conformité",
        type: "select",
        options: [
          { label: "En attente", value: "En attente" },
          { label: "Conforme", value: "Conforme" },
          { label: "Non Conforme", value: "Non Conforme" },
        ],
      },
    ],
  },
];

// ============================================
// PROJECTS CONFIGURATION
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
        name: "projectId",
        label: "ID Projet",
        type: "text",
        placeholder: "Identifiant unique",
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
        options: [
          { label: "Énergie - Solaire", value: "Énergie - Solaire" },
          { label: "Énergie - Éolien", value: "Énergie - Éolien" },
          { label: "Énergie - Hydro", value: "Énergie - Hydro" },
          { label: "Eau - Dessalement", value: "Eau - Dessalement" },
          { label: "Infrastructure", value: "Infrastructure" },
          { label: "Télécom", value: "Télécom" },
          { label: "Industrie", value: "Industrie" },
        ],
      },
      {
        name: "sponsor",
        label: "Sponsor",
        type: "text",
        placeholder: "Nom du sponsor",
      },
      {
        name: "spvName",
        label: "Nom Commercial SPV",
        type: "text",
        placeholder: "Société de projet",
      },
      {
        name: "spvJurisdiction",
        label: "Juridiction SPV",
        type: "text",
        placeholder: "Ex: Maroc",
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
        label: "Pays *",
        type: "text",
        required: true,
        placeholder: "Ex: Maroc",
      },
      {
        name: "region",
        label: "Région",
        type: "text",
        placeholder: "Ex: Grand Casablanca",
      },
      {
        name: "city",
        label: "Ville",
        type: "text",
        placeholder: "Ex: Casablanca",
      },
      {
        name: "siteAddress",
        label: "Adresse du Site",
        type: "textarea",
        placeholder: "Adresse complète du site",
      },
      {
        name: "coordinates",
        label: "Coordonnées GPS",
        type: "text",
        placeholder: "Latitude, Longitude",
      },
      {
        name: "countryCode",
        label: "Code Pays ISO",
        type: "text",
        placeholder: "MA",
      },
    ],
  },
  {
    id: "stakeholders",
    title: "Parties Prenantes",
    description: "Acteurs principaux du projet",
    icon: "Users",
    columns: 2,
    fields: [
      {
        name: "epcContractor",
        label: "Constructeur EPC",
        type: "text",
        placeholder: "Entreprise de construction",
      },
      {
        name: "omOperator",
        label: "O&M Opérateur",
        type: "text",
        placeholder: "Opérateur de maintenance",
      },
      {
        name: "offtaker",
        label: "Acheteur (Offtaker)",
        type: "text",
        placeholder: "Acheteur de l'énergie",
      },
      {
        name: "legalAdvisor",
        label: "Conseiller Juridique",
        type: "text",
        placeholder: "Cabinet juridique",
      },
      {
        name: "technicalAdvisor",
        label: "Conseiller Technique",
        type: "text",
        placeholder: "Expert technique",
      },
      {
        name: "insuranceAdvisor",
        label: "Conseiller Assurance",
        type: "text",
        placeholder: "Courtier en assurance",
      },
    ],
  },
  {
    id: "technical",
    title: "Caractéristiques Techniques",
    description: "Spécifications techniques",
    icon: "Zap",
    columns: 2,
    fields: [
      {
        name: "technology",
        label: "Technologie",
        type: "text",
        placeholder: "Ex: Énergie Solaire, Éolienne",
      },
      {
        name: "capacity",
        label: "Capacité Installée",
        type: "text",
        placeholder: "Ex: 100 MW",
      },
      {
        name: "capacityUnit",
        label: "Unité Capacité",
        type: "select",
        options: [
          { label: "MW", value: "MW" },
          { label: "kW", value: "kW" },
          { label: "MWh", value: "MWh" },
        ],
      },
      {
        name: "availabilityTarget",
        label: "Facteur de disponibilité cible (%)",
        type: "number",
        placeholder: "90",
      },
      {
        name: "designLife",
        label: "Durée de vie nominale (ans)",
        type: "number",
        placeholder: "25",
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
        name: "constructionStart",
        label: "Début Construction",
        type: "date",
      },
      {
        name: "constructionEnd",
        label: "Fin Construction",
        type: "date",
      },
      {
        name: "constructionDuration",
        label: "Durée Construction (mois)",
        type: "number",
        placeholder: "36",
      },
      {
        name: "codDate",
        label: "Date COD (Mise en Service)",
        type: "date",
      },
      {
        name: "concessionEnd",
        label: "Fin du Concession",
        type: "date",
      },
      {
        name: "operationalDuration",
        label: "Durée Exploitation (ans)",
        type: "number",
        placeholder: "25",
      },
      {
        name: "concessionDuration",
        label: "Durée du Contrat (ans)",
        type: "number",
        placeholder: "30",
      },
      {
        name: "omDuration",
        label: "Durée O&M (ans)",
        type: "number",
        placeholder: "25",
      },
    ],
  },
  {
    id: "financing",
    title: "Financement",
    description: "Structure de financement",
    icon: "DollarSign",
    columns: 2,
    fields: [
      {
        name: "totalCost",
        label: "Coût Total (MAD)",
        type: "number",
        placeholder: "Montant total",
      },
      {
        name: "montant",
        label: "Montant Principal",
        type: "number",
        placeholder: "Montant du projet",
      },
      {
        name: "devise",
        label: "Devise",
        type: "select",
        options: [
          { label: "MAD (Dirham)", value: "MAD" },
          { label: "EUR (Euro)", value: "EUR" },
          { label: "USD (Dollar)", value: "USD" },
          { label: "GBP (Livre)", value: "GBP" },
        ],
      },
      {
        name: "equityAmount",
        label: "Equity Amount (MAD)",
        type: "number",
        placeholder: "Montant equity",
      },
      {
        name: "equityPercentage",
        label: "Equity (%)",
        type: "number",
        placeholder: "20",
      },
      {
        name: "debtAmount",
        label: "Dette Senior (MAD)",
        type: "number",
        placeholder: "Montant de la dette",
      },
      {
        name: "dscrMinimum",
        label: "DSCR Minimum",
        type: "number",
        step: "0.01",
        placeholder: "1.35",
      },
      {
        name: "omCostAnnual",
        label: "Coût O&M Annuel (MAD)",
        type: "number",
        placeholder: "Montant annuel",
      },
    ],
  },
  {
    id: "insurance",
    title: "Assurance & Garanties",
    description: "Couverture et sécurités",
    icon: "Shield",
    columns: 2,
    fields: [
      {
        name: "insuranceCoverage",
        label: "Couverture Assurance",
        type: "text",
        placeholder: "Détails de la couverture",
      },
      {
        name: "pledgedAssets",
        label: "Actifs Nantis",
        type: "textarea",
        placeholder: "Détails des actifs",
      },
      {
        name: "reserveAccounts",
        label: "Comptes de Réserve",
        type: "text",
        placeholder: "Détails des réserves",
      },
    ],
  },
  {
    id: "administration",
    title: "Administration",
    description: "Paramètres administratifs",
    icon: "Settings",
    columns: 2,
    fields: [
      {
        name: "status",
        label: "Statut",
        type: "select",
        options: [
          { label: "Actif", value: "Actif" },
          { label: "Inactif", value: "Inactif" },
          { label: "Suspendu", value: "Suspendu" },
          { label: "Terminé", value: "Terminé" },
        ],
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
