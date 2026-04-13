"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

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
}

export default function EditEvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [evalId, setEvalId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Evaluation>>({
    recommendation: "APPROVE",
    notes: "",
    status: "brouillon",
    rating: "",
    finalScore: undefined,
    scoreFinancier: undefined,
    scoreTechnique: undefined,
    scoreMarche: undefined,
    scoreEnvironnemental: undefined,
    scoreSocial: undefined,
    scoreGouvenance: undefined,
    scoreJuridique: undefined,
    scorePays: undefined,
    probabilityOfDefault: undefined,
    malusTotal: undefined,
    approvedBy: "",
    rejectedBy: "",
    rejectionReason: "",
  });

  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        const { id } = await params;
        setEvalId(id);
        const response = await fetch(`/api/evaluations/${id}`);
        if (!response.ok) throw new Error("Failed to fetch evaluation");
        const data = await response.json();
        const evaluation = data.data || data;

        // Format dates
        if (evaluation.approvedAt) {
          evaluation.approvedAt = evaluation.approvedAt.split("T")[0];
        }
        if (evaluation.rejectedAt) {
          evaluation.rejectedAt = evaluation.rejectedAt.split("T")[0];
        }

        setFormData(evaluation);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load evaluation");
      } finally {
        setLoading(false);
      }
    };

    resolveAndFetch();
  }, [params]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      if (!evalId) throw new Error("Evaluation ID not found");

      const response = await fetch(`/api/evaluations/${evalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update evaluation");
        if (data.errors && Array.isArray(data.errors)) {
          const errors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            errors[err.field] = err.message;
          });
          setFieldErrors(errors);
        }
        return;
      }

      router.push(`/evaluations/${evalId}`);
    } catch (err: any) {
      setError(err.message || "Failed to update evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  const tabs = [
    {
      id: "general",
      label: "Générale",
      icon: <FileText size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Projet
              </label>
              <input
                type="text"
                value={formData.project?.nom || ""}
                disabled
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Statut
              </label>
              <select
                name="status"
                value={formData.status || "brouillon"}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="brouillon">Brouillon</option>
                <option value="soumis">Soumis</option>
                <option value="valide">Validé</option>
                <option value="rejete">Rejeté</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Rating
              </label>
              <select
                name="rating"
                value={formData.rating || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner</option>
                <option value="AAA">AAA</option>
                <option value="AA">AA</option>
                <option value="A">A</option>
                <option value="BBB">BBB</option>
                <option value="BB">BB</option>
                <option value="B">B</option>
                <option value="CCC">CCC</option>
                <option value="D">D</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Recommandation
              </label>
              <select
                name="recommendation"
                value={formData.recommendation || "APPROVE"}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="APPROVE">Approuvé</option>
                <option value="APPROVE_WITH_CONDITIONS">
                  Approuvé avec conditions
                </option>
                <option value="REJECT">Rejeté</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
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
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Score final
              </label>
              <input
                type="number"
                name="finalScore"
                value={formData.finalScore || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Probabilité de défaut (%)
              </label>
              <input
                type="number"
                name="probabilityOfDefault"
                value={formData.probabilityOfDefault || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Score financier
              </label>
              <input
                type="number"
                name="scoreFinancier"
                value={formData.scoreFinancier || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Score technique
              </label>
              <input
                type="number"
                name="scoreTechnique"
                value={formData.scoreTechnique || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Score marché
              </label>
              <input
                type="number"
                name="scoreMarche"
                value={formData.scoreMarche || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Score environnemental
              </label>
              <input
                type="number"
                name="scoreEnvironnemental"
                value={formData.scoreEnvironnemental || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Score social
              </label>
              <input
                type="number"
                name="scoreSocial"
                value={formData.scoreSocial || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Score gouvernance
              </label>
              <input
                type="number"
                name="scoreGouvenance"
                value={formData.scoreGouvenance || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Score juridique
              </label>
              <input
                type="number"
                name="scoreJuridique"
                value={formData.scoreJuridique || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Score pays
              </label>
              <input
                type="number"
                name="scorePays"
                value={formData.scorePays || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Total malus
              </label>
              <input
                type="number"
                name="malusTotal"
                value={formData.malusTotal || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Approuvé par
              </label>
              <input
                type="text"
                name="approvedBy"
                value={formData.approvedBy || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Date d&apos;approbation
              </label>
              <input
                type="date"
                value={
                  formData.approvedAt
                    ? formData.approvedAt.toString().split("T")[0]
                    : ""
                }
                disabled
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Rejeté par
              </label>
              <input
                type="text"
                name="rejectedBy"
                value={formData.rejectedBy || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Date de rejet
              </label>
              <input
                type="date"
                value={
                  formData.rejectedAt
                    ? formData.rejectedAt.toString().split("T")[0]
                    : ""
                }
                disabled
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Raison du rejet
            </label>
            <textarea
              name="rejectionReason"
              value={formData.rejectionReason || ""}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Modifier l&apos;évaluation</h1>
          <p className="text-slate-400 mt-1">
            {formData.project?.nom || "Projet"}
          </p>
        </div>
        <Link
          href={`/evaluations/${evalId}`}
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <Tabs tabs={tabs} defaultTab="general" />

        {/* Form Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-slate-700">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Mise à jour...</span>
              </>
            ) : (
              <span>Enregistrer les modifications</span>
            )}
          </button>
          <Link
            href={`/evaluations/${evalId}`}
            className="inline-flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
