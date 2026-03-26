// Constantes de l'application PF Scoring

export const APP_NAME = "PF Scoring";
export const APP_DESCRIPTION =
  "Application de Scoring Project Finance - Conforme IFC, EBRD, Basel, Bank Al-Maghrib";
export const DEVISE = "MAD";

export const GRADE_THRESHOLDS: Record<string, { min: number; max: number }> = {
  AAA: { min: 95, max: 100 },
  AA: { min: 85, max: 94 },
  A: { min: 75, max: 84 },
  BBB: { min: 65, max: 74 },
  BB: { min: 55, max: 64 },
  B: { min: 45, max: 54 },
  CCC: { min: 35, max: 44 },
  CC: { min: 25, max: 34 },
  C: { min: 15, max: 24 },
  D: { min: 0, max: 14 },
};

export const RISK_CATEGORIES = [
  { id: "financier", label: "Risque Financier", ponderationDefaut: 0.25 },
  { id: "technique", label: "Risque Technique", ponderationDefaut: 0.15 },
  { id: "marche", label: "Risque de Marché", ponderationDefaut: 0.15 },
  {
    id: "environnemental",
    label: "Risque Environnemental (IFC)",
    ponderationDefaut: 0.1,
  },
  { id: "social", label: "Risque Social (EBRD)", ponderationDefaut: 0.1 },
  { id: "gouvernance", label: "Gouvernance", ponderationDefaut: 0.1 },
  { id: "juridique", label: "Risque Juridique", ponderationDefaut: 0.08 },
  {
    id: "pays",
    label: "Risque Pays (Bank Al-Maghrib)",
    ponderationDefaut: 0.07,
  },
] as const;

export const PROJECT_STATUSES = [
  { value: "brouillon", label: "Brouillon" },
  { value: "en_cours", label: "En cours" },
  { value: "en_revue", label: "En revue" },
  { value: "approuve", label: "Approuvé" },
  { value: "rejete", label: "Rejeté" },
] as const;

export const SECTEURS = [
  "Énergie",
  "Infrastructure",
  "Transport",
  "Télécommunications",
  "Immobilier",
  "Agriculture",
  "Industrie",
  "Mines",
  "Tourisme",
  "Eau et Assainissement",
] as const;
