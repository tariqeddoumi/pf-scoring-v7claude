"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { SCORING_MODEL } from "@/lib/scoring-model";
import { calculateEvaluation } from "@/lib/scoring-engine";
import { useEvaluationWorkflow } from "@/lib/evaluation-context";
import { Wizard } from "@/components/ui/Wizard";

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
  const [currentStep, setCurrentStep] = useState(0);

  // Grouper les domaines par étapes
  const domainGroups = [
    { name: "Domaines Financiers", ids: ["D1", "D2", "D3"] },
    { name: "Domaines Risques ESG", ids: ["D4", "D5", "D6"] },
    { name: "Domaines Légaux & Pays", ids: ["D7", "D8"] },
  ];

  const wizardSteps = [
    {
      id: "info",
      label: "Informations Générales",
      description: "Projet, Type et Analyste",
    },
    {
      id: "financial",
      label: "Domaines Financiers",
      description: "D1, D2, D3",
    },
    { id: "esg", label: "Domaines ESG", description: "D4, D5, D6" },
    { id: "legal", label: "Domaines Légaux", description: "D7, D8" },
    {
      id: "summary",
      label: "Synthèse & Conclusion",
      description: "Résumé et validation",
    },
  ];

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

  const handleResponseChange = (criteriaId: string, value: string | number) => {
    setResponses((prev) => ({ ...prev, [criteriaId]: value }));
  };

  const validateStep = (step: number): boolean => {
    setError("");

    if (step === 0) {
      // Validate info step
      if (!projectId) {
        setError("Veuillez sélectionner un projet");
        return false;
      }
      if (!analyst.trim()) {
        setError("Veuillez indiquer le nom de l'analyste");
        return false;
      }
      return true;
    }

    // Other steps are optional
    return true;
  };

  const handleStepChange = (newStep: number) => {
    if (newStep > currentStep && !validateStep(currentStep)) {
      return;
    }
    setCurrentStep(newStep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    setError("");
    setLoading(true);

    try {
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Info Générales
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-white block mb-2">
                Projet *
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                disabled={projectsLoading}
              >
                <option value="">-- Sélectionner un projet --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-white block mb-2">
                Type d'Évaluation
              </label>
              <select
                value={evaluationType}
                onChange={(e) => setEvaluationType(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
              >
                <option>Initiale</option>
                <option>Annuelle</option>
                <option>Ad hoc</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-white block mb-2">
                Analyste *
              </label>
              <input
                type="text"
                value={analyst}
                onChange={(e) => setAnalyst(e.target.value)}
                placeholder="Nom de l'analyste"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>
        );

      case 1:
      case 2:
      case 3:
        // Domain steps
        const groupIndex = currentStep - 1;
        const domainIds = domainGroups[groupIndex].ids;
        return (
          <div className="space-y-4">
            {SCORING_MODEL.filter((d) => domainIds.includes(d.id)).map(
              (domain) => (
                <div
                  key={domain.id}
                  className="border border-slate-700 rounded-lg p-4 space-y-3"
                >
                  <div>
                    <h4 className="text-lg font-semibold text-cyan-400 mb-2">
                      {domain.id} - {domain.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Poids: {domain.weight}%
                    </p>
                  </div>
                  {domain.subCriteria.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-slate-700/50 rounded p-3 space-y-2"
                    >
                      <h5 className="text-sm font-medium text-slate-300">
                        {sub.label}
                      </h5>
                      {sub.criteria.map((crit) => (
                        <div key={crit.id} className="space-y-1">
                          <label className="text-xs text-slate-400 block">
                            {crit.label}
                          </label>
                          {crit.scale === "qualitative" ? (
                            <select
                              value={responses[crit.id] || ""}
                              onChange={(e) =>
                                handleResponseChange(crit.id, e.target.value)
                              }
                              className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1.5 text-white text-sm"
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
                              className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1.5 text-white text-sm"
                              placeholder="Valeur"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        );

      case 4:
        // Summary
        return (
          <div className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">
                Récapitulatif
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-400">Projet:</span>
                  <span className="text-white ml-2">
                    {projects.find((p) => p.id === projectId)?.nom || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Type:</span>
                  <span className="text-white ml-2">{evaluationType}</span>
                </div>
                <div>
                  <span className="text-slate-400">Analyste:</span>
                  <span className="text-white ml-2">{analyst}</span>
                </div>
                <div>
                  <span className="text-slate-400">Domaines complétés:</span>
                  <span className="text-cyan-400 ml-2">
                    {
                      SCORING_MODEL.filter((d) =>
                        d.subCriteria.some((s) =>
                          s.criteria.some((c) => c.id in responses)
                        )
                      ).length
                    }
                    /{SCORING_MODEL.length}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                Cliquez sur "Valider" pour calculer le score et créer
                l'évaluation.
              </p>
            </div>
          </div>
        );

      default:
        return null;
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
            Interface guidée étape par étape
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

      <form onSubmit={handleSubmit}>
        <Wizard
          steps={wizardSteps}
          currentStep={currentStep}
          onStepChange={handleStepChange}
          canGoNext={true}
          isSubmitting={loading}
        >
          {renderStepContent()}
        </Wizard>
      </form>
    </div>
  );
}
