/**
 * Moteur de calcul de scoring PF V7++
 * Formule: Score Global = Σ (Poids Domaine × Score Domaine)
 */

import { SCORING_MODEL, SCORE_TO_RATING, RATING_TO_PD } from './scoring-model';

export interface ScoringResponse {
  criteriaId: string;
  value: number | string;
  comment?: string;
}

export interface EvaluationResult {
  projectId: string;
  evaluationDate: string;
  modelVersion: string;
  globalScore: number;
  rating: string;
  pdRange: { min: number; max: number };
  riskClass: string;
  noGo: boolean;
  noGoReasons: string[];
  redFlags: string[];
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  domainScores: any[];
}

export function calculateCriteriaScore(criteriaId: string, value: number | string): number {
  const allCriteria = SCORING_MODEL.flatMap(d => d.subCriteria.flatMap(s => s.criteria));
  const criteria = allCriteria.find(c => c.id === criteriaId);
  
  if (!criteria) return 0;
  
  if (criteria.scale === 'numeric') {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 0;
    if (criteria.minValue !== undefined && criteria.maxValue !== undefined) {
      if (num <= criteria.minValue) return 0;
      if (num >= criteria.maxValue) return 10;
      return ((num - criteria.minValue) / (criteria.maxValue - criteria.minValue)) * 10;
    }
    return Math.min(Math.max(num, 0), 10);
  }
  
  if (criteria.scale === 'qualitative' && criteria.options) {
    const option = criteria.options.find(o => o.label === value);
    return option ? option.score : 0;
  }
  
  return 0;
}

export function calculateDomainScore(responses: ScoringResponse[], domainId: string): number {
  const domain = SCORING_MODEL.find(d => d.id === domainId);
  if (!domain) return 0;
  
  const subScores = domain.subCriteria.map(sub => {
    const subCriteriaResponses = sub.criteria.map(crit => {
      const resp = responses.find(r => r.criteriaId === crit.id);
      const score = calculateCriteriaScore(crit.id, resp?.value ?? 0);
      return { weight: crit.weight, score };
    });
    
    const totalWeight = subCriteriaResponses.reduce((s, r) => s + r.weight, 0);
    const weighted = subCriteriaResponses.reduce((s, r) => s + r.score * r.weight, 0);
    return { weight: sub.weight, score: totalWeight > 0 ? weighted / totalWeight : 0 };
  });
  
  const totalWeight = subScores.reduce((s, r) => s + r.weight, 0);
  const weighted = subScores.reduce((s, r) => s + r.score * r.weight, 0);
  return totalWeight > 0 ? weighted / totalWeight : 0;
}

export function calculateGlobalScore(domainScores: Map<string, number>): number {
  let total = 0;
  SCORING_MODEL.forEach(d => {
    const score = domainScores.get(d.id) || 0;
    total += (score * d.weight) / 100;
  });
  return Math.round(total * 100) / 100;
}

export function scoreToRating(score: number): string {
  const entry = SCORE_TO_RATING.find(r => score >= r.minScore);
  return entry?.rating || 'D';
}

export function checkNoGoRules(financialData: any): string[] {
  const reasons: string[] = [];
  if (financialData?.dscr && financialData.dscr < 1.1) reasons.push('DSCR < 1.1x');
  if (financialData?.equity && financialData.equity < 20) reasons.push('Equity < 20%');
  if (!financialData?.hasGuarantees) reasons.push('Absence de garanties');
  if (!financialData?.contractsSigned) reasons.push('Contrats non signés');
  if (financialData?.esgScore && financialData.esgScore < 4) reasons.push('Non-conformité ESG');
  return reasons;
}

export function calculateEvaluation(
  projectId: string,
  responses: ScoringResponse[],
  financialData: any
): EvaluationResult {
  const domainScores = new Map<string, number>();
  SCORING_MODEL.forEach(d => {
    domainScores.set(d.id, calculateDomainScore(responses, d.id));
  });
  
  const globalScore = calculateGlobalScore(domainScores);
  const rating = scoreToRating(globalScore);
  const pdRange = RATING_TO_PD[rating as keyof typeof RATING_TO_PD] || { min: 20, max: 100 };
  const noGoReasons = checkNoGoRules(financialData);
  
  const riskClass = rating.includes('AAA') || rating.includes('AA') ? 'Faible'
    : rating.includes('A') ? 'Modéré'
    : rating.includes('BBB') ? 'Élevé' : 'Très élevé';

  let recommendation = '❌ Très Défavorable';
  if (noGoReasons.length > 0) recommendation = '🔴 NO-GO';
  else if (globalScore >= 8.5) recommendation = '✅ Très Favorable';
  else if (globalScore >= 7.5) recommendation = '✅ Favorable';
  else if (globalScore >= 6.5) recommendation = '⚠️ Favorable sous conditions';
  else if (globalScore >= 5.5) recommendation = '⚠️ À revoir';
  else if (globalScore >= 4.5) recommendation = '❌ Défavorable';
  
  return {
    projectId,
    evaluationDate: new Date().toISOString().split('T')[0],
    modelVersion: 'V7++',
    globalScore,
    rating,
    pdRange,
    riskClass,
    noGo: noGoReasons.length > 0,
    noGoReasons,
    redFlags: [],
    strengths: [],
    weaknesses: [],
    recommendation,
    domainScores: Array.from(domainScores.entries()).map(([id, score]) => ({ id, score })),
  };
}

/**
 * Get Tailwind CSS color class for a grade
 */
export function getGradeColor(grade: string): string {
  const gradeColorMap: Record<string, string> = {
    'AAA': 'text-green-600',
    'AA': 'text-green-500',
    'A': 'text-emerald-500',
    'BBB': 'text-yellow-600',
    'BB': 'text-yellow-500',
    'B': 'text-amber-500',
    'CCC': 'text-orange-600',
    'CC': 'text-orange-500',
    'C': 'text-red-500',
    'D': 'text-red-700',
  };
  return gradeColorMap[grade] || 'text-slate-500';
}
