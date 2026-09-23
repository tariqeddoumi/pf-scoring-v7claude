"use client";

import type { GridStatistics } from "@/lib/types/scoring-grid";

interface StatsDashboardProps {
  stats: GridStatistics;
}

export function StatsDashboard({ stats }: StatsDashboardProps) {
  const statItems = [
    { label: "Domaines", value: stats.totalDomains },
    { label: "Critères", value: stats.totalCriteria },
    { label: "Sous-critères", value: stats.totalSubCriteria },
    { label: "Sous-sous-critères", value: stats.totalSubSubCriteria },
    { label: "Feuilles de scoring", value: stats.totalScoringLeaves },
    { label: "Options", value: stats.totalOptions },
    { label: "Plages", value: stats.totalRanges },
    {
      label: "Taux de complétude",
      value: `${stats.completionRate}%`,
      isPercentage: true,
    },
  ];

  return (
    <div className="bg-background border-t border-border px-6 py-4">
      <div className="grid grid-cols-8 gap-4">
        {statItems.map((item, i) => (
          <div key={i} className="text-center">
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className={`text-2xl font-bold ${item.isPercentage ? "text-primary" : "text-foreground"}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
