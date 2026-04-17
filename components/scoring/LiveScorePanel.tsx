"use client";

import { Clock, TrendingUp } from "lucide-react";
import type { QuestionnaireNode } from "@/lib/services/scoring-questionnaire-service";

interface LiveScorePanelProps {
  questionnaire: QuestionnaireNode[];
  answers: Record<string, AnswerValue>;
  isSaving?: boolean;
  lastSaved?: Date | null;
}

export interface AnswerValue {
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  comment?: string;
}

function computeLeafScore(node: QuestionnaireNode, answer: AnswerValue | undefined): number | null {
  if (!answer) return null;

  if (node.options && node.options.length > 0 && answer.valueString) {
    const opt = node.options.find((o) => o.value === answer.valueString);
    return opt ? opt.score : null;
  }

  if (node.ranges && node.ranges.length > 0 && answer.valueNumber !== undefined) {
    const range = node.ranges.find(
      (r) => answer.valueNumber! >= r.minValue && answer.valueNumber! <= r.maxValue
    );
    return range ? range.score : null;
  }

  return null;
}

function computeNodeScore(
  node: QuestionnaireNode,
  answers: Record<string, AnswerValue>
): number | null {
  const hasChildren = node.children && node.children.length > 0;

  if (!hasChildren) {
    return computeLeafScore(node, answers[node.id]);
  }

  const childScores = node.children!.map((c) => computeNodeScore(c, answers));
  const valid = childScores.filter((s): s is number => s !== null);
  if (valid.length === 0) return null;

  return valid.reduce((sum, s) => sum + s, 0) / valid.length;
}

function getRating(score: number): string {
  if (score >= 90) return "AAA";
  if (score >= 80) return "AA";
  if (score >= 70) return "A";
  if (score >= 60) return "BBB";
  if (score >= 50) return "BB";
  if (score >= 40) return "B";
  if (score >= 30) return "CCC";
  return "D";
}

function getScoreColors(score: number | null) {
  if (score === null) return { text: "text-slate-600", bar: "bg-slate-700", badge: "text-slate-500 bg-slate-700/50" };
  if (score >= 70) return { text: "text-green-400", bar: "bg-green-400", badge: "text-green-400 bg-green-400/10" };
  if (score >= 50) return { text: "text-yellow-400", bar: "bg-yellow-400", badge: "text-yellow-400 bg-yellow-400/10" };
  return { text: "text-red-400", bar: "bg-red-400", badge: "text-red-400 bg-red-400/10" };
}

const RATING_TABLE = [
  { range: "≥ 90", rating: "AAA", color: "text-green-400" },
  { range: "80–89", rating: "AA", color: "text-green-400" },
  { range: "70–79", rating: "A", color: "text-green-300" },
  { range: "60–69", rating: "BBB", color: "text-yellow-400" },
  { range: "50–59", rating: "BB", color: "text-orange-400" },
  { range: "40–49", rating: "B", color: "text-red-400" },
  { range: "< 40", rating: "CCC–D", color: "text-red-600" },
];

export function LiveScorePanel({
  questionnaire,
  answers,
  isSaving,
  lastSaved,
}: LiveScorePanelProps) {
  const domainScores = questionnaire.map((domain) => ({
    id: domain.id,
    label: domain.label,
    score: computeNodeScore(domain, answers),
  }));

  const valid = domainScores.filter((d): d is typeof d & { score: number } => d.score !== null);
  const totalScore = valid.length > 0 ? valid.reduce((s, d) => s + d.score, 0) / valid.length : null;
  const rating = totalScore !== null ? getRating(totalScore) : null;
  const totalColors = getScoreColors(totalScore);

  return (
    <div className="h-full bg-slate-900 border-l border-slate-700 flex flex-col w-56 flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={14} className="text-cyan-400" />
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Score en Direct
          </h2>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <Clock size={10} />
          {isSaving
            ? "Sauvegarde..."
            : lastSaved
            ? lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
            : "—"}
        </div>
      </div>

      {/* Score total */}
      <div className="p-4 border-b border-slate-700 text-center">
        <div className={`text-5xl font-bold tabular-nums ${totalColors.text}`}>
          {totalScore !== null ? totalScore.toFixed(1) : "—"}
        </div>
        <div className="text-xs text-slate-500 mt-1">/ 100 pts</div>

        {rating && (
          <div className={`inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider ${totalColors.badge}`}>
            {rating}
          </div>
        )}

        {totalScore !== null && (
          <div className="mt-3 bg-slate-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${totalColors.bar}`}
              style={{ width: `${Math.min(100, totalScore)}%` }}
            />
          </div>
        )}
      </div>

      {/* Par domaine */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Par Domaine
        </h3>
        {domainScores.map((d) => {
          const colors = getScoreColors(d.score);
          return (
            <div key={d.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400 truncate flex-1 pr-2">{d.label}</span>
                <span className={`text-xs font-bold flex-shrink-0 ${colors.text}`}>
                  {d.score !== null ? d.score.toFixed(0) : "—"}
                </span>
              </div>
              <div className="bg-slate-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${colors.bar}`}
                  style={{ width: d.score !== null ? `${Math.min(100, d.score)}%` : "0%" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grille de notation */}
      <div className="p-4 border-t border-slate-700">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Grille de Notation
        </h3>
        <div className="space-y-0.5">
          {RATING_TABLE.map(({ range, rating: r, color }) => (
            <div
              key={r}
              className={`flex justify-between text-xs ${
                rating === r ? "font-bold" : "opacity-60"
              }`}
            >
              <span className="text-slate-500">{range}</span>
              <span className={color}>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
