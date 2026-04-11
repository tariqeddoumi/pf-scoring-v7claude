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
}

// User
export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
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
