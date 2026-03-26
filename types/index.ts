// Types principaux pour PF Scoring

export type ScoreGrade =
  | "AAA"
  | "AA"
  | "A"
  | "BBB"
  | "BB"
  | "B"
  | "CCC"
  | "CC"
  | "C"
  | "D";

export type ProjectStatus =
  | "brouillon"
  | "en_cours"
  | "en_revue"
  | "approuve"
  | "rejete";

export type RiskCategory =
  | "financier"
  | "technique"
  | "marche"
  | "environnemental"
  | "social"
  | "gouvernance"
  | "juridique"
  | "pays";

export interface Project {
  id: string;
  nom: string;
  description: string;
  secteur: string;
  montant: number; // en MAD
  devise: "MAD";
  status: ProjectStatus;
  scoreGlobal: number | null;
  grade: ScoreGrade | null;
  dateCreation: Date;
  dateMiseAJour: Date;
  creePar: string;
}

export interface ScoreComponent {
  categorie: RiskCategory;
  score: number; // 0-100
  ponderation: number; // 0-1
  scorePondere: number;
  commentaire?: string;
}

export interface ScoringResult {
  projectId: string;
  scoreGlobal: number;
  grade: ScoreGrade;
  composantes: ScoreComponent[];
  dateCalcul: Date;
  version: number;
}

export interface AuditEntry {
  id: string;
  projectId: string;
  action: string;
  utilisateur: string;
  details: string;
  timestamp: Date;
}

export interface DashboardStats {
  totalProjets: number;
  projetsEnCours: number;
  scoresMoyens: number;
  montantTotal: number; // en MAD
  repartitionGrades: Record<ScoreGrade, number>;
}
