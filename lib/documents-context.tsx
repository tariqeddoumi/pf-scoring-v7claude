"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Document {
  id: string;
  documentId: string;
  projectId?: string;
  clientId?: string;
  evaluationId?: string;
  type: "contract" | "permit" | "audit" | "financial" | "technical" | "other";
  name: string;
  description?: string;
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  versions: DocumentVersion[];
  tags?: string[];
  archived: boolean;
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  changeNote?: string;
}

interface DocumentContextType {
  documents: Document[];
  addDocument: (doc: Omit<Document, "id" | "versions">) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  uploadVersion: (
    documentId: string,
    version: Omit<DocumentVersion, "id">
  ) => void;
  getDocumentsByProject: (projectId: string) => Document[];
  getDocumentsByClient: (clientId: string) => Document[];
  getDocumentsByEvaluation: (evaluationId: string) => Document[];
  getDocumentsByType: (type: Document["type"]) => Document[];
  archiveDocument: (id: string) => void;
  searchDocuments: (query: string) => Document[];
}

const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined
);

const MOCK_DOCUMENTS: Document[] = [
  {
    id: "doc1",
    documentId: "DOC-001",
    projectId: "p1",
    type: "contract",
    name: "Contrat PPA Taourirt",
    description: "Contrat d'achat d'électricité pour le parc éolien",
    fileName: "PPA_Taourirt_2026.pdf",
    fileSize: 2450000,
    mimeType: "application/pdf",
    uploadedBy: "Ahmed Ben Selhami",
    uploadedAt: new Date("2026-03-15T10:30:00"),
    versions: [
      {
        id: "v1",
        versionNumber: 1,
        fileName: "PPA_Taourirt_2026.pdf",
        fileSize: 2450000,
        uploadedBy: "Ahmed Ben Selhami",
        uploadedAt: new Date("2026-03-15T10:30:00"),
      },
    ],
    tags: ["contrat", "ppa", "éolien"],
    archived: false,
  },
  {
    id: "doc2",
    documentId: "DOC-002",
    projectId: "p1",
    type: "audit",
    name: "Audit Technique Parc Éolien",
    description: "Rapport d'audit technique complet",
    fileName: "Audit_Technique_2026_Q1.pdf",
    fileSize: 3100000,
    mimeType: "application/pdf",
    uploadedBy: "Fatima El Fassi",
    uploadedAt: new Date("2026-03-20T14:15:00"),
    versions: [
      {
        id: "v2_1",
        versionNumber: 1,
        fileName: "Audit_Technique_2026_Q1_draft.pdf",
        fileSize: 2950000,
        uploadedBy: "Fatima El Fassi",
        uploadedAt: new Date("2026-03-18T09:00:00"),
        changeNote: "Draft version",
      },
      {
        id: "v2_2",
        versionNumber: 2,
        fileName: "Audit_Technique_2026_Q1.pdf",
        fileSize: 3100000,
        uploadedBy: "Fatima El Fassi",
        uploadedAt: new Date("2026-03-20T14:15:00"),
        changeNote: "Final version with reviews",
      },
    ],
    tags: ["audit", "technique", "maintenance"],
    archived: false,
  },
  {
    id: "doc3",
    documentId: "DOC-003",
    clientId: "c1",
    type: "financial",
    name: "Bilan Financier ONEE 2025",
    description: "États financiers consolidés",
    fileName: "Bilan_ONEE_2025.xlsx",
    fileSize: 1250000,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    uploadedBy: "Mohamed Bennani",
    uploadedAt: new Date("2026-02-28T11:45:00"),
    versions: [
      {
        id: "v3",
        versionNumber: 1,
        fileName: "Bilan_ONEE_2025.xlsx",
        fileSize: 1250000,
        uploadedBy: "Mohamed Bennani",
        uploadedAt: new Date("2026-02-28T11:45:00"),
      },
    ],
    tags: ["financier", "bilan", "consolidé"],
    archived: false,
  },
  {
    id: "doc4",
    documentId: "DOC-004",
    projectId: "p3",
    type: "permit",
    name: "Permis de Construction Route Express",
    description: "Autorisation officielle pour démarrage des travaux",
    fileName: "Permis_Construction_Route_Express.pdf",
    fileSize: 850000,
    mimeType: "application/pdf",
    uploadedBy: "Laïla Khouya",
    uploadedAt: new Date("2026-03-10T16:20:00"),
    versions: [
      {
        id: "v4",
        versionNumber: 1,
        fileName: "Permis_Construction_Route_Express.pdf",
        fileSize: 850000,
        uploadedBy: "Laïla Khouya",
        uploadedAt: new Date("2026-03-10T16:20:00"),
      },
    ],
    tags: ["permis", "construction", "autorisation"],
    archived: false,
  },
];

const STORAGE_KEY = "pf_documents";

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDocuments(
          parsed.map((doc: any) => ({
            ...doc,
            uploadedAt: new Date(doc.uploadedAt),
            versions: (doc.versions || []).map((v: any) => ({
              ...v,
              uploadedAt: new Date(v.uploadedAt),
            })),
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load documents from localStorage", error);
    }
  }, []);

  // Save to localStorage whenever documents change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  }, [documents]);

  const addDocument = (docData: Omit<Document, "id" | "versions">) => {
    const newDoc: Document = {
      ...docData,
      id: `doc_${Date.now()}`,
      versions: [
        {
          id: `v_${Date.now()}`,
          versionNumber: 1,
          fileName: docData.fileName,
          fileSize: docData.fileSize,
          uploadedBy: docData.uploadedBy,
          uploadedAt: docData.uploadedAt,
        },
      ],
    };
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const updateDocument = (id: string, updates: Partial<Document>) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc))
    );
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const uploadVersion = (
    documentId: string,
    version: Omit<DocumentVersion, "id">
  ) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === documentId) {
          const newVersion: DocumentVersion = {
            ...version,
            id: `v_${Date.now()}`,
          };
          return {
            ...doc,
            versions: [...doc.versions, newVersion],
            fileName: newVersion.fileName,
            fileSize: newVersion.fileSize,
          };
        }
        return doc;
      })
    );
  };

  const getDocumentsByProject = (projectId: string) => {
    return documents.filter(
      (doc) => doc.projectId === projectId && !doc.archived
    );
  };

  const getDocumentsByClient = (clientId: string) => {
    return documents.filter(
      (doc) => doc.clientId === clientId && !doc.archived
    );
  };

  const getDocumentsByEvaluation = (evaluationId: string) => {
    return documents.filter(
      (doc) => doc.evaluationId === evaluationId && !doc.archived
    );
  };

  const getDocumentsByType = (type: Document["type"]) => {
    return documents.filter((doc) => doc.type === type && !doc.archived);
  };

  const archiveDocument = (id: string) => {
    updateDocument(id, { archived: true });
  };

  const searchDocuments = (query: string) => {
    const q = query.toLowerCase();
    return documents.filter(
      (doc) =>
        !doc.archived &&
        (doc.name.toLowerCase().includes(q) ||
          doc.description?.toLowerCase().includes(q) ||
          doc.fileName.toLowerCase().includes(q) ||
          doc.tags?.some((tag) => tag.toLowerCase().includes(q)))
    );
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        addDocument,
        updateDocument,
        deleteDocument,
        uploadVersion,
        getDocumentsByProject,
        getDocumentsByClient,
        getDocumentsByEvaluation,
        getDocumentsByType,
        archiveDocument,
        searchDocuments,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error("useDocuments must be used within DocumentProvider");
  }
  return context;
}
