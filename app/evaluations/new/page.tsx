"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { SCORING_MODEL } from "@/lib/scoring-model";
import { calculateEvaluation } from "@/lib/scoring-engine";
import { useEvaluationWorkflow } from "@/lib/evaluation-context";

interface Responses {
  [criteriaId: string]: string | number;
}

interface Project {
  id: string;
  nom: string;
}

export default function NewEvaluationPage() {
  const router = useRouter();
  const { createEvaluation } = useEvaluationWorkflow();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [evaluationType, setEvaluationType] = useState("Initiale");
  const [analyst, setAnalyst] = useState("");
  const [expandedDomains, setExpandedDomains] = useState<string[]>(["D1"]);
  const [responses, setResponses] = useState<Responses>({});
  const [financialData] = useState({
    dscr: 1.35,
    equity: 20,
    hasGuarantees: true,
    contractsSigned: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Load projects from API on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) throw new Error("Failed to fetch projects");
        const data = await response.json();
        const projectList = data.data || [];
        setProjects(projectList);
        if (projectList.length > 0) {
          setProjectId(projectList[0].id);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Impossible de charger les projets");
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const toggleDomain = (domainId: string) => {
    setExpandedDomains((prev) =>
      prev.includes(domainId)
        ? prev.filter((d) => d !== domainId)
        : [...prev, domainId]
    );
  };

  const handleResponseChange = (criteriaId: string, value: string | number) => {
    setResponses((prev) => ({ ...prev, [criteriaId]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!analyst.trim()) {
        setError("Veuillez indiquer le nom de l'analyste");
        setLoading(false);
        return;
      }

      // Calculate score
      const allResponses = Object.entries(responses).map(
        ([criteriaId, value]) => ({
          criteriaId,
          value: typeof value === "string" ? parseFloat(value) || value : value,
          comment: "",
        })
      );

      const result = calculateEvaluation(
        projectId,
        allResponses,
        financialData
      );
      console.log("Évaluation calculée:", result);

      // Create workflow
      const workflow = createEvaluation(projectId, analyst);
      console.log("Workflow créé:", workflow.id);

      // Redirect to detail page
      setTimeout(() => {
        router.push(`/evaluations/${workflow.id}`);
      }, 500);
    } catch (err) {
      setError("Erreur lors de la création de l'évaluation");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/evaluations"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Nouvelle Évaluation</h1>
          <p className="text-slate-400 mt-2">
            9 domaines • 27 sous-critères • Modèle V7++
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 flex items-start space-x-3">
          <AlertCircle
            size={20}
            className="text-red-400 flex-shrink-0 mt-0.5"
          />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Paramètres</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-white block mb-2">
              Projet
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              disabled={projectsLoading}
            >
              {projectsLoading ? (
                <option>Chargement des projets...</option>
              ) : projects.length > 0 ? (
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.nom}
                  </option>
                ))
              ) : (
                <option>Aucun projet disponible</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-white block mb-2">
              Type
            </label>
            <select
              value={evaluationType}
              onChange={(e) => setEvaluationType(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option>Initiale</option>
              <option>Annuelle</option>
              <option>Ad hoc</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-white block mb-2">
              Analyste
            </label>
            <input
              type="text"
              value={analyst}
              onChange={(e) => setAnalyst(e.target.value)}
              placeholder="Nom"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {SCORING_MODEL.map((domain) => (
          <div
            key={domain.id}
            className="rounded-lg border border-slate-700 bg-slate-800 overflow-hidden"
          >
            <button
              onClick={() => toggleDomain(domain.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-cyan-400">
                  {domain.id}
                </span>
                <span className="font-semibold text-white">{domain.name}</span>
                <span className="text-xs text-slate-400">
                  ({domain.weight}%)
                </span>
              </div>
              {expandedDomains.includes(domain.id) ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>

            {expandedDomains.includes(domain.id) && (
              <div className="border-t border-slate-700 p-4 space-y-4">
                {domain.subCriteria.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-slate-700 rounded-lg p-3 space-y-3"
                  >
                    <h4 className="font-semibold text-white text-sm">
                      {sub.label}
                    </h4>
                    {sub.criteria.map((crit) => (
                      <div key={crit.id} className="flex flex-col space-y-1">
                        <label className="text-xs text-slate-300">
                          {crit.label}
                        </label>
                        {crit.scale === "qualitative" ? (
                          <select
                            value={responses[crit.id] || ""}
                            onChange={(e) =>
                              handleResponseChange(crit.id, e.target.value)
                            }
                            className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm"
                          >
                            <option value="">-- Sélectionner --</option>
                            {crit.options?.map((opt) => (
                              <option key={opt.label} value={opt.label}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="number"
                            step="0.1"
                            value={responses[crit.id] || ""}
                            onChange={(e) =>
                              handleResponseChange(crit.id, e.target.value)
                            }
                            className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm"
                            placeholder="Valeur"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-all"
        >
          {loading ? "⏳ Création en cours..." : "✓ Calculer & Créer"}
        </button>
        <Link
          href="/evaluations"
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-3 rounded-lg transition-all text-center"
        >
          Annuler
        </Link>
      </div>
    </div>
  );
}
