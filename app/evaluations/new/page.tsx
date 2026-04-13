"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

interface Project {
  id: string;
  nom: string;
}

export default function NewEvaluationPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    projectId: "",
    recommendation: "APPROVE",
    notes: "",
    status: "brouillon",
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Erreur lors du chargement des projets");
        const data = await res.json();
        setProjects(data.data || []);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      router.push(`/evaluations/${newEval.data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <p className="text-xs text-slate-500 mt-2">
              {projects.length} projet{projects.length !== 1 ? "s" : ""} disponible{projects.length !== 1 ? "s" : ""}
            </p>
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
              rows={5}
              placeholder="Ajouter des notes ou commentaires..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !formData.projectId || projects.length === 0}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Création en cours...
                </>
              ) : (
                "Créer l'évaluation"
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
