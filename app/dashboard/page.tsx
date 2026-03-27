"use client";

import { StatsCard } from "@/components/dashboard/stats-card";
import { ProjectList } from "@/components/project/project-list";
import { Card } from "@/components/ui/card";
import type { Project } from "@/types";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        setProjects(data);
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  const totalProjects = projects.length;
  const projectsEnCours = projects.filter(p => p.status === "en_cours").length;
  const scoresMoyens = projects
    .filter(p => p.scoreGlobal !== null)
    .reduce((sum, p) => sum + p.scoreGlobal!, 0) / Math.max(1, projects.filter(p => p.scoreGlobal !== null).length);
  const montantTotal = projects.reduce((sum, p) => sum + p.montant, 0);

  const recentProjects = projects.slice(0, 5);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="mt-2 text-muted-foreground">
          Vue d&apos;ensemble des projets et scores
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total projets" value={totalProjects} icon="📊" />
        <StatsCard label="En cours" value={projectsEnCours} icon="⚡" />
        <StatsCard
          label="Score moyen"
          value={scoresMoyens.toFixed(1)}
          icon="⭐"
        />
        <StatsCard
          label="Montant total"
          value={`${(montantTotal / 1000000).toFixed(0)}M MAD`}
          icon="💰"
        />
      </div>

      {/* Projets récents */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Projets récents</h2>
        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Chargement...</p>
          </Card>
        ) : (
          <ProjectList projects={recentProjects} />
        )}
      </div>
    </div>
  );
}
