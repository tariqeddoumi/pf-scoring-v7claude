"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ProjectData {
  id: string;
  nom: string;
  description: string;
  secteur: string;
  montant: number;
  countryCode?: string;
  status: string;
  scoreGlobal?: number;
  grade?: string;
  dateCreation: string;
  dateMiseAJour: string;
}

interface Scoring {
  id: string;
  scoreGlobal: number;
  grade: string;
  dateCalcul: string;
}

const gradeColors: Record<string, string> = {
  AAA: "bg-green-100 text-green-800",
  AA: "bg-green-100 text-green-800",
  A: "bg-green-100 text-green-800",
  BBB: "bg-blue-100 text-blue-800",
  BB: "bg-blue-100 text-blue-800",
  B: "bg-blue-100 text-blue-800",
  CCC: "bg-yellow-100 text-yellow-800",
  CC: "bg-yellow-100 text-yellow-800",
  C: "bg-orange-100 text-orange-800",
  D: "bg-red-100 text-red-800",
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState<ProjectData | null>(null);
  const [scorings, setScorings] = useState<Scoring[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setProjectId(id);
      await fetchProject(id);
      await fetchScorings(id);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchScorings = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}/scorings`);
      if (res.ok) {
        const data = await res.json();
        setScorings(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const formatMAD = (amount: number) => {
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <Link href="/projects" className="text-primary hover:underline">
          ← Retour aux projets
        </Link>
        <p className="mt-4 text-muted-foreground">Projet non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{project.nom}</h1>
              <p className="mt-2 text-muted-foreground">{project.description}</p>
            </div>
          </div>
          {project.grade && (
            <Badge className={`text-lg px-4 py-2 ${gradeColors[project.grade]}`}>
              {project.grade}
            </Badge>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Secteur</p>
            <p className="font-semibold">{project.secteur}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Montant</p>
            <p className="font-semibold">{formatMAD(project.montant)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Pays</p>
            <p className="font-semibold">{project.countryCode || "-"}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Statut</p>
            <Badge variant="outline">{project.status}</Badge>
          </Card>
        </div>

        {/* Score Section */}
        {project.scoreGlobal !== undefined && (
          <Card className="mb-8 p-6">
            <h2 className="text-xl font-semibold mb-4">Score Global</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Score Final</p>
                <p className="text-3xl font-bold">{project.scoreGlobal.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grade</p>
                <Badge className={`text-lg ${gradeColors[project.grade || ""]}`}>
                  {project.grade}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dernière évaluation</p>
                <p className="font-medium">
                  {project.dateMiseAJour
                    ? formatDate(project.dateMiseAJour)
                    : "-"}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Evaluations History */}
        {scorings.length > 0 && (
          <Card className="mb-8 p-6">
            <h2 className="text-xl font-semibold mb-4">Historique d&apos;Évaluation</h2>
            <div className="space-y-3">
              {scorings.map((scoring) => (
                <div
                  key={scoring.id}
                  className="border rounded p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">Score: {scoring.scoreGlobal.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(scoring.dateCalcul)}
                    </p>
                  </div>
                  <Badge className={gradeColors[scoring.grade]}>
                    {scoring.grade}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Link href={`/projects/${projectId}/evaluate`}>
            <Button className="w-full md:w-auto">Évaluer le Projet</Button>
          </Link>
          <Link href="/projects">
            <Button variant="outline" className="w-full md:w-auto">
              Retour à la liste
            </Button>
          </Link>
        </div>

        {/* Metadata */}
        <Card className="mt-8 p-4 bg-secondary/50">
          <p className="text-xs text-muted-foreground">
            <strong>Créé:</strong> {formatDate(project.dateCreation)} |
            <strong className="ml-2">Modifié:</strong> {formatDate(project.dateMiseAJour)}
          </p>
        </Card>
      </div>
    </div>
  );
}
