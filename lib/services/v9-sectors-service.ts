import { Prisma } from '@prisma/client';

export type SectorWithDetails = Prisma.V9SectorGetPayload<{
  include: {
    thresholds: true;
    domainWeights: true;
    redFlags: true;
    indicators: true;
    stressTests: true;
  };
}>;

let sectorsCache: SectorWithDetails[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch all V9 sectors with complete data (client-side cache)
 */
export async function fetchSectors(): Promise<SectorWithDetails[]> {
  const now = Date.now();

  if (sectorsCache && cacheExpiry > now) {
    return sectorsCache;
  }

  try {
    const res = await fetch('/api/v9/sectors');
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const { data } = await res.json();
    sectorsCache = data.sectors || [];
    cacheExpiry = now + CACHE_TTL;

    return sectorsCache;
  } catch (error) {
    console.error('[V9SectorsService] Failed to fetch sectors:', error);
    return [];
  }
}

/**
 * Get sector by code
 */
export async function getSectorByCode(code: string): Promise<SectorWithDetails | null> {
  const sectors = await fetchSectors();
  return sectors.find((s) => s.code === code) || null;
}

/**
 * Get all sector codes
 */
export async function getSectorCodes(): Promise<string[]> {
  const sectors = await fetchSectors();
  return sectors.map((s) => s.code);
}

/**
 * Get thresholds for a sector
 */
export async function getSectorThresholds(sectorCode: string) {
  const sector = await getSectorByCode(sectorCode);
  if (!sector) return [];

  return {
    dscr: sector.thresholds.filter((t) => t.ratioType === 'DSCR'),
    llcr: sector.thresholds.filter((t) => t.ratioType === 'LLCR'),
    leverage: sector.thresholds.filter((t) => t.ratioType === 'LEVERAGE'),
  };
}

/**
 * Get red flags for a sector
 */
export async function getSectorRedFlags(sectorCode: string) {
  const sector = await getSectorByCode(sectorCode);
  return sector?.redFlags || [];
}

/**
 * Get indicators for a sector
 */
export async function getSectorIndicators(sectorCode: string) {
  const sector = await getSectorByCode(sectorCode);
  return sector?.indicators || [];
}

/**
 * Get stress tests for a sector
 */
export async function getSectorStressTests(sectorCode: string) {
  const sector = await getSectorByCode(sectorCode);
  return sector?.stressTests || [];
}

/**
 * Get domain weights for a sector
 */
export async function getSectorDomainWeights(sectorCode: string) {
  const sector = await getSectorByCode(sectorCode);
  if (!sector) return {};

  return Object.fromEntries(
    sector.domainWeights.map((w) => [w.domainCode, w.weightAdjusted])
  );
}

/**
 * Invalidate cache
 */
export function invalidateCache(): void {
  sectorsCache = null;
  cacheExpiry = 0;
}
