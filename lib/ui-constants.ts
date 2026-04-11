/**
 * Shared UI Constants for Colors, Labels, and Mappings
 * Used across clients, projects, users, evaluations pages
 */

// Role Colors
export const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400",
  manager: "bg-blue-500/20 text-blue-400",
  analyst: "bg-green-500/20 text-green-400",
  viewer: "bg-slate-500/20 text-slate-400",
};

// Role Labels (French)
export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  manager: "Gestionnaire",
  analyst: "Analyste",
  viewer: "Lecteur",
};

// Status Colors for Evaluations
export const STATUS_COLORS: Record<string, string> = {
  brouillon: "bg-slate-500/20 text-slate-400",
  soumis: "bg-yellow-500/20 text-yellow-400",
  valide: "bg-green-500/20 text-green-400",
  rejete: "bg-red-500/20 text-red-400",
};

// Status Labels (French)
export const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  soumis: "Soumis",
  valide: "Validé",
  rejete: "Rejeté",
};

// Rating Colors for Evaluations
export const RATING_COLORS: Record<string, string> = {
  AAA: "from-green-600 to-green-700",
  AA: "from-green-500 to-green-600",
  A: "from-blue-500 to-blue-600",
  BBB: "from-cyan-500 to-cyan-600",
  BB: "from-yellow-500 to-yellow-600",
  B: "from-orange-500 to-orange-600",
  CCC: "from-red-500 to-red-600",
  D: "from-red-700 to-red-800",
};

// Recommendation Labels
export const RECOMMENDATION_LABELS: Record<string, string> = {
  APPROVE: "Approuvé",
  APPROVE_WITH_CONDITIONS: "Approuvé avec conditions",
  REJECT: "Rejeté",
};

// Empty State Messages
export const EMPTY_STATES: Record<
  string,
  { title: string; description: string }
> = {
  clients: {
    title: "Aucun client",
    description: "Créez votre premier client",
  },
  projects: {
    title: "Aucun projet",
    description: "Créez votre premier projet",
  },
  users: {
    title: "Aucun utilisateur",
    description: "Créez votre premier utilisateur",
  },
  evaluations: {
    title: "Aucune évaluation",
    description: "Créez votre première évaluation",
  },
};

// Common Button Styles
export const BUTTON_STYLES = {
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-all",
  secondary:
    "bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-all",
  danger:
    "bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-all",
  outline:
    "border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-colors px-4 py-2",
};

// Common Input Styles
export const INPUT_STYLES = {
  default:
    "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
  error:
    "w-full px-4 py-2 bg-slate-700 border border-red-500 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500",
};
