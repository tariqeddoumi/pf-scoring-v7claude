"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Upload,
  Trash2,
  Archive,
  Download,
  Search,
  ChevronDown,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useDocuments, Document } from "@/lib/documents-context";

const DOCUMENT_TYPES = [
  { value: "all", label: "Tous les documents" },
  { value: "contract", label: "Contrats" },
  { value: "permit", label: "Permis" },
  { value: "audit", label: "Audits" },
  { value: "financial", label: "Financiers" },
  { value: "technical", label: "Techniques" },
  { value: "other", label: "Autres" },
];

const DOCUMENT_TYPE_LABELS: Record<Document["type"], string> = {
  contract: "Contrat",
  permit: "Permis",
  audit: "Audit",
  financial: "Financier",
  technical: "Technique",
  other: "Autre",
};

const DOCUMENT_TYPE_COLORS: Record<Document["type"], string> = {
  contract: "bg-blue-500/10 text-blue-400",
  permit: "bg-green-500/10 text-green-400",
  audit: "bg-purple-500/10 text-purple-400",
  financial: "bg-amber-500/10 text-amber-400",
  technical: "bg-cyan-500/10 text-cyan-400",
  other: "bg-slate-500/10 text-slate-400",
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export default function DocumentsPage() {
  const { documents, deleteDocument, archiveDocument, uploadVersion } =
    useDocuments();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || doc.type === filterType;

    return matchesSearch && matchesType && !doc.archived;
  });

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      deleteDocument(id);
      setMessage({ type: "success", text: "Document supprimé" });
    }
  };

  const handleArchive = (id: string) => {
    archiveDocument(id);
    setMessage({ type: "success", text: "Document archivé" });
  };

  const handleUploadVersion = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    // Mock version upload
    const newVersion = {
      versionNumber: doc.versions.length + 1,
      fileName: `${doc.name}_v${doc.versions.length + 1}.pdf`,
      fileSize: Math.floor(Math.random() * 5000000) + 500000,
      uploadedBy: "Current User",
      uploadedAt: new Date(),
      changeNote: "Mise à jour",
    };

    uploadVersion(docId, newVersion);
    setMessage({ type: "success", text: "Version uploadée avec succès" });
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">
          Gestion des Documents
        </h1>
        <p className="text-slate-400 mt-2">
          Gestion centralisée des documents de projets et clients
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-cyan-400">
              {documents.length}
            </div>
            <div className="text-sm text-slate-400">Documents au total</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">
              {documents.filter((d) => d.type === "contract").length}
            </div>
            <div className="text-sm text-slate-400">Contrats</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-400">
              {documents.filter((d) => d.type === "audit").length}
            </div>
            <div className="text-sm text-slate-400">Audits</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-400">
              {(
                documents.reduce((sum, d) => sum + d.fileSize, 0) /
                1024 /
                1024
              ).toFixed(1)}{" "}
              MB
            </div>
            <div className="text-sm text-slate-400">Espace utilisé</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 focus:border-cyan-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 focus:border-cyan-600 focus:outline-none"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Upload Button */}
            <Button className="bg-cyan-600 hover:bg-cyan-700 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-3">
        {filteredDocs.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6 text-center text-slate-400">
              Aucun document trouvé
            </CardContent>
          </Card>
        ) : (
          filteredDocs.map((doc) => (
            <Card
              key={doc.id}
              className="bg-slate-800 border-slate-700 overflow-hidden"
            >
              <CardContent className="p-0">
                <div
                  onClick={() =>
                    setExpandedDoc(expandedDoc === doc.id ? null : doc.id)
                  }
                  className="p-4 cursor-pointer hover:bg-slate-700/50 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <FileText className="w-8 h-8 text-slate-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-100 truncate">
                            {doc.name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${DOCUMENT_TYPE_COLORS[doc.type]}`}
                          >
                            {DOCUMENT_TYPE_LABELS[doc.type]}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">
                          {doc.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{doc.fileName}</span>
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>{doc.versions.length} version(s)</span>
                          <span>Par {doc.uploadedBy}</span>
                          <span>
                            {new Date(doc.uploadedAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition ${expandedDoc === doc.id ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedDoc === doc.id && (
                  <div className="border-t border-slate-700 p-4 bg-slate-900/50 space-y-4">
                    {/* Versions */}
                    <div>
                      <h4 className="font-semibold text-slate-300 mb-3">
                        Historique des Versions
                      </h4>
                      <div className="space-y-2">
                        {doc.versions.map((version, idx) => (
                          <div
                            key={version.id}
                            className="p-3 bg-slate-800 rounded border border-slate-700 text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-slate-200">
                                  v{version.versionNumber}
                                  {idx === doc.versions.length - 1 && (
                                    <span className="text-cyan-400 ml-2">
                                      (actuelle)
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {version.fileName} •{" "}
                                  {formatFileSize(version.fileSize)}
                                </div>
                                {version.changeNote && (
                                  <div className="text-xs text-slate-400 mt-1">
                                    Note: {version.changeNote}
                                  </div>
                                )}
                                <div className="text-xs text-slate-600 mt-1">
                                  {new Date(version.uploadedAt).toLocaleString(
                                    "fr-FR"
                                  )}{" "}
                                  par {version.uploadedBy}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-700">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDoc(doc.id);
                          setShowUploadModal(true);
                        }}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Nouvelle version
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleArchive(doc.id)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archiver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(doc.id)}
                        className="border-red-600 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Info Section */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-base">
            À propos de la Gestion des Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-400">
          <p>
            ✓ <strong>Versioning</strong> : Suivez l'historique complet des
            documents avec notes de mise à jour
          </p>
          <p>
            ✓ <strong>Archivage</strong> : Archivez les anciens documents pour
            garder le système propre
          </p>
          <p>
            ✓ <strong>Audit Trail</strong> : Tous les uploads et modifications
            sont automatiquement enregistrés
          </p>
          <p>
            ✓ <strong>Attribution</strong> : Chaque document est lié à un
            projet, client, ou évaluation
          </p>
          <p>
            ✓ <strong>Recherche</strong> : Trouvez rapidement les documents par
            nom, type, ou contenu
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
