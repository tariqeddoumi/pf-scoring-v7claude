import prisma from "@/lib/prisma-client";

/**
 * Sectorial calibration helper for the live scoring engine.
 *
 * Resolves the V9 sector calibration for a project and exposes:
 *  - domain weight FACTORS (multipliers, typically 0.8–1.2) keyed by domain code (D1..D9)
 *  - the sector's red flags and stress tests (informational, surfaced in the trace)
 *
 * Reads V9 data DIRECTLY via Prisma (no relative-URL fetch), so it works
 * server-side inside route handlers and the scoring engine.
 */

export interface SectorWeighting {
  code: string;
  label: string;
  /** domainCode (D1..D9) → weight multiplier (e.g. 1.2 = +20% weight for this sector) */
  weightFactors: Map<string, number>;
  redFlags: Array<{
    code: string;
    description: string;
    isNoGo: boolean;
    penalty: number | null;
  }>;
  stressTests: Array<{ code: string; description: string }>;
}

/**
 * Resolve the sector calibration from a (possibly free-text) project sector value.
 *
 * Matching is tolerant because Project.secteur is currently a free-text field:
 *   1. exact code match (case-insensitive)  e.g. "ENR"
 *   2. exact label match (case-insensitive) e.g. "Énergies renouvelables"
 *   3. label contains the term (case-insensitive)
 *
 * Returns null when no sector is configured or no match is found (graceful degrade).
 */
export async function resolveSectorWeighting(
  secteur: string | null | undefined
): Promise<SectorWeighting | null> {
  const term = secteur?.trim();
  if (!term) return null;

  const sector = await prisma.v9Sector.findFirst({
    where: {
      isActive: true,
      OR: [
        { code: { equals: term, mode: "insensitive" } },
        { label: { equals: term, mode: "insensitive" } },
        { label: { contains: term, mode: "insensitive" } },
      ],
    },
    include: {
      domainWeights: true,
      redFlags: { orderBy: { orderIndex: "asc" } },
      stressTests: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!sector) return null;

  return {
    code: sector.code,
    label: sector.label,
    weightFactors: new Map(
      sector.domainWeights.map((w) => [w.domainCode, w.weightAdjusted])
    ),
    redFlags: sector.redFlags.map((f) => ({
      code: f.code,
      description: f.description,
      isNoGo: f.isNoGo,
      penalty: f.penalty,
    })),
    stressTests: sector.stressTests.map((s) => ({
      code: s.code,
      description: s.description,
    })),
  };
}
