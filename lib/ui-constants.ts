/**
 * Shared UI Constants for Colors, Labels, and Mappings
 * Used across clients, projects, users, evaluations pages
 */

// Role Colors
export const ROLE_COLORS: Record<string, string> = {
  system_admin: "bg-red-500/15 text-red-700 dark:text-red-300",
  scoring_admin: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  risk_manager: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  committee_member: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  risk_analyst: "bg-green-500/15 text-green-700 dark:text-green-300",
  auditor: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  read_only: "bg-secondary text-secondary-foreground",
};

// Role Labels (French)
export const ROLE_LABELS: Record<string, string> = {
  system_admin: "Super Administrateur",
  scoring_admin: "Administrateur Scoring",
  risk_manager: "Gestionnaire de Risque",
  committee_member: "Membre du Comité",
  risk_analyst: "Analyste de Risque",
  auditor: "Auditeur",
  read_only: "Lecture Seule",
};

// Status Colors for Evaluations
export const STATUS_COLORS: Record<string, string> = {
  brouillon: "bg-secondary text-secondary-foreground",
  soumis: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  valide: "bg-green-500/15 text-green-700 dark:text-green-300",
  rejete: "bg-red-500/15 text-red-700 dark:text-red-300",
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
    "bg-secondary hover:bg-accent text-secondary-foreground font-semibold px-4 py-2 rounded-lg transition-all",
  danger:
    "bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-all",
  outline:
    "border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-ring transition-colors px-4 py-2",
};

// Common Input Styles
export const INPUT_STYLES = {
  default:
    "w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring",
  error:
    "w-full px-4 py-2 bg-muted border border-destructive rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-destructive focus:ring-1 focus:ring-destructive",
};
