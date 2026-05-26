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
import { FileText, Download, CheckCircle, AlertCircle } from "lucide-react";
import ExportService from "@/lib/export-service";
import { useEvaluation } from "@/lib/evaluation-context";

interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  formats: ("pdf" | "excel" | "word" | "csv")[];
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: "evaluation",
    label: "Exportation d'Évaluation",
    description: "Exporter une évaluation individuelle avec tous les détails",
    icon: <FileText className="w-6 h-6" />,
    formats: ["pdf", "word"],
  },
  {
    id: "portfolio",
    label: "Exportation Portefeuille",
    description: "Exporter le portefeuille complet avec tous les projets",
    icon: <FileText className="w-6 h-6" />,
    formats: ["excel", "csv"],
  },
  {
    id: "audit",
    label: "Exportation Journal d'Audit",
    description: "Exporter les logs d'audit avec filtres optionnels",
    icon: <FileText className="w-6 h-6" />,
    formats: ["csv", "excel"],
  },
];

export default function ExportsPage() {
  const { evaluations } = useEvaluation();
  const [selectedExport, setSelectedExport] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const evaluationsList = evaluations ? Object.values(evaluations) : [];

  const handleExport = async (format: string) => {
    setLoading(true);
    setMessage(null);

    try {
      if (selectedExport === "evaluation" && selectedEvaluation) {
        const evaluation = evaluationsList.find(
          (e: Record<string, unknown>) => (e as Record<string, unknown>).id === selectedEvaluation
        );
        if (!evaluation) throw new Error("Évaluation non trouvée");

        if (format === "pdf") {
          const blob = ExportService.generateEvaluationPDF(evaluation as Record<string, unknown>);
          const evaluationRecord = evaluation as Record<string, unknown>;
          const filename = `evaluation-${evaluationRecord.id || evaluationRecord.evaluationId}-${new Date().getTime()}.html`;
          downloadFile(blob, filename);
        } else if (format === "word") {
          const blob = ExportService.generateEvaluationWord(evaluation as Record<string, unknown>);
          const evaluationRecord = evaluation as Record<string, unknown>;
          const filename = `evaluation-${evaluationRecord.id || evaluationRecord.evaluationId}-${new Date().getTime()}.html`;
          downloadFile(blob, filename);
        }
      } else if (selectedExport === "portfolio") {
        if (format === "excel") {
          const blob = ExportService.generatePortfolioExcel(
            evaluationsList as unknown[]
          );
          downloadFile(blob, `portfolio-${new Date().getTime()}.csv`);
        } else if (format === "csv") {
          const blob = ExportService.generatePortfolioExcel(
            evaluationsList as unknown[]
          );
          downloadFile(blob, `portfolio-${new Date().getTime()}.csv`);
        }
      } else if (selectedExport === "audit") {
        const blob = ExportService.generateAuditExport([]);
        downloadFile(blob, `audit-logs-${new Date().getTime()}.csv`);
      }

      setMessage({ type: "success", text: "Fichier exporté avec succès" });
      setSelectedExport(null);
      setSelectedFormat(null);
      setSelectedEvaluation(null);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Erreur lors de l'export",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Exportations</h1>
        <p className="text-slate-400 mt-2">
          Exporter les données en différents formats
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

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_OPTIONS.map((option) => (
          <Card
            key={option.id}
            className={`cursor-pointer transition-all ${
              selectedExport === option.id
                ? "border-cyan-600 bg-cyan-600/10"
                : "border-slate-700 bg-slate-900 hover:border-cyan-600/50"
            }`}
            onClick={() => setSelectedExport(option.id)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="text-cyan-600">{option.icon}</div>
                <CardTitle className="text-lg">{option.label}</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                {option.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Export Configuration */}
      {selectedExport && (
        <Card className="border-cyan-600 bg-cyan-600/5">
          <CardHeader>
            <CardTitle>Configuration de l&apos;Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Evaluation Selection */}
            {selectedExport === "evaluation" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Sélectionner une Évaluation
                </label>
                <select
                  value={selectedEvaluation || ""}
                  onChange={(e) => setSelectedEvaluation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 focus:border-cyan-600 focus:outline-none"
                >
                  <option value="">-- Choisir une évaluation --</option>
                  {evaluationsList?.map((e: Record<string, unknown>) => (
                    <option key={String(e.id)} value={String(e.id)}>
                      {String(e.id)} ({String(e.projectId)}) - {String(e.status)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Format
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {EXPORT_OPTIONS.find(
                  (o) => o.id === selectedExport
                )?.formats.map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                      selectedFormat === format
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-600"
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => selectedFormat && handleExport(selectedFormat)}
                disabled={
                  !selectedFormat ||
                  (selectedExport === "evaluation" && !selectedEvaluation) ||
                  loading
                }
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {loading ? "Exportation en cours..." : "Télécharger"}
              </Button>
              <Button
                onClick={() => {
                  setSelectedExport(null);
                  setSelectedFormat(null);
                  setSelectedEvaluation(null);
                }}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card className="border-slate-700 bg-slate-900">
        <CardHeader>
          <CardTitle className="text-base">À propos des Exportations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-400">
          <p>
            • <strong>PDF</strong> : Format de lecture seule, idéal pour l&apos;archivage et la distribution
          </p>
          <p>
            • <strong>Excel</strong> : Format éditable avec formules, parfait pour l&apos;analyse supplémentaire
          </p>
          <p>
            • <strong>Word</strong> : Format documents structurés, idéal pour les rapports
          </p>
          <p>
            • <strong>CSV</strong> : Format texte universel, compatible avec
            tous les outils
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
