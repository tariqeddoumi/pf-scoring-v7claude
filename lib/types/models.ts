/**
 * Shared Model Types
 * Used across frontend pages and components
 */

// Client
export interface Client {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  secteur?: string;
  pays?: string;
  type?: string;
  description?: string;
  status: string;
  createdAt: string;
  website?: string;
  city?: string;
  address?: string;
  contact?: string;
  // Extended fields
  raisonSociale?: string;
  nomCommercial?: string;
  typeClient?: string;
  formeJuridique?: string;
  segmentClientele?: string;
  effectifs?: number;
  capitalSocial?: number;
  chiffreAffaires?: number;
  ville?: string;
  adresse?: string;
  codePostal?: string;
  centreAffaires?: string;
  gestionnaire?: string;
  ratingInterne?: string;
  statutBancaire?: string;
  dateRelation?: string;
  exposition?: number;
  statusKYC?: string;
  statusConformite?: string;
}

// Project
export interface Project {
  id: string;
  nom: string;
  description?: string;
  secteur?: string;
  pays?: string;
  montant?: string;
  devise?: string;
  countryCode?: string;
  status: string;
  createdAt: string;
  region?: string;
  city?: string;
  sponsor?: string;
  technology?: string;
  capacity?: string;
  totalCost?: string;
  // Extended fields
  sponsorPrincipal?: string;
  nomSPV?: string;
  constructeurEPC?: string;
  operateurOM?: string;
  technologie?: string;
  capaciteInstallee?: number;
  debutConstruction?: string;
  finConstruction?: string;
  coutTotal?: number;
  financement?: number;
  apportPropre?: number;
  structureCapitalePrincipale?: string;
  dureeCredit?: number;
  taux?: number;
  typeCredit?: string;
  dureeProjet?: number;
  periodeAmorce?: number;
  periodeRemboursement?: number;
  tauxCouverture?: number;
  ratio?: number;
  scoreGlobal?: number;
  grade?: string;
}

// User
export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: "admin" | "manager" | "analyst" | "viewer";
  avatar?: string;
  createdAt: string;
}

// Evaluation
export interface Evaluation {
  id: string;
  projectId: string;
  project?: { nom: string };
  analystId: string;
  analyst?: { nom: string; prenom: string };
  finalScore: number;
  rating: string;
  recommendation: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Extended fields
  scoreFinancier?: number;
  scoreTechnique?: number;
  scoreMarche?: number;
  scoreEnvironnemental?: number;
  scoreSocial?: number;
  scoreGouvenance?: number;
  scoreJuridique?: number;
  scorePays?: number;
  probabilityOfDefault?: number;
  malusTotal?: number;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

// Generic API Response
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Pagination
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: PaginationMeta;
}
