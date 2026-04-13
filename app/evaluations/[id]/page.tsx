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

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">{label}</label>
    <p className="text-white">
      {value !== null && value !== undefined && value !== ""
        ? value
        : <span className="text-slate-500 italic">Non renseigné</span>}
    </p>
  </div>
);

const ScoreBar = ({ label, value }: { label: string; value?: number | null }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-xs font-semibold text-slate-400 uppercase">{label}</span>
      <span className="text-white font-semibold">{value !== null && value !== undefined ? value.toFixed(2) : "—"}</span>
    </div>
    <div className="h-2 bg-slate-700 rounded-full">
      <div
        className="h-2 bg-blue-500 rounded-full transition-all"
        style={{ width: value !== null && value !== undefined ? `${Math.min(value * 10, 100)}%` : "0%" }}
      />
    </div>
  </div>
);

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
        <Link href="/evaluations" className="inline-flex items-center space-x-2 text-slate-400 hover:text-white">
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

  const ratingColor = ratingColors[evaluation.rating || ""] || "from-slate-600 to-slate-700";

  const tabs = [
    {
      id: "general",
      label: "Générale",
      icon: <FileText size={18} />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Projet" value={evaluation.project?.nom} />
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Statut</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${statusColors[evaluation.status] || "bg-slate-500/20 text-slate-400"}`}>
                {evaluation.status}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Recommandation</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                evaluation.recommendation === "APPROVE" ? "bg-green-500/20 text-green-400" :
                evaluation.recommendation === "REJECT" ? "bg-red-500/20 text-red-400" :
                "bg-yellow-500/20 text-yellow-400"
              }`}>
                {evaluation.recommendation === "APPROVE" ? "Approuver" :
                 evaluation.recommendation === "REJECT" ? "Rejeter" : "Approuver sous conditions"}
              </span>
            </div>
            <Field label="Rating" value={evaluation.rating} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Notes</label>
            <p className="text-white whitespace-pre-wrap">
              {evaluation.notes || <span className="text-slate-500 italic">Non renseigné</span>}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "scores",
      label: "Scores",
      icon: <BarChart3 size={18} />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 grid grid-cols-2 gap-4 p-4 bg-slate-700/50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase mb-1">Score final</p>
                <p className="text-3xl font-bold text-white">{evaluation.finalScore?.toFixed(2) ?? "—"}</p>
                <p className="text-xs text-slate-500">/10</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase mb-1">Probabilité de défaut</p>
                <p className="text-3xl font-bold text-white">{evaluation.probabilityOfDefault?.toFixed(2) ?? "—"}</p>
                <p className="text-xs text-slate-500">%</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <ScoreBar label="Financier" value={evaluation.scoreFinancier} />
            <ScoreBar label="Technique" value={evaluation.scoreTechnique} />
            <ScoreBar label="Marché" value={evaluation.scoreMarche} />
            <ScoreBar label="Environnemental" value={evaluation.scoreEnvironnemental} />
            <ScoreBar label="Social" value={evaluation.scoreSocial} />
            <ScoreBar label="Gouvernance" value={evaluation.scoreGouvenance} />
            <ScoreBar label="Juridique" value={evaluation.scoreJuridique} />
            <ScoreBar label="Pays" value={evaluation.scorePays} />
          </div>
          <Field label="Total malus" value={evaluation.malusTotal?.toFixed(2)} />
        </div>
      ),
    },
    {
      id: "approval",
      label: "Approbation",
      icon: <CheckCircle size={18} />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Approuvé par" value={evaluation.approvedBy} />
            <Field label="Date d'approbation" value={evaluation.approvedAt ? new Date(evaluation.approvedAt).toLocaleDateString("fr-FR") : null} />
            <Field label="Rejeté par" value={evaluation.rejectedBy} />
            <Field label="Date de rejet" value={evaluation.rejectedAt ? new Date(evaluation.rejectedAt).toLocaleDateString("fr-FR") : null} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Raison du rejet</label>
            <p className="text-white whitespace-pre-wrap">
              {evaluation.rejectionReason || <span className="text-slate-500 italic">Non renseigné</span>}
            </p>
          </div>
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
              {evaluation.project?.nom || "Évaluation"}
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
      {evaluation.finalScore !== undefined && evaluation.finalScore !== null && (
        <div className={`rounded-lg bg-gradient-to-br ${ratingColor} p-6 text-white`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm opacity-80 mb-1">Score Global</p>
              <p className="text-3xl font-bold">{evaluation.finalScore.toFixed(2)}</p>
              <p className="text-xs opacity-60">/10</p>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">Rating</p>
              <p className="text-3xl font-bold">{evaluation.rating || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">Statut</p>
              <p className="text-lg font-semibold">{evaluation.status}</p>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">Recommandation</p>
              <p className="text-lg font-semibold">
                {evaluation.recommendation === "APPROVE" ? "✓ Approuver" :
                 evaluation.recommendation === "REJECT" ? "✗ Rejeter" : "~ Sous conditions"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <Tabs tabs={tabs} defaultTab="general" />
      </div>

      {/* Meta */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Informations système</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Créé le" value={evaluation.createdAt ? new Date(evaluation.createdAt).toLocaleDateString("fr-FR") : null} />
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Identifiant</label>
            <p className="text-white font-mono text-sm">{evaluation.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
