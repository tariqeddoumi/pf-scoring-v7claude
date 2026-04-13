"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Eye, Edit2, Download, Loader2 } from "lucide-react";
import {
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/ui-constants";
import { usePermission } from "@/lib/hooks/usePermission";
import { Tabs } from "@/components/ui/Tabs";

interface EvaluationRow {
  id: string;
  projectId: string;
  projectName: string;
  analyst: string;
  status: string;
  finalScore: number | null;
  rating: string | null;
  createdAt: string;
}

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
}

interface Project {
  id: string;
  nom: string;
}

export default function EvaluationsPage() {
  const { can } = usePermission();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pour créer une nouvelle évaluation
  const [projects, setProjects] = useState<Project[]>([]);
  const [creatingEvaluation, setCreatingEvaluation] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createFormData, setCreateFormData] = useState<Partial<Evaluation>>({
    projectId: "",
    recommendation: "APPROVE",
    notes: "",
    status: "brouillon",
  });

  // Pour modifier une évaluation
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
  const [editingEvaluation, setEditingEvaluation] = useState(false);
  const [editError, setEditError] = useState("");
  const [activeTab, setActiveTab] = useState("visualiser");

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const res = await fetch("/api/evaluations?limit=100");
        if (!res.ok)
          throw new Error("Erreur lors du chargement des évaluations");
        const data = await res.json();
        const rows: EvaluationRow[] = (data.data || []).map((ev: any) => ({
          id: ev.id,
          projectId: ev.projectId,
          projectName: ev.project?.nom || "Projet inconnu",
          analyst: ev.analyst
            ? `${ev.analyst.prenom || ""} ${ev.analyst.nom || ""}`.trim()
            : "N/A",
          status: ev.status || "brouillon",
          finalScore: ev.finalScore,
          rating: ev.rating,
          createdAt: ev.createdAt,
        }));
        setEvaluations(rows);
      } catch (err: any) {
        setError(err.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluations();
  }, []);

  // Charger les projets au montage du composant (pas dépendant de l'onglet actif)
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) {
          throw new Error("Impossible de charger les projets");
        }
        const data = await res.json();
        // data retourne { data: projects, pagination: {...} }
        const projectsList = data.data || data || [];
        console.log("Projets chargés:", projectsList);
        setProjects(Array.isArray(projectsList) ? projectsList : []);
      } catch (err) {
        console.error("Erreur lors du chargement des projets:", err);
        setCreateError("Erreur lors du chargement des projets");
      }
    };
    fetchProjects();
  }, []); // Charger une seule fois au montage


  // Charger l'évaluation sélectionnée pour la modification
  useEffect(() => {
    if (selectedEvaluationId) {
      const fetchEvaluation = async () => {
        try {
          const res = await fetch(`/api/evaluations/${selectedEvaluationId}`);
          if (res.ok) {
            const data = await res.json();
            setSelectedEvaluation(data.data);
          }
        } catch (err) {
          setEditError("Erreur lors du chargement de l'évaluation");
        }
      };
      fetchEvaluation();
    }
  }, [selectedEvaluationId]);

  const filtered = evaluations.filter(
    (ev) =>
      ev.projectName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!selectedStatus || ev.status === selectedStatus) &&
      (!selectedRating || ev.rating === selectedRating)
  );

  const getRatingColor = (rating: string | null) => {
    if (!rating) return "bg-slate-600 text-slate-300";
    if (rating.startsWith("AA")) return "bg-green-500/20 text-green-400";
    if (rating.startsWith("A")) return "bg-blue-500/20 text-blue-400";
    if (rating.startsWith("BBB")) return "bg-cyan-500/20 text-cyan-400";
    return "bg-red-500/20 text-red-400";
  };

  const getStatusColor = (status: string) =>
    STATUS_COLORS[status] || "bg-slate-600 text-slate-300";
  const getStatusLabel = (status: string) => STATUS_LABELS[status] || status;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR");
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Évaluations</h1>
          <p className="text-slate-400 mt-2">Chargement...</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Contenu de l'onglet Visualiser
  const visualiserContent = (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-3 text-slate-500"
            />
            <input
              type="text"
              placeholder="Rechercher par nom de projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="soumis">Soumis</option>
            <option value="valide">Validé</option>
            <option value="rejete">Rejeté</option>
          </select>
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">Tous les ratings</option>
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

        <p className="text-sm text-slate-400 mb-4">
          {filtered.length} évaluation{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
          {(searchTerm || selectedStatus || selectedRating) && ` sur ${evaluations.length}`}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Projet</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Analyste</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Score</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Aucune évaluation trouvée
                  </td>
                </tr>
              )}
              {filtered.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-700 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{ev.projectName}</td>
                  <td className="px-4 py-3 text-slate-300">{ev.analyst}</td>
                  <td className="px-4 py-3 font-bold text-cyan-400">
                    {ev.finalScore != null ? ev.finalScore.toFixed(2) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRatingColor(ev.rating)}`}>
                      {ev.rating || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ev.status)}`}>
                      {getStatusLabel(ev.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{formatDate(ev.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/evaluations/${ev.id}`}
                        className="p-2 text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Consulter"
                      >
                        <Eye size={16} />
                      </Link>
                      {ev.status === "brouillon" && can("evaluation", "update") && (
                        <button
                          onClick={() => {
                            setSelectedEvaluationId(ev.id);
                            setActiveTab("modifier");
                          }}
                          className="p-2 text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {can("evaluation", "export") && (
                        <button
                          className="p-2 text-green-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Exporter"
                        >
                          <Download size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card label="Total" value={evaluations.length.toString()} />
        <Card
          label="Validées"
          value={evaluations
            .filter((e) => e.status === "valide")
            .length.toString()}
        />
        <Card
          label="Score moyen"
          value={
            evaluations.filter((e) => e.finalScore != null).length > 0
              ? (
                  evaluations
                    .filter((e) => e.finalScore != null)
                    .reduce((sum, e) => sum + (e.finalScore || 0), 0) /
                  evaluations.filter((e) => e.finalScore != null).length
                ).toFixed(2)
              : "—"
          }
        />
        <Card
          label="En attente"
          value={evaluations
            .filter((e) => e.status === "soumis")
            .length.toString()}
        />
      </div>
    </div>
  );

  // Contenu de l'onglet Créer
  const creerContent = (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 max-w-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Nouvelle Évaluation</h2>
        <p className="text-slate-400 text-sm mb-6">Créez une nouvelle évaluation de risque pour un projet</p>

        {createError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm mb-6">
            {createError}
          </div>
        )}

        {projects.length === 0 && !createError && (
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 text-yellow-400 text-sm mb-6">
            Aucun projet trouvé. Veuillez créer un projet d'abord.
          </div>
        )}

        <form
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setCreatingEvaluation(true);
            setCreateError("");
            try {
              const res = await fetch("/api/evaluations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createFormData),
              });
              if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Erreur lors de la création");
              }
              const newEval = await res.json();
              setEvaluations([
                ...evaluations,
                {
                  id: newEval.data.id,
                  projectId: newEval.data.projectId,
                  projectName: newEval.data.project?.nom || "Projet inconnu",
                  analyst: "N/A",
                  status: newEval.data.status,
                  finalScore: null,
                  rating: null,
                  createdAt: new Date().toISOString(),
                },
              ]);
              setCreateFormData({
                projectId: "",
                recommendation: "APPROVE",
                notes: "",
                status: "brouillon",
              });
              setActiveTab("visualiser");
            } catch (err: any) {
              setCreateError(err.message);
            } finally {
              setCreatingEvaluation(false);
            }
          }}
        >
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Sélectionner un projet *</label>
            <select
              value={createFormData.projectId || ""}
              onChange={(e) => setCreateFormData({ ...createFormData, projectId: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
              required
              disabled={projects.length === 0}
            >
              <option value="">-- Choisir un projet --</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">{projects.length} projet{projects.length !== 1 ? "s" : ""} disponible{projects.length !== 1 ? "s" : ""}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Recommandation</label>
            <select
              value={createFormData.recommendation || "APPROVE"}
              onChange={(e) => setCreateFormData({ ...createFormData, recommendation: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
            >
              <option value="APPROVE">Approuver</option>
              <option value="REJECT">Rejeter</option>
              <option value="PENDING">En attente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Notes</label>
            <textarea
              value={createFormData.notes || ""}
              onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
              rows={4}
              placeholder="Ajouter des notes ou commentaires..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={creatingEvaluation || !createFormData.projectId || projects.length === 0}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {creatingEvaluation ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Créer l'évaluation
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateFormData({
                  projectId: "",
                  recommendation: "APPROVE",
                  notes: "",
                  status: "brouillon",
                });
                setCreateError("");
              }}
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Contenu de l'onglet Modifier
  const modifierContent = (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 max-w-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Modifier une Évaluation</h2>
        <p className="text-slate-400 text-sm mb-6">Mettez à jour les détails d'une évaluation existante</p>

        {editError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm mb-6">
            {editError}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-3">Sélectionner une évaluation *</label>
          <select
            value={selectedEvaluationId || ""}
            onChange={(e) => setSelectedEvaluationId(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
          >
            <option value="">-- Choisir une évaluation --</option>
            {evaluations.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.projectName} ({getStatusLabel(ev.status)})
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">{evaluations.length} évaluation{evaluations.length !== 1 ? "s" : ""} disponible{evaluations.length !== 1 ? "s" : ""}</p>
        </div>

        {selectedEvaluation && (
          <form
            className="space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              setEditingEvaluation(true);
              setEditError("");
              try {
                const res = await fetch(`/api/evaluations/${selectedEvaluationId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(selectedEvaluation),
                });
                if (!res.ok) {
                  const error = await res.json();
                  throw new Error(error.error || "Erreur lors de la modification");
                }
                setEvaluations(
                  evaluations.map((e) => (e.id === selectedEvaluationId ? { ...e, ...selectedEvaluation } : e))
                );
                setSelectedEvaluationId(null);
                setSelectedEvaluation(null);
                setActiveTab("visualiser");
              } catch (err: any) {
                setEditError(err.message);
              } finally {
                setEditingEvaluation(false);
              }
            }}
          >
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">Recommandation</label>
              <select
                value={selectedEvaluation.recommendation || "APPROVE"}
                onChange={(e) => setSelectedEvaluation({ ...selectedEvaluation, recommendation: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
              >
                <option value="APPROVE">Approuver</option>
                <option value="REJECT">Rejeter</option>
                <option value="PENDING">En attente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">Statut</label>
              <select
                value={selectedEvaluation.status || "brouillon"}
                onChange={(e) => setSelectedEvaluation({ ...selectedEvaluation, status: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
              >
                <option value="brouillon">Brouillon</option>
                <option value="soumis">Soumis</option>
                <option value="valide">Validé</option>
                <option value="rejete">Rejeté</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">Notes</label>
              <textarea
                value={selectedEvaluation.notes || ""}
                onChange={(e) => setSelectedEvaluation({ ...selectedEvaluation, notes: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                rows={4}
                placeholder="Ajouter des notes ou commentaires..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={editingEvaluation}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {editingEvaluation ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Edit2 size={16} />
                    Enregistrer les modifications
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedEvaluationId(null);
                  setSelectedEvaluation(null);
                  setEditError("");
                }}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  // Construire les onglets
  const tabs = [
    {
      id: "visualiser",
      label: "Visualiser",
      icon: <Eye size={20} />,
      content: visualiserContent,
    },
  ];

  if (can("evaluation", "create")) {
    tabs.push({
      id: "creer",
      label: "Créer",
      icon: <Plus size={20} />,
      content: creerContent,
    });
  }

  tabs.push({
    id: "modifier",
    label: "Modifier",
    icon: <Edit2 size={20} />,
    content: modifierContent,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Évaluations</h1>
        <p className="text-slate-400 mt-2">Gestion et suivi des évaluations de risque</p>
      </div>

      <Tabs
        tabs={tabs}
        defaultTab={activeTab}
      />
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
      <p className="text-sm opacity-90 mb-2">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
