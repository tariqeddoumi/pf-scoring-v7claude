"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { apiGet } from "@/lib/api-client";

interface Project {
  id: string;
  nom: string;
  secteur: string;
  montant: number;
  devise: string;
  status: string;
  scoreGlobal: number | null;
  grade: string | null;
}

export default function ComparePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await apiGet("/api/projects?limit=100");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.data || []);
        }
      } catch {
        // Silent fail - show empty list
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleSelectProject = (id: string) => {
    if (selectedProjects.includes(id)) {
      setSelectedProjects(selectedProjects.filter((p) => p !== id));
    } else if (selectedProjects.length < 4) {
      setSelectedProjects([...selectedProjects, id]);
    }
  };

  const compareProjects = projects.filter((p) =>
    selectedProjects.includes(p.id)
  );

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      brouillon: "Brouillon",
      en_cours: "En cours",
      en_revue: "En révision",
      approuve: "Approuvé",
      rejete: "Rejeté",
    };
    return labels[status] || status;
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)}M`;
    return amount.toLocaleString("fr-FR");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Comparaison de Projets
        </h1>
        <p className="text-slate-400 mt-2">
          Comparez jusqu&apos;à 4 projets côte à côte
        </p>
      </div>

      {/* Project Selection */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Sélectionner des Projets
        </h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-2">Chargement...</p>
          </div>
        ) : projects.length === 0 ? (
          <p className="text-slate-400 text-center py-4">
            Aucun projet disponible
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  selectedProjects.includes(project.id)
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-slate-600 bg-slate-700 hover:border-slate-500"
                }`}
              >
                <h3 className="font-semibold text-white">{project.nom}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {project.secteur || "Secteur non défini"}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-sm text-cyan-400 font-bold">
                    {project.scoreGlobal != null
                      ? `Score: ${project.scoreGlobal.toFixed(2)}/10`
                      : "Non noté"}
                  </p>
                  {project.grade && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-600 text-white">
                      {project.grade}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {compareProjects.length > 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                    Métrique
                  </th>
                  {compareProjects.map((project) => (
                    <th
                      key={project.id}
                      className="px-4 py-3 text-left text-sm font-semibold text-white"
                    >
                      {project.nom}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                <Row
                  label="Score Global"
                  values={compareProjects.map((p) =>
                    p.scoreGlobal != null
                      ? `${p.scoreGlobal.toFixed(2)}/10`
                      : "—"
                  )}
                  highlight
                />
                <Row
                  label="Rating"
                  values={compareProjects.map((p) => p.grade || "—")}
                  highlight
                />
                <Row
                  label="Statut"
                  values={compareProjects.map((p) => getStatusLabel(p.status))}
                />
                <Row
                  label="Montant (MAD)"
                  values={compareProjects.map((p) => formatAmount(p.montant))}
                />
                <Row
                  label="Devise"
                  values={compareProjects.map((p) => p.devise || "MAD")}
                />
                <Row
                  label="Secteur"
                  values={compareProjects.map((p) => p.secteur || "—")}
                />
              </tbody>
            </table>
          </div>

          {/* Export Button */}
          <div className="p-4 border-t border-slate-700 flex justify-end">
            <button className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all">
              <Download size={18} />
              <span>Exporter Comparaison</span>
            </button>
          </div>
        </div>
      )}

      {selectedProjects.length === 0 && !loading && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
          <p className="text-slate-400">
            Sélectionnez au moins 2 projets pour comparer
          </p>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  values,
  highlight,
}: {
  label: string;
  values: string[];
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? "bg-slate-700" : ""}>
      <td className="px-4 py-3 font-semibold text-white">{label}</td>
      {values.map((value, i) => (
        <td
          key={i}
          className={`px-4 py-3 ${highlight ? "text-cyan-400 font-bold" : "text-slate-300"}`}
        >
          {value}
        </td>
      ))}
    </tr>
  );
}
