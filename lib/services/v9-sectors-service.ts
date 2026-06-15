// Serialized shapes returned by GET /api/v9/sectors (dates are ISO strings over the wire).

export interface SectorThreshold {
  id: string;
  sectorId: string;
  ratioType: string;
  level: string;
  minValue: number | null;
  maxValue: number | null;
  score: number | null;
}

export interface SectorDomainWeight {
  id: string;
  sectorId: string;
  domainCode: string;
  weightAdjusted: number;
}

export interface SectorRedFlag {
  id: string;
  sectorId: string;
  code: string;
  description: string;
  isNoGo: boolean;
  penalty: number | null;
  orderIndex: number;
}

export interface SectorIndicator {
  id: string;
  sectorId: string;
  code: string;
  label: string;
  unit: string | null;
  targetValue: string | null;
  direction: string;
  orderIndex: number;
}

export interface SectorStressTest {
  id: string;
  sectorId: string;
  code: string;
  description: string;
  variable: string | null;
  shockPct: number | null;
  passDscrMin: number | null;
  orderIndex: number;
}

export interface SectorWithDetails {
  id: string;
  code: string;
  label: string;
  orderIndex: number;
  isActive: boolean;
  thresholds: SectorThreshold[];
  domainWeights: SectorDomainWeight[];
  redFlags: SectorRedFlag[];
  indicators: SectorIndicator[];
  stressTests: SectorStressTest[];
}

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
    const sectors: SectorWithDetails[] = data.sectors || [];
    sectorsCache = sectors;
    cacheExpiry = now + CACHE_TTL;

    return sectors;
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
