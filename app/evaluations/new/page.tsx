"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { EvaluationWorkspace } from "@/components/scoring/EvaluationWorkspace";
import type { QuestionnaireNode } from "@/lib/services/scoring-questionnaire-service";
import { apiGet, apiPost } from "@/lib/api-client";

interface Project {
  id: string;
  nom: string;
}

export default function NewEvaluationPage() {
  const router = useRouter();

  /* data */
  const [projects, setProjects] = useState<Project[]>([]);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireNode[]>([]);
  const [modelVersionId, setModelVersionId] = useState("");

  /* state machine: "form" | "workspace" */
  const [step, setStep] = useState<"form" | "workspace">("form");
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  /* ui */
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    projectId: "",
    recommendation: "APPROVE",
    notes: "",
    status: "brouillon",
  });

  /* ── Load projects + questionnaire ── */
  useEffect(() => {
    (async () => {
      try {
        const [pRes, qRes] = await Promise.all([
          apiGet("/api/projects"),
          apiGet("/api/scoring/questionnaire"),
        ]);

        if (pRes.ok) {
          const pData = await pRes.json();
          setProjects(pData.data || []);
        }

        if (qRes.ok) {
          const qData = await qRes.json();
          setQuestionnaire(qData.data || []);
          setModelVersionId(qData.modelVersionId || "");
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Step 1: create evaluation ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await apiPost("/api/scoring/evaluations", {
        projectId: formData.projectId,
        modelVersionId: modelVersionId,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur lors de la création");
      }
      const { data } = await res.json();
      setEvaluationId(data.id);
      setSelectedProject(projects.find((p) => p.id === formData.projectId) ?? null);
      setStep("workspace");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Step 2: workspace complete ── */
  const handleComplete = (id: string, score: number, rating: string) => {
    router.push(`/evaluations/${id}?score=${score.toFixed(1)}&rating=${rating}`);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-cyan-400 mx-auto" size={40} />
          <p className="text-slate-400 text-sm">Chargement du questionnaire…</p>
        </div>
      </div>
    );
  }

  /* ── Workspace (step 2) ── */
  if (step === "workspace" && evaluationId) {
    return (
      <EvaluationWorkspace
        evaluationId={evaluationId}
        projectName={selectedProject?.nom ?? "Projet"}
        questionnaire={questionnaire}
        modelVersionId={modelVersionId}
        onComplete={handleComplete}
      />
    );
  }

  /* ── Creation form (step 1) ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/evaluations"
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Nouvelle Évaluation</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Créez une évaluation de risque pour un projet
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form card */}
        <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-800 p-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {questionnaire.length === 0 && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 text-yellow-400 text-sm mb-6">
              <strong>Attention:</strong> Aucun questionnaire de scoring n'est configuré. L'écran
              de saisie sera vide.{" "}
              <Link href="/admin/scoring" className="underline hover:text-yellow-300">
                Configurer un modèle de scoring →
              </Link>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Projet à évaluer <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                required
                disabled={projects.length === 0}
              >
                <option value="">— Choisir un projet —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
              {projects.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Aucun projet disponible.{" "}
                  <Link href="/projects/new" className="text-cyan-400 hover:underline">
                    Créer un projet
                  </Link>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Recommandation initiale
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
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Notes préliminaires
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                rows={3}
                placeholder="Contexte, informations importantes…"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || !formData.projectId}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Création…
                  </>
                ) : (
                  <>
                    <BarChart3 size={16} />
                    Lancer l'évaluation
                  </>
                )}
              </button>
              <Link
                href="/evaluations"
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all text-center"
              >
                Annuler
              </Link>
            </div>
          </form>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <BarChart3 size={16} className="text-cyan-400" />
              Questionnaire de scoring
            </h3>
            {questionnaire.length > 0 ? (
              <div className="space-y-2">
                {questionnaire.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-400">{domain.label}</span>
                    <span className="text-slate-500">
                      {domain.children?.length ?? 0} critères
                    </span>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500">
                  {questionnaire.length} domaines · {questionnaire.reduce(
                    (s, d) => s + (d.children?.length ?? 0),
                    0
                  )}{" "}
                  critères au total
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Aucun modèle actif</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-400">Processus d'évaluation</p>
            <ol className="space-y-1.5 list-decimal list-inside">
              <li>Sélectionner le projet</li>
              <li>Renseigner les critères par domaine</li>
              <li>Calculer le score final</li>
              <li>Soumettre pour validation</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
