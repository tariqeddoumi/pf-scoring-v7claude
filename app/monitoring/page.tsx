"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle, Clock, BarChart3 } from "lucide-react";
import { apiGet } from "@/lib/api-client";

interface ProjectMonitoring {
  id: string;
  nom: string;
  secteur: string;
  montant: number;
  status: string;
  scoreGlobal: number | null;
  grade: string | null;
  dateCreation: string;
}

export default function MonitoringPage() {
  const [projects, setProjects] = useState<ProjectMonitoring[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Fetch only approved/active projects for monitoring
        const res = await apiGet("/api/projects?limit=100");
        if (res.ok) {
          const data = await res.json();
          const allProjects: ProjectMonitoring[] = data.data || [];
          // Show all projects but highlight approved ones
          setProjects(allProjects);
          if (allProjects.length > 0) {
            setSelectedProject(allProjects[0].id);
          }
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const project = projects.find((p) => p.id === selectedProject);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Suivi Post-Clôture</h1>
          <p className="text-slate-400 mt-2">Chargement...</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Suivi Post-Clôture</h1>
          <p className="text-slate-400 mt-2">Monitoring des projets financés</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
          <p className="text-slate-400">
            Aucun projet disponible pour le monitoring
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approuve":
        return "text-green-400";
      case "en_revue":
        return "text-yellow-400";
      case "rejete":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

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

  const getScoreStatus = (
    score: number | null
  ): "ok" | "warning" | "critical" => {
    if (score == null) return "warning";
    if (score >= 7) return "ok";
    if (score >= 5) return "warning";
    return "critical";
  };

  const getGradeStatus = (
    grade: string | null
  ): "ok" | "warning" | "critical" => {
    if (!grade) return "warning";
    if (grade.startsWith("A")) return "ok";
    if (grade.startsWith("BBB")) return "ok";
    if (grade.startsWith("BB")) return "warning";
    return "critical";
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B MAD`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)}M MAD`;
    return `${amount.toLocaleString("fr-FR")} MAD`;
  };

  // Build monitoring-like covenants from available data
  const covenants = project
    ? [
        {
          name: "Score Global",
          status: getScoreStatus(project.scoreGlobal),
          value:
            project.scoreGlobal != null
              ? `${project.scoreGlobal.toFixed(2)}/10`
              : "Non évalué",
        },
        {
          name: "Grade",
          status: getGradeStatus(project.grade),
          value: project.grade || "Non noté",
        },
        {
          name: "Statut Projet",
          status:
            project.status === "approuve"
              ? ("ok" as const)
              : project.status === "rejete"
                ? ("critical" as const)
                : ("warning" as const),
          value: getStatusLabel(project.status),
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Suivi Post-Clôture</h1>
        <p className="text-slate-400 mt-2">Monitoring des projets financés</p>
      </div>

      {/* Project Selector */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <label className="text-sm font-semibold text-white block mb-3">
          Sélectionner un Projet
        </label>
        <div className="flex flex-wrap gap-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p.id)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedProject === p.id
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {p.nom}
            </button>
          ))}
        </div>
      </div>

      {project && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Score Global"
              value={
                project.scoreGlobal != null
                  ? `${project.scoreGlobal.toFixed(2)}`
                  : "—"
              }
              target="/10"
              status={getScoreStatus(project.scoreGlobal)}
            />
            <MetricCard
              label="Grade"
              value={project.grade || "—"}
              target="Rating Basel"
              status={getGradeStatus(project.grade)}
            />
            <MetricCard
              label="Montant"
              value={formatAmount(project.montant)}
              target={project.secteur || ""}
              status="ok"
            />
          </div>

          {/* Covenants / Indicators */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
              <CheckCircle size={24} />
              <span>Indicateurs de Suivi</span>
            </h2>

            <div className="space-y-3">
              {covenants.map((covenant, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {covenant.status === "ok" ? (
                      <CheckCircle className="text-green-400" size={20} />
                    ) : covenant.status === "warning" ? (
                      <AlertTriangle className="text-yellow-400" size={20} />
                    ) : (
                      <AlertTriangle className="text-red-400" size={20} />
                    )}
                    <div>
                      <p className="font-semibold text-white">
                        {covenant.name}
                      </p>
                      <p className="text-sm text-slate-400">{covenant.value}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      covenant.status === "ok"
                        ? "bg-green-500/20 text-green-400"
                        : covenant.status === "warning"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {covenant.status === "ok"
                      ? "OK"
                      : covenant.status === "warning"
                        ? "Attention"
                        : "Critique"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Project Summary */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
              <BarChart3 size={24} />
              <span>Résumé du Projet</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-400">Nom</p>
                <p className="text-white font-semibold mt-1">{project.nom}</p>
              </div>
              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-400">Secteur</p>
                <p className="text-white font-semibold mt-1">
                  {project.secteur || "Non défini"}
                </p>
              </div>
              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-400">Montant</p>
                <p className="text-white font-semibold mt-1">
                  {formatAmount(project.montant)}
                </p>
              </div>
              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-400">Statut</p>
                <p
                  className={`font-semibold mt-1 ${getStatusColor(project.status)}`}
                >
                  {getStatusLabel(project.status)}
                </p>
              </div>
            </div>
          </div>

          {/* Last Review / Actions */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="text-cyan-400" size={20} />
              <div>
                <p className="text-sm text-slate-400">Date de Création</p>
                <p className="text-white font-semibold">
                  {new Date(project.dateCreation).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
            <Link
              href={`/projects/${project.id}`}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all"
            >
              Voir Détails
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  target,
  status,
}: {
  label: string;
  value: string;
  target: string;
  status: "ok" | "warning" | "critical";
}) {
  const statusColor =
    status === "ok"
      ? "from-green-600 to-green-700"
      : status === "warning"
        ? "from-yellow-600 to-yellow-700"
        : "from-red-600 to-red-700";

  return (
    <div
      className={`rounded-lg bg-gradient-to-br ${statusColor} p-6 text-white`}
    >
      <p className="text-sm opacity-90 mb-2">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs opacity-75 mt-1">{target}</p>
    </div>
  );
}
