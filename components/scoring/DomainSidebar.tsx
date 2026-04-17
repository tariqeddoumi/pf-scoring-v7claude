"use client";

import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import type { QuestionnaireNode } from "@/lib/services/scoring-questionnaire-service";

interface DomainStats {
  answered: number;
  total: number;
  score: number | null;
}

interface DomainSidebarProps {
  domains: QuestionnaireNode[];
  currentDomainId: string;
  onSelect: (domainId: string) => void;
  stats: Record<string, DomainStats>;
}

const DOMAIN_META: Record<string, { icon: string; color: string }> = {
  FINANCIER: { icon: "💰", color: "text-blue-400" },
  TECHNIQUE: { icon: "⚙️", color: "text-purple-400" },
  MARCHE: { icon: "📈", color: "text-green-400" },
  MARCHÉ: { icon: "📈", color: "text-green-400" },
  ENVIRONNEMENTAL: { icon: "🌿", color: "text-emerald-400" },
  ENVIRONMENTAL: { icon: "🌿", color: "text-emerald-400" },
  SOCIAL: { icon: "👥", color: "text-pink-400" },
  GOUVERNANCE: { icon: "🏛️", color: "text-amber-400" },
  JURIDIQUE: { icon: "⚖️", color: "text-orange-400" },
  PAYS: { icon: "🗺️", color: "text-cyan-400" },
};

function getDomainMeta(code?: string, label?: string) {
  const key = Object.keys(DOMAIN_META).find(
    (k) =>
      code?.toUpperCase().includes(k) || label?.toUpperCase().includes(k)
  );
  return key ? DOMAIN_META[key] : { icon: "📋", color: "text-slate-400" };
}

function getScoreColor(score: number) {
  if (score >= 70) return "text-green-400 bg-green-400/10";
  if (score >= 50) return "text-yellow-400 bg-yellow-400/10";
  return "text-red-400 bg-red-400/10";
}

export function DomainSidebar({
  domains,
  currentDomainId,
  onSelect,
  stats,
}: DomainSidebarProps) {
  const totalAnswered = Object.values(stats).reduce((s, d) => s + d.answered, 0);
  const totalQuestions = Object.values(stats).reduce((s, d) => s + d.total, 0);
  const globalProgress = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;

  return (
    <div className="h-full bg-slate-900 border-r border-slate-700 flex flex-col w-64 flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Domaines de Scoring
        </h2>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>{totalAnswered} / {totalQuestions} critères</span>
          <span>{Math.round(globalProgress)}%</span>
        </div>
        <div className="bg-slate-700 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full bg-cyan-500 transition-all duration-500"
            style={{ width: `${globalProgress}%` }}
          />
        </div>
      </div>

      {/* Domain list */}
      <div className="flex-1 overflow-y-auto py-2">
        {domains.map((domain, index) => {
          const stat = stats[domain.id] || { answered: 0, total: 0, score: null };
          const isComplete = stat.total > 0 && stat.answered === stat.total;
          const isPartial = stat.answered > 0 && stat.answered < stat.total;
          const isCurrent = domain.id === currentDomainId;
          const meta = getDomainMeta(domain.code, domain.label);

          return (
            <button
              key={domain.id}
              onClick={() => onSelect(domain.id)}
              className={`w-full text-left px-4 py-3 transition-all border-l-2 ${
                isCurrent
                  ? "bg-cyan-500/10 border-cyan-500"
                  : "border-transparent hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Status icon */}
                <div className="flex-shrink-0 w-5">
                  {isComplete ? (
                    <CheckCircle2 size={16} className="text-green-400" />
                  ) : (
                    <Circle
                      size={16}
                      className={
                        isPartial
                          ? "text-yellow-400"
                          : isCurrent
                          ? "text-cyan-400"
                          : "text-slate-600"
                      }
                    />
                  )}
                </div>

                {/* Icon + Label */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{meta.icon}</span>
                    <span
                      className={`text-sm font-medium truncate ${
                        isCurrent ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {domain.label}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {stat.total > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all duration-500 ${
                            isComplete
                              ? "bg-green-400"
                              : isPartial
                              ? "bg-yellow-400"
                              : "bg-slate-600"
                          }`}
                          style={{
                            width: `${(stat.answered / stat.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {stat.answered}/{stat.total}
                      </span>
                    </div>
                  )}
                </div>

                {/* Score badge */}
                {stat.score !== null && (
                  <div
                    className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${getScoreColor(
                      stat.score
                    )}`}
                  >
                    {stat.score.toFixed(0)}
                  </div>
                )}

                {isCurrent && (
                  <ChevronRight size={14} className="text-cyan-400 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-700 text-xs text-slate-500">
        {Object.values(stats).filter((s) => s.total > 0 && s.answered === s.total).length}{" "}
        / {domains.length} domaines complétés
      </div>
    </div>
  );
}
