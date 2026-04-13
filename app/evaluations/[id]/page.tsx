"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  FileText,
  CheckCircle,
  BarChart3,
  AlertCircle,
  TrendingUp,
  Edit2,
} from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";

interface Evaluation {
  id: string;
  projectId: string;
  project?: { nom: string };
  analystId?: string;
  rating?: string;
  finalScore?: number;
  recommendation: string;
  notes?: string;
  status: string;
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
  createdAt?: string;
  updatedAt?: string;
}

function ReadOnlyField({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <div className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300">
        {value !== undefined && value !== null ? value : "-"}
      </div>
    </div>
  );
}

export default function EvaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evalId, setEvalId] = useState<string | null>(null);

  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        const { id } = await params;
        setEvalId(id);
        const response = await fetch(`/api/evaluations/${id}`);
        if (!response.ok) throw new Error("Failed to fetch evaluation");
        const data = await response.json();
        setEvaluation(data.data || data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load evaluation");
        setEvaluation(null);
      } finally {
        setLoading(false);
      }
    };

    resolveAndFetch();
  }, [params]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="space-y-6">
        <Link
          href="/evaluations"
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft size={20} />
          <span>Retour aux évaluations</span>
        </Link>
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error || "Évaluation non trouvée"}
        </div>
      </div>
    );
  }

  const ratingColors: Record<string, string> = {
    AAA: "from-green-600 to-green-700",
    AA: "from-green-500 to-green-600",
    A: "from-blue-500 to-blue-600",
    BBB: "from-cyan-500 to-cyan-600",
    BB: "from-yellow-500 to-yellow-600",
    B: "from-orange-500 to-orange-600",
    CCC: "from-red-500 to-red-600",
    D: "from-red-700 to-red-800",
  };

  const statusColors: Record<string, string> = {
    brouillon: "bg-slate-500/20 text-slate-400",
    soumis: "bg-yellow-500/20 text-yellow-400",
    valide: "bg-green-500/20 text-green-400",
    rejete: "bg-red-500/20 text-red-400",
  };

  const ratingColor =
    ratingColors[evaluation.rating || ""] || "from-slate-600 to-slate-700";

  const tabs = [
    {
      id: "general",
      label: "Générale",
      icon: <FileText size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Projet" value={evaluation.project?.nom} />
            <ReadOnlyField label="Statut" value={evaluation.status} />
            <ReadOnlyField label="Rating" value={evaluation.rating} />
            <ReadOnlyField label="Recommandation" value={evaluation.recommendation} />
          </div>
          {evaluation.notes && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
              <div className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 whitespace-pre-wrap">
                {evaluation.notes}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "scores",
      label: "Scores",
      icon: <BarChart3 size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Score final" value={evaluation.finalScore?.toFixed(2)} />
            <ReadOnlyField label="Probabilité de défaut (%)" value={evaluation.probabilityOfDefault?.toFixed(2)} />
            <ReadOnlyField label="Score financier" value={evaluation.scoreFinancier?.toFixed(2)} />
            <ReadOnlyField label="Score technique" value={evaluation.scoreTechnique?.toFixed(2)} />
            <ReadOnlyField label="Score marché" value={evaluation.scoreMarche?.toFixed(2)} />
            <ReadOnlyField label="Score environnemental" value={evaluation.scoreEnvironnemental?.toFixed(2)} />
            <ReadOnlyField label="Score social" value={evaluation.scoreSocial?.toFixed(2)} />
            <ReadOnlyField label="Score gouvernance" value={evaluation.scoreGouvenance?.toFixed(2)} />
            <ReadOnlyField label="Score juridique" value={evaluation.scoreJuridique?.toFixed(2)} />
            <ReadOnlyField label="Score pays" value={evaluation.scorePays?.toFixed(2)} />
            <ReadOnlyField label="Total malus" value={evaluation.malusTotal?.toFixed(2)} />
          </div>
        </div>
      ),
    },
    {
      id: "approval",
      label: "Approbation",
      icon: <CheckCircle size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Approuvé par" value={evaluation.approvedBy} />
            <ReadOnlyField label="Date d'approbation" value={evaluation.approvedAt?.split("T")[0]} />
            <ReadOnlyField label="Rejeté par" value={evaluation.rejectedBy} />
            <ReadOnlyField label="Date de rejet" value={evaluation.rejectedAt?.split("T")[0]} />
          </div>
          {evaluation.rejectionReason && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Raison du rejet</label>
              <div className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 whitespace-pre-wrap">
                {evaluation.rejectionReason}
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/evaluations"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {evaluation.project?.nom || "Projet inconnu"}
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Évaluation • {evaluation.createdAt ? new Date(evaluation.createdAt).toLocaleDateString("fr-FR") : "N/A"}
            </p>
          </div>
        </div>
        <button
          onClick={() => evalId && router.push(`/evaluations/${evalId}/edit`)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Edit2 size={20} />
          <span>Modifier</span>
        </button>
      </div>

      {/* Score Card */}
      {evaluation.finalScore !== undefined && (
        <div
          className={`rounded-lg bg-gradient-to-br ${ratingColor} p-8 text-white`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm opacity-90 mb-2">Score Global</p>
              <p className="text-4xl font-bold">
                {evaluation.finalScore.toFixed(2)}
              </p>
              <p className="text-xs opacity-75 mt-1">/10</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90 mb-2">Rating</p>
              <p className="text-4xl font-bold">{evaluation.rating || "N/A"}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90 mb-2">Statut</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColors[evaluation.status] || "bg-slate-500/20 text-slate-400"}`}
              >
                {evaluation.status === "brouillon"
                  ? "Brouillon"
                  : evaluation.status === "soumis"
                    ? "Soumis"
                    : evaluation.status === "valide"
                      ? "Validé"
                      : "Rejeté"}
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-90 mb-2">Recommandation</p>
              <div className="flex items-center justify-center space-x-2">
                {evaluation.recommendation === "APPROVE" && (
                  <CheckCircle size={24} />
                )}
                {evaluation.recommendation === "APPROVE_WITH_CONDITIONS" && (
                  <AlertCircle size={24} />
                )}
                {evaluation.recommendation === "REJECT" && (
                  <AlertCircle size={24} />
                )}
                <span className="text-lg font-semibold">
                  {evaluation.recommendation === "APPROVE"
                    ? "Approuvé"
                    : evaluation.recommendation === "APPROVE_WITH_CONDITIONS"
                      ? "Conditionné"
                      : "Rejeté"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <Tabs tabs={tabs} defaultTab="general" />
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href="/evaluations"
          className="inline-flex items-center space-x-2 px-4 py-2 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
      </div>
    </div>
  );
}
