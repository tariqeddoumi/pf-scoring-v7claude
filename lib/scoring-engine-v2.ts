import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ComposanteScore {
  domainCode: string;
  score: number;
  weight: number;
}

interface ScoringResult {
  scoreGlobal: number;
  grade: string;
  composantes: ComposanteScore[];
  details: {
    [key: string]: {
      score: number;
      weight: number;
      contribution: number;
    };
  };
}

/**
 * Calculates global score based on active domains and their weights
 */
export async function calculateGlobalScoreV2(
  composantes: ComposanteScore[]
): Promise<ScoringResult> {
  // Get active domains from database
  const activeDomains = await prisma.scoreDomain.findMany({
    where: { isActive: true },
  });

  // Calculate weighted average
  let totalWeight = 0;
  let weightedSum = 0;
  const details: ScoringResult["details"] = {};

  for (const composante of composantes) {
    const domain = activeDomains.find((d) => d.code === composante.domainCode);
    if (!domain || !domain.isActive) continue;

    const weight = domain.weight;
    const score = Math.max(0, Math.min(100, composante.score)); // Clamp between 0-100

    totalWeight += weight;
    weightedSum += score * weight;

    details[composante.domainCode] = {
      score,
      weight,
      contribution: score * weight,
    };
  }

  // Normalize by total weight
  const scoreGlobal = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const grade = determineGradeV2(scoreGlobal);

  return {
    scoreGlobal: Math.round(scoreGlobal * 100) / 100,
    grade,
    composantes: composantes.map((c) => ({
      ...c,
      weight:
        activeDomains.find((d) => d.code === c.domainCode)?.weight || 0,
    })),
    details,
  };
}

/**
 * Determines letter grade based on score
 * Basel/IFC compliant: AAA, AA, A, BBB, BB, B, CCC, CC, C, D
 */
export function determineGradeV2(score: number): string {
  if (score >= 95) return "AAA";
  if (score >= 90) return "AA";
  if (score >= 85) return "A";
  if (score >= 80) return "BBB";
  if (score >= 75) return "BB";
  if (score >= 70) return "B";
  if (score >= 60) return "CCC";
  if (score >= 50) return "CC";
  if (score >= 40) return "C";
  return "D";
}

/**
 * Applies hard stop rules - returns true if any rule prevents approval
 */
export async function checkHardStopRules(
  domainScores: { domainCode: string; score: number }[]
): Promise<boolean> {
  const criteria = await prisma.scoreCriterion.findMany({
    where: {
      hardStopIfBelow: {
        not: null,
      },
    },
  });

  // Check if any criterion with hard stop has insufficient score
  for (const criterion of criteria) {
    const domain = await prisma.scoreDomain.findUnique({
      where: { id: criterion.domainId },
    });

    if (!domain) continue;

    const domainScore = domainScores.find(
      (d) => d.domainCode === domain.code
    )?.score;

    if (domainScore !== undefined && criterion.hardStopIfBelow) {
      if (domainScore < criterion.hardStopIfBelow) {
        return true; // Hard stop triggered
      }
    }
  }

  return false;
}

/**
 * Auto-assigns country risk score based on country code
 */
export async function getCountryRiskScore(countryCode: string): Promise<number> {
  const country = await prisma.country.findUnique({
    where: { code: countryCode },
  });

  return country?.riskScore ?? 50.0; // Default to 50 if not found
}

/**
 * Converts country risk score to evaluation score (higher risk = lower score)
 */
export function convertCountryRiskToScore(riskScore: number): number {
  // Map: 0 risk = 100 score, 100 risk = 0 score
  return Math.max(0, Math.min(100, 100 - riskScore));
}

/**
 * Gets all available domains
 */
export async function getAvailableDomains() {
  return prisma.scoreDomain.findMany({
    orderBy: { orderIndex: "asc" },
    include: {
      criteria: {
        where: { isActive: true },
        orderBy: { orderIndex: "asc" },
        include: {
          options: { orderBy: { orderIndex: "asc" } },
          ranges: { orderBy: { orderIndex: "asc" } },
        },
      },
    },
  });
}

/**
 * Gets active domains only
 */
export async function getActiveDomains() {
  return prisma.scoreDomain.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: "asc" },
    include: {
      criteria: {
        where: { isActive: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });
}

/**
 * Checks if country risk domain is active
 */
export async function isCountryRiskActive(): Promise<boolean> {
  const domain = await prisma.scoreDomain.findUnique({
    where: { code: "pays" },
  });
  return domain?.isActive ?? true;
}

/**
 * Gets country risk mode from system config
 */
export async function getCountryRiskMode(): Promise<"AUTO_ASSIGN" | "MANUAL"> {
  const config = await prisma.systemConfig.findUnique({
    where: { key: "COUNTRY_RISK_MODE" },
  });
  return (config?.value as "AUTO_ASSIGN" | "MANUAL") ?? "AUTO_ASSIGN";
}
