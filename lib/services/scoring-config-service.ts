import { getAppConfig, getAppConfigKey } from "@/lib/services/app-config-service";

/**
 * Scoring parametrization service.
 *
 * Reads the `scoring` category of AppConfiguration and exposes it as typed,
 * domain-level settings for the scoring engine and the evaluation UI.
 *
 * Two knobs are exposed:
 *  - SCORING_SECTORIAL_ENABLED  : master toggle for sectorial re-integration.
 *  - SCORING_DOMAIN_GRANULARITY : per-domain score-entry level.
 */

/** Score-entry level for a domain. Maps to ScoringNode.depth. */
export type GranularityLevel = "DOMAIN" | "CRITERION" | "SUB_CRITERION";

/** depth at which the scoring leaf sits for each granularity level. */
export const GRANULARITY_DEPTH: Record<GranularityLevel, number> = {
  DOMAIN: 0,
  CRITERION: 1,
  SUB_CRITERION: 2,
};

const SECTORIAL_KEY = "SCORING_SECTORIAL_ENABLED";
const GRANULARITY_KEY = "SCORING_DOMAIN_GRANULARITY";

function parseBool(value: string | null | undefined): boolean {
  return value === "true" || value === "1";
}

/**
 * Whether the sectorial calibration must be re-integrated into the global score.
 * When false, only the V7++ socle score is produced (non-breaking default).
 */
export async function isSectorialEnabled(): Promise<boolean> {
  return parseBool(await getAppConfigKey(SECTORIAL_KEY));
}

/**
 * Per-domain score-entry granularity, keyed by domain code (e.g. "D1", "FINANCIER").
 * Domains absent from the map fall back to the node's own configured depth.
 */
export async function getDomainGranularity(): Promise<Record<string, GranularityLevel>> {
  const raw = await getAppConfigKey(GRANULARITY_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const out: Record<string, GranularityLevel> = {};
    for (const [code, level] of Object.entries(parsed)) {
      if (level === "DOMAIN" || level === "CRITERION" || level === "SUB_CRITERION") {
        out[code] = level;
      }
    }
    return out;
  } catch {
    console.error(`[ScoringConfig] Invalid JSON in ${GRANULARITY_KEY}: ${raw}`);
    return {};
  }
}

/**
 * Granularity for a single domain code, or null when not overridden by config.
 */
export async function getDomainGranularityLevel(
  domainCode: string
): Promise<GranularityLevel | null> {
  const map = await getDomainGranularity();
  return map[domainCode] ?? null;
}

/**
 * Effective scoring-leaf depth for a domain, or null to defer to the node default.
 */
export async function getDomainLeafDepth(domainCode: string): Promise<number | null> {
  const level = await getDomainGranularityLevel(domainCode);
  return level ? GRANULARITY_DEPTH[level] : null;
}

/** Convenience: load both scoring knobs in one round-trip to the config cache. */
export async function getScoringConfig(): Promise<{
  sectorialEnabled: boolean;
  domainGranularity: Record<string, GranularityLevel>;
}> {
  // getAppConfig is cached, so both reads below hit the same snapshot.
  await getAppConfig();
  return {
    sectorialEnabled: await isSectorialEnabled(),
    domainGranularity: await getDomainGranularity(),
  };
}
