/**
 * Scoring Configuration Service
 *
 * Fetches and caches configuration values from database tables:
 * - Answer types (OPTION_SINGLE, NUMERIC_RANGE, etc.)
 * - Aggregation methods (AVERAGE, WEIGHTED_AVERAGE, etc.)
 * - Weight modes (RELATIVE, ABSOLUTE, NONE)
 * - Score scales (0-100, 0-10, etc.)
 * - Rating scales (AAA, AA, A, etc.)
 */

import prisma from "@/lib/prisma";

export interface AnswerType {
  id: string;
  label: string;
  description?: string;
  requiresOptions: boolean;
  requiresRanges: boolean;
  supportsMultiple: boolean;
  minValue?: number;
  maxValue?: number;
  uiComponent?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface AggregationMethod {
  id: string;
  label: string;
  description?: string;
  formula?: string;
  requiresWeights: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface WeightMode {
  id: string;
  label: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface ScoreScale {
  id: string;
  label: string;
  description?: string;
  minScore: number;
  maxScore: number;
  isActive: boolean;
  displayOrder: number;
}

export interface RatingScale {
  id: string;
  label: string;
  description?: string;
  minScore: number;
  maxScore: number;
  color?: string;
  displayOrder: number;
}

// Cache for configuration (in-memory, resets on restart)
const configCache: Map<string, any> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimes: Map<string, number> = new Map();

function isCacheValid(key: string): boolean {
  const cacheTime = cacheTimes.get(key);
  if (!cacheTime) return false;
  return Date.now() - cacheTime < CACHE_TTL;
}

function getCached(key: string) {
  if (isCacheValid(key)) {
    return configCache.get(key);
  }
  configCache.delete(key);
  cacheTimes.delete(key);
  return null;
}

function setCache(key: string, value: any) {
  configCache.set(key, value);
  cacheTimes.set(key, Date.now());
}

/**
 * Get all answer types, sorted by displayOrder
 */
export async function getAnswerTypes(): Promise<AnswerType[]> {
  const cached = getCached("answerTypes");
  if (cached) return cached;

  const answerTypes = await prisma.$queryRaw<AnswerType[]>`
    SELECT id, label, description, "requiresOptions", "requiresRanges",
           "supportsMultiple", "minValue", "maxValue", "uiComponent",
           "isActive", "displayOrder"
    FROM "BP_PF_v7pp_answer_types"
    WHERE "isActive" = true
    ORDER BY "displayOrder" ASC
  `;

  setCache("answerTypes", answerTypes);
  return answerTypes;
}

/**
 * Get a single answer type by ID
 */
export async function getAnswerTypeById(id: string): Promise<AnswerType | null> {
  const allTypes = await getAnswerTypes();
  return allTypes.find(t => t.id === id) || null;
}

/**
 * Get all aggregation methods, sorted by displayOrder
 */
export async function getAggregationMethods(): Promise<AggregationMethod[]> {
  const cached = getCached("aggregationMethods");
  if (cached) return cached;

  const methods = await prisma.$queryRaw<AggregationMethod[]>`
    SELECT id, label, description, formula, "requiresWeights",
           "isActive", "displayOrder"
    FROM "BP_PF_v7pp_aggregation_methods"
    WHERE "isActive" = true
    ORDER BY "displayOrder" ASC
  `;

  setCache("aggregationMethods", methods);
  return methods;
}

/**
 * Get a single aggregation method by ID
 */
export async function getAggregationMethodById(id: string): Promise<AggregationMethod | null> {
  const allMethods = await getAggregationMethods();
  return allMethods.find(m => m.id === id) || null;
}

/**
 * Get all weight modes, sorted by displayOrder
 */
export async function getWeightModes(): Promise<WeightMode[]> {
  const cached = getCached("weightModes");
  if (cached) return cached;

  const modes = await prisma.$queryRaw<WeightMode[]>`
    SELECT id, label, description, "isActive", "displayOrder"
    FROM "BP_PF_v7pp_weight_modes"
    WHERE "isActive" = true
    ORDER BY "displayOrder" ASC
  `;

  setCache("weightModes", modes);
  return modes;
}

/**
 * Get a single weight mode by ID
 */
export async function getWeightModeById(id: string): Promise<WeightMode | null> {
  const allModes = await getWeightModes();
  return allModes.find(m => m.id === id) || null;
}

/**
 * Get all score scales, sorted by displayOrder
 */
export async function getScoreScales(): Promise<ScoreScale[]> {
  const cached = getCached("scoreScales");
  if (cached) return cached;

  const scales = await prisma.$queryRaw<ScoreScale[]>`
    SELECT id, label, description, "minScore", "maxScore",
           "isActive", "displayOrder"
    FROM "BP_PF_v7pp_score_scales"
    WHERE "isActive" = true
    ORDER BY "displayOrder" ASC
  `;

  setCache("scoreScales", scales);
  return scales;
}

/**
 * Get a single score scale by ID
 */
export async function getScaleById(id: string): Promise<ScoreScale | null> {
  const allScales = await getScoreScales();
  return allScales.find(s => s.id === id) || null;
}

/**
 * Get all rating scales, sorted by displayOrder
 */
export async function getRatingScales(): Promise<RatingScale[]> {
  const cached = getCached("ratingScales");
  if (cached) return cached;

  const scales = await prisma.$queryRaw<RatingScale[]>`
    SELECT id, label, description, "minScore", "maxScore",
           color, "displayOrder"
    FROM "BP_PF_v7pp_rating_scales"
    ORDER BY "displayOrder" ASC
  `;

  setCache("ratingScales", scales);
  return scales;
}

/**
 * Get rating for a specific score
 * Returns the rating scale entry that matches the score range
 */
export async function getRatingForScore(score: number): Promise<RatingScale | null> {
  const allRatings = await getRatingScales();

  // Find the rating where minScore <= score <= maxScore
  return allRatings.find(r =>
    score >= r.minScore && score <= r.maxScore
  ) || null;
}

export interface RatingScaleInput {
  id: string;
  label: string;
  description?: string | null;
  minScore: number;
  maxScore: number;
  color?: string | null;
  displayOrder: number;
}

/**
 * Écart entre deux paliers adjacents dans la convention d'écriture du barème,
 * majoré d'une tolérance : en binaire, 25 − 24,99 vaut 0,010000000000001563, et une
 * comparaison stricte à 0,01 signalerait un trou là où il n'y en a pas.
 */
const PAS_BAREME = 0.01 + 1e-9;

export interface RatingScaleValidation {
  /** Défauts rendant le barème inexploitable : l'enregistrement est refusé. */
  errors: string[];
  /** Défauts tolérés mais signalés (trous entre paliers, échelle incomplète). */
  warnings: string[];
}

/**
 * Contrôle la cohérence d'un barème avant enregistrement.
 *
 * Les recouvrements sont bloquants : deux paliers se disputant un score rendent la
 * note dépendante de l'ordre de lecture. Les trous ne le sont pas — le barème livré
 * en contient déjà (24,99 puis 25) et les refuser empêcherait toute correction — mais
 * ils sont remontés à l'administrateur.
 */
export function validateRatingScales(scales: RatingScaleInput[]): RatingScaleValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (scales.length === 0) {
    errors.push("Le barème doit comporter au moins un palier.");
    return { errors, warnings };
  }

  const vus = new Set<string>();
  for (const s of scales) {
    if (!s.id?.trim()) errors.push("Un palier est dépourvu d'identifiant.");
    if (!s.label?.trim()) errors.push(`Palier « ${s.id} » : libellé manquant.`);
    if (!Number.isFinite(s.minScore) || !Number.isFinite(s.maxScore)) {
      errors.push(`Palier « ${s.label || s.id} » : bornes non numériques.`);
      continue;
    }
    if (s.minScore > s.maxScore) {
      errors.push(
        `Palier « ${s.label || s.id} » : borne basse (${s.minScore}) supérieure à la borne haute (${s.maxScore}).`
      );
    }
    if (vus.has(s.id)) errors.push(`Identifiant en double : « ${s.id} ».`);
    vus.add(s.id);
  }

  const tries = [...scales]
    .filter((s) => Number.isFinite(s.minScore) && Number.isFinite(s.maxScore))
    .sort((a, b) => a.minScore - b.minScore);

  for (let i = 1; i < tries.length; i++) {
    const prec = tries[i - 1];
    const cour = tries[i];
    if (cour.minScore <= prec.maxScore) {
      errors.push(
        `Les paliers « ${prec.label} » et « ${cour.label} » se recouvrent entre ${cour.minScore} et ${prec.maxScore}.`
      );
    } else if (cour.minScore - prec.maxScore > PAS_BAREME) {
      // Les bornes étant inclusives des deux côtés, deux paliers adjacents laissent
      // toujours un interstice d'un centième (24,99 puis 25) : c'est la convention
      // d'écriture du barème, pas une erreur, et le moteur rattache ces scores au
      // palier inférieur. Seul un trou plus large trahit une saisie incomplète.
      warnings.push(
        `Aucun palier ne couvre les scores entre ${prec.maxScore} et ${cour.minScore} (« ${prec.label} » → « ${cour.label} »).`
      );
    }
  }

  if (tries.length > 0) {
    if (tries[0].minScore > 0) {
      warnings.push(`Le barème ne couvre pas les scores inférieurs à ${tries[0].minScore}.`);
    }
    const haut = tries[tries.length - 1].maxScore;
    if (haut < 100) {
      warnings.push(`Le barème ne couvre pas les scores supérieurs à ${haut}.`);
    }
  }

  return { errors, warnings };
}

/**
 * Remplace l'intégralité du barème de notation.
 *
 * Le remplacement est total et transactionnel : un barème partiellement écrit
 * laisserait des scores sans note. Les évaluations déjà calculées conservent la note
 * enregistrée avec elles — seuls les calculs postérieurs suivent le nouveau barème.
 */
export async function updateRatingScales(
  scales: RatingScaleInput[]
): Promise<RatingScaleValidation> {
  const validation = validateRatingScales(scales);
  if (validation.errors.length > 0) return validation;

  await prisma.$transaction([
    prisma.$executeRaw`DELETE FROM "BP_PF_v7pp_rating_scales"`,
    ...scales.map(
      (s) => prisma.$executeRaw`
        INSERT INTO "BP_PF_v7pp_rating_scales"
          (id, label, description, "minScore", "maxScore", color, "displayOrder")
        VALUES (${s.id}, ${s.label}, ${s.description ?? null},
                ${s.minScore}, ${s.maxScore}, ${s.color ?? null}, ${s.displayOrder})
      `
    ),
  ]);

  configCache.delete("ratingScales");
  cacheTimes.delete("ratingScales");
  return validation;
}

/**
 * Clear all caches (useful after configuration updates)
 */
export function clearConfigCache() {
  configCache.clear();
  cacheTimes.clear();
}
