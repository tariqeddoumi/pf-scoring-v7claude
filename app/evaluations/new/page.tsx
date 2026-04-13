"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, FileText, BarChart3 } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { QuestionnaireForm } from "@/components/scoring/QuestionnaireForm";
import type { QuestionnaireNode } from "@/lib/services/scoring-questionnaire-service";

interface Project {
  id: string;
  nom: string;
}

export default function NewEvaluationPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireNode[]>([]);
  const [modelVersionId, setModelVersionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    projectId: "",
    recommendation: "APPROVE",
    notes: "",
    status: "brouillon",
  });

  // Fetch projects and questionnaire on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectsRes, questionnaireRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/scoring/questionnaire"),
        ]);

        if (!projectsRes.ok) throw new Error("Erreur lors du chargement des projets");
        const projectsData = await projectsRes.json();
        setProjects(projectsData.data || []);

        if (questionnaireRes.ok) {
          const qData = await questionnaireRes.json();
          setQuestionnaire(qData.data || []);
          setModelVersionId(qData.modelVersionId);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Step 1: Create evaluation (without answers)
  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la création");
      }

      const newEval = await res.json();
      setEvaluationId(newEval.data.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Save answers and calculate score
  const handleSubmitAnswers = async () => {
    if (!evaluationId || !modelVersionId) return;

    setSubmitting(true);
    setError("");

    try {
      // Convert answers to API format
      const answersArray = Object.entries(answers).map(([nodeId, value]) => ({
        nodeId,
        answerType: "VALUE",
        valueString: typeof value === "string" ? value : undefined,
        valueNumber: typeof value === "number" ? value : undefined,
        comment: value.comment,
      }));

      const res = await fetch("/api/evaluations/calculate-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluationId,
          modelVersionId,
          answers: answersArray,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors du calcul du score");
      }

      // Redirect to evaluation detail
      router.push(`/evaluations/${evaluationId}`);
    } catch (err: any) {
      setError(err.message);
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

  // If evaluation not yet created, show creation form
  if (!evaluationId) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/evaluations"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title="Retour"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Nouvelle Évaluation</h1>
            <p className="text-slate-400 mt-2">Créez une nouvelle évaluation de risque</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="max-w-2xl rounded-lg border border-slate-700 bg-slate-800 p-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {projects.length === 0 && !error && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 text-yellow-400 text-sm mb-6">
              Aucun projet trouvé. Créez un projet d'abord.
            </div>
          )}

          <form onSubmit={handleCreateEvaluation} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Sélectionner un projet *
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                required
                disabled={projects.length === 0}
              >
                <option value="">-- Choisir un projet --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Recommandation
              </label>
              <select
                value={formData.recommendation}
                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
              >
                <option value="APPROVE">Approuver</option>
                <option value="REJECT">Rejeter</option>
                <option value="PENDING">En attente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                rows={3}
                placeholder="Ajouter des notes ou commentaires..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting || !formData.projectId || projects.length === 0}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  "Créer et continuer"
                )}
              </button>
              <Link
                href="/evaluations"
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
              >
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // If evaluation created, show questionnaire
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/evaluations"
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          title="Retour"
        >
          <ArrowLeft size={20} className="text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Compléter l'Évaluation</h1>
          <p className="text-slate-400 mt-2">Répondez aux questions de scoring</p>
        </div>
      </div>

      {/* Questionnaire Card */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {questionnaire.length > 0 ? (
          <>
            <QuestionnaireForm
              nodes={questionnaire}
              onAnswersChange={setAnswers}
            />

            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-700">
              <button
                onClick={handleSubmitAnswers}
                disabled={submitting}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Calcul en cours...
                  </>
                ) : (
                  "Calculer le score et finir"
                )}
              </button>
              <Link
                href="/evaluations"
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
              >
                Annuler
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400">Aucun questionnaire disponible</p>
            <Link
              href="/evaluations"
              className="text-cyan-400 hover:text-cyan-300 mt-4 inline-block"
            >
              Retourner à la liste
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
