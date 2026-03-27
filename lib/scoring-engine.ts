import type { ScoreComponent, ScoreGrade, ScoringResult } from "@/types";
import { GRADE_THRESHOLDS } from "./constants";

export function calculateGlobalScore(composantes: ScoreComponent[]): number {
  const totalPonderation = composantes.reduce(
    (sum, c) => sum + c.ponderation,
    0
  );
  if (totalPonderation === 0) return 0;

  const scoreTotal = composantes.reduce(
    (sum, c) => sum + c.score * c.ponderation,
    0
  );

  return Math.round((scoreTotal / totalPonderation) * 100) / 100;
}

export function determineGrade(score: number): ScoreGrade {
  for (const [grade, { min, max }] of Object.entries(GRADE_THRESHOLDS)) {
    if (score >= min && score <= max) {
      return grade as ScoreGrade;
    }
  }
  return "D";
}

export function calculateScoringResult(
  projectId: string,
  composantes: ScoreComponent[],
  version: number
): ScoringResult {
  const enriched = composantes.map((c) => ({
    ...c,
    scorePondere: Math.round(c.score * c.ponderation * 100) / 100,
  }));

  const scoreGlobal = calculateGlobalScore(enriched);
  const grade = determineGrade(scoreGlobal);

  return {
    projectId,
    scoreGlobal,
    grade,
    composantes: enriched,
    dateCalcul: new Date(),
    version,
  };
}

export function getGradeColor(grade: ScoreGrade): string {
  const colors: Record<ScoreGrade, string> = {
    AAA: "text-emerald-400",
    AA: "text-emerald-500",
    A: "text-green-500",
    BBB: "text-lime-500",
    BB: "text-yellow-500",
    B: "text-orange-400",
    CCC: "text-orange-500",
    CC: "text-red-400",
    C: "text-red-500",
    D: "text-red-600",
  };
  return colors[grade];
}
