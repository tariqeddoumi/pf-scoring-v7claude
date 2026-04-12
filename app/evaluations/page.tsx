"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Eye, Edit2, Download } from "lucide-react";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  RATING_COLORS,
} from "@/lib/ui-constants";

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

export default function EvaluationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Évaluations</h1>
          <p className="text-slate-400 mt-2">
            Gestion et suivi des évaluations de risque
          </p>
        </div>
        <Link
          href="/evaluations/new"
          className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Plus size={20} />
          <span>Nouvelle Évaluation</span>
        </Link>
      </div>

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

        {/* Results Count */}
        <p className="text-sm text-slate-400 mb-4">
          {filtered.length} évaluation{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
          {(searchTerm || selectedStatus || selectedRating) && ` sur ${evaluations.length}`}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                  Projet
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                  Analyste
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                  Rating
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Aucune évaluation trouvée
                  </td>
                </tr>
              )}
              {filtered.map((ev) => (
                <tr
                  key={ev.id}
                  className="hover:bg-slate-700 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-white">
                    {ev.projectName}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{ev.analyst}</td>
                  <td className="px-4 py-3 font-bold text-cyan-400">
                    {ev.finalScore != null ? ev.finalScore.toFixed(2) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getRatingColor(ev.rating)}`}
                    >
                      {ev.rating || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ev.status)}`}
                    >
                      {getStatusLabel(ev.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {formatDate(ev.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/evaluations/${ev.id}`}
                        className="p-2 text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Consulter"
                      >
                        <Eye size={16} />
                      </Link>
                      {ev.status === "brouillon" && (
                        <Link
                          href={`/evaluations/${ev.id}/edit`}
                          className="p-2 text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </Link>
                      )}
                      <button
                        className="p-2 text-green-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Exporter"
                      >
                        <Download size={16} />
                      </button>
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
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
      <p className="text-sm opacity-90 mb-2">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
