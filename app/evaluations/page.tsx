"use client";

import Link from "next/link";
import { Plus, Search, Eye, Edit2, Trash2, Archive, Lock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DeleteConfirmation } from "@/components/modals/DeleteConfirmation";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { usePermission } from "@/lib/hooks/usePermission";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  RATING_COLORS,
} from "@/lib/ui-constants";
import { apiGet, apiDelete, apiPut } from "@/lib/api-client";

interface EvaluationRow {
  id: string;
  projectId: string;
  projectName: string;
  analyst?: string;
  status: string;
  finalScore: number | null;
  rating: string | null;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export default function EvaluationsPage() {
  const router = useRouter();
  const { can } = usePermission();
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRating, setFilterRating] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useKeyboardShortcuts([
    {
      key: "Escape",
      callback: () => setDeleteConfirm(null),
      enabled: deleteConfirm !== null,
    },
    {
      key: "Enter",
      callback: () => deleteConfirm && handleDelete(deleteConfirm),
      enabled: deleteConfirm !== null && !deleting,
    },
  ]);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await apiGet("/api/evaluations?limit=100");
      if (!res.ok) throw new Error("Erreur lors du chargement des évaluations");
      const data = await res.json();
      const rows: EvaluationRow[] = (data.data || []).map((ev: any) => ({
        id: ev.id,
        projectId: ev.projectId,
        projectName: ev.project?.nom || "Projet inconnu",
        analyst: ev.analyst ? `${ev.analyst.prenom || ""} ${ev.analyst.nom || ""}`.trim() : "N/A",
        status: ev.status || "brouillon",
        finalScore: ev.finalScore,
        rating: ev.rating,
        createdAt: ev.createdAt,
        updatedAt: ev.updatedAt,
        isArchived: ev.isArchived,
      }));
      setEvaluations(rows);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (evaluationId: string) => {
    try {
      setDeleting(true);
      const res = await apiDelete(`/api/evaluations/${evaluationId}`);
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setEvaluations(evaluations.filter((e) => e.id !== evaluationId));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || "Erreur de suppression");
    } finally {
      setDeleting(false);
    }
  };

  const handleArchive = async (evaluationId: string, archive: boolean) => {
    try {
      setArchiving(true);
      const ev = evaluations.find((e) => e.id === evaluationId);
      if (!ev) return;

      const res = await apiPut(`/api/evaluations/${evaluationId}`, { ...ev, isArchived: archive });
      if (!res.ok) throw new Error("Erreur lors de l'archivage");

      setEvaluations(
        evaluations.map((e) =>
          e.id === evaluationId ? { ...e, isArchived: archive } : e
        )
      );
    } catch (err: any) {
      setError(err.message || "Erreur d'archivage");
    } finally {
      setArchiving(false);
    }
  };

  const getRatingColor = (rating: string | null) => {
    if (!rating) return "bg-slate-600 text-slate-300";
    if (rating.startsWith("AA")) return "bg-green-500/20 text-green-400";
    if (rating.startsWith("A")) return "bg-blue-500/20 text-blue-400";
    if (rating.startsWith("BBB")) return "bg-cyan-500/20 text-cyan-400";
    return "bg-red-500/20 text-red-400";
  };

  const getStatusLabel = (status: string) => STATUS_LABELS[status] || status;
  const getStatusColor = (status: string) => STATUS_COLORS[status] || "bg-slate-600 text-slate-300";

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR");
    } catch {
      return dateStr;
    }
  };

  const filtered = useMemo(
    () =>
      evaluations.filter(
        (ev) =>
          (showArchived ? ev.isArchived : !ev.isArchived) &&
          ev.projectName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (!filterStatus || ev.status === filterStatus) &&
          (!filterRating || ev.rating === filterRating)
      ),
    [evaluations, searchTerm, filterStatus, filterRating, showArchived]
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Évaluations</h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Gérez les évaluations de risque des projets
          </p>
        </div>
        {can("evaluation", "create") ? (
          <Link
            href="/evaluations/new"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-all w-full md:w-auto justify-center md:justify-start"
          >
            <Plus size={20} />
            <span>Nouvelle Évaluation</span>
          </Link>
        ) : (
          <div className="inline-flex items-center space-x-2 bg-slate-700/50 text-slate-400 font-semibold px-4 py-2 rounded-lg w-full md:w-auto justify-center md:justify-start">
            <Lock size={20} />
            <span>Nouvelle Évaluation</span>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Rechercher par projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm md:text-base"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="soumis">Soumis</option>
            <option value="valide">Validé</option>
            <option value="rejete">Rejeté</option>
          </select>

          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
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

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showArchived
                ? "bg-amber-600 text-white"
                : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            <Archive size={16} className="inline mr-2" />
            {showArchived ? "Archivées" : "Actives"}
          </button>
        </div>

        <p className="text-sm text-slate-400">
          {filtered.length} évaluation{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Projet</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Score</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Rating</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Statut</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Aucune évaluation trouvée
                  </td>
                </tr>
              ) : (
                filtered.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-white">{ev.projectName}</td>
                    <td className="px-6 py-3 font-bold text-cyan-400">
                      {ev.finalScore != null ? ev.finalScore.toFixed(2) : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRatingColor(ev.rating)}`}>
                        {ev.rating || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ev.status)}`}>
                        {getStatusLabel(ev.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-400 text-sm">{formatDate(ev.createdAt)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/evaluations/${ev.id}`}
                          className="p-2 text-cyan-400 hover:bg-slate-600 rounded-lg transition-colors"
                          title="Consulter"
                        >
                          <Eye size={16} />
                        </Link>
                        {!ev.isArchived && can("evaluation", "update") && (
                          <Link
                            href={`/evaluations/${ev.id}/edit`}
                            className="p-2 text-blue-400 hover:bg-slate-600 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </Link>
                        )}
                        {can("evaluation", "delete") && (
                          <>
                            <button
                              onClick={() =>
                                handleArchive(ev.id, !ev.isArchived)
                              }
                              disabled={archiving}
                              className="p-2 text-amber-400 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
                              title={ev.isArchived ? "Restaurer" : "Archiver"}
                            >
                              <Archive size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(ev.id)}
                              className="p-2 text-red-400 hover:bg-slate-600 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={evaluations.length.toString()} />
        <StatCard
          label="Validées"
          value={evaluations.filter((e) => e.status === "valide").length.toString()}
        />
        <StatCard
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
        <StatCard
          label="Archivées"
          value={evaluations.filter((e) => e.isArchived).length.toString()}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteConfirm !== null}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
        isDeleting={deleting}
        title="Supprimer l'évaluation"
        message="Êtes-vous sûr de vouloir supprimer cette évaluation ? Cette action est irréversible."
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 p-4">
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
    </div>
  );
}
