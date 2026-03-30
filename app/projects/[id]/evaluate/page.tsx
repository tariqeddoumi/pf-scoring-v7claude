"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ScoreOption {
  id: string;
  label: string;
  score: number;
}

interface ScoreRange {
  id: string;
  minValue: number;
  maxValue: number;
  score: number;
  label?: string;
}

interface Criterion {
  id: string;
  code: string;
  label: string;
  type: string;
  options?: ScoreOption[];
  ranges?: ScoreRange[];
}

interface Domain {
  id: string;
  code: string;
  label: string;
  weight: number;
  criteria: Criterion[];
}

interface ProjectData {
  id: string;
  nom: string;
  countryCode?: string;
}

interface DomainScore {
  domainCode: string;
  score: number;
  weight: number;
}

export default function EvaluationFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState<ProjectData | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setProjectId(id);
      await fetchProject(id);
      await fetchDomains();
    };
    getParams();
  }, [params]);

  const fetchProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const fetchDomains = async () => {
    try {
      const res = await fetch("/api/admin/domains");
      if (res.ok) {
        const domainsData = await res.json();
        // Charger les critères pour chaque domaine
        const domainsWithCriteria = await Promise.all(
          domainsData
            .filter((d: Domain) => d.weight > 0)
            .map(async (domain: Domain) => {
              const criteriaRes = await fetch(
                `/api/admin/domains/${domain.id}/criteria`
              );
              const criteria = criteriaRes.ok
                ? await criteriaRes.json()
                : [];
              return { ...domain, criteria };
            })
        );
        setDomains(domainsWithCriteria);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (criterionId: string, value: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [criterionId]: value,
    }));
  };

  const calculateScore = (criterion: Criterion, answer: string | number) => {
    if (criterion.type === "OPTION") {
      const option = criterion.options?.find((o) => o.id === answer);
      return option?.score ?? 0;
    } else if (criterion.type === "RANGE") {
      const numValue = typeof answer === "string" ? parseFloat(answer) : answer;
      const range = criterion.ranges?.find(
        (r) => numValue >= r.minValue && numValue <= r.maxValue
      );
      return range?.score ?? 0;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Calculer les scores par domaine
      const composantes: DomainScore[] = domains.map((domain) => {
        const domainScores = domain.criteria
          .filter((c) => answers[c.id] !== undefined && answers[c.id] !== "")
          .map((c) => calculateScore(c, answers[c.id]));

        const avgScore =
          domainScores.length > 0
            ? domainScores.reduce((a, b) => a + b, 0) / domainScores.length
            : 0;

        return {
          domainCode: domain.code,
          score: avgScore,
          weight: domain.weight,
        };
      });

      // Soumettre le score
      const res = await fetch(`/api/projects/${projectId}/scoring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          composantes,
          countryCode: project?.countryCode,
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la soumission");
      }

      alert("Évaluation sauvegardée avec succès !");
      // Retourner à la page du projet
      window.location.href = `/projects/${projectId}`;
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href={`/projects/${projectId}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Évaluation du Projet</h1>
            {project && (
              <p className="mt-2 text-muted-foreground">{project.nom}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {domains.map((domain) => (
            <Card key={domain.id} className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">{domain.label}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Poids: {(domain.weight * 100).toFixed(0)}%
                </p>
              </div>

              <div className="space-y-6">
                {domain.criteria.map((criterion) => (
                  <div key={criterion.id} className="border-l-2 border-primary pl-4">
                    <label className="block text-sm font-medium mb-3">
                      {criterion.label}
                    </label>

                    {criterion.type === "OPTION" ? (
                      <div className="space-y-2">
                        {criterion.options?.map((option) => (
                          <label
                            key={option.id}
                            className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-secondary"
                          >
                            <input
                              type="radio"
                              name={criterion.id}
                              value={option.id}
                              checked={answers[criterion.id] === option.id}
                              onChange={(e) =>
                                handleAnswerChange(criterion.id, e.target.value)
                              }
                              className="w-4 h-4"
                            />
                            <span>{option.label}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              Score: {option.score}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <Input
                          type="number"
                          value={answers[criterion.id] ?? ""}
                          onChange={(e) =>
                            handleAnswerChange(criterion.id, e.target.value)
                          }
                          placeholder="Entrez une valeur numérique"
                          className="mb-3"
                        />
                        <div className="bg-secondary/50 p-3 rounded text-xs space-y-1">
                          {criterion.ranges?.map((range) => (
                            <div key={range.id} className="flex justify-between">
                              <span>
                                {range.label || `${range.minValue} à ${range.maxValue}`}
                              </span>
                              <span>→ {range.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Aperçu du score */}
                    {answers[criterion.id] !== undefined && answers[criterion.id] !== "" && (
                      <div className="mt-2 text-sm text-green-400">
                        Score: {calculateScore(criterion, answers[criterion.id])}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Envoi..." : "Sauvegarder l'évaluation"}
            </Button>
            <Link href={`/projects/${projectId}`} className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Annuler
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
