export type UserRole = "admin" | "manager" | "analyst" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  createdAt: Date;
}

export interface Evaluation {
  id: string;
  evaluationId: string;
  projectId: string;
  status: "brouillon" | "soumis" | "valide" | "rejete";
  score?: number;
  rating?: string;
  recommendation?: string;
  analyst_name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  projectId: string;
  name: string;
  sector: string;
  status: string;
  createdAt: Date;
}

export interface Client {
  id: string;
  clientId: string;
  name: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  documentId: string;
  projectId?: string;
  type: string;
  name: string;
  createdAt: Date;
}
