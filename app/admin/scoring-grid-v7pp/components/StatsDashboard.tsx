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
    <div className="bg-slate-900 border-t border-slate-700 px-6 py-4">
      <div className="grid grid-cols-8 gap-4">
        {statItems.map((item, i) => (
          <div key={i} className="text-center">
            <p className="text-xs text-slate-400 mb-1">{item.label}</p>
            <p className={`text-2xl font-bold ${item.isPercentage ? "text-cyan-400" : "text-white"}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
