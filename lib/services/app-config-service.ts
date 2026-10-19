import prisma from '@/lib/prisma-client';

export interface AppConfig {
  [key: string]: string;
}

let configCache: AppConfig | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all app configuration with caching
 */
export async function getAppConfig(): Promise<AppConfig> {
  const now = Date.now();

  // Return cached config if valid
  if (configCache && cacheExpiry > now) {
    return configCache;
  }

  try {
    const configs = await prisma.appConfiguration.findMany();
    configCache = Object.fromEntries(
      configs.map((c) => [c.key, c.value])
    );
    cacheExpiry = now + CACHE_TTL;
    return configCache;
  } catch (error) {
    console.error('[AppConfigService] Failed to fetch config:', error);
    // Return empty config on error
    return {};
  }
}

/**
 * Get specific configuration key
 */
export async function getAppConfigKey(key: string): Promise<string | null> {
  try {
    const config = await getAppConfig();
    return config[key] || null;
  } catch (error) {
    console.error(`[AppConfigService] Failed to fetch key ${key}:`, error);
    return null;
  }
}

/**
 * Set configuration key with audit trail
 */
export async function setAppConfig(
  key: string,
  value: string,
  changedBy: string
): Promise<void> {
  try {
    // Get old value
    const oldConfig = await prisma.appConfiguration.findUnique({
      where: { key },
    });

    // Update or create
    await prisma.appConfiguration.upsert({
      where: { key },
      update: {
        value,
        updatedAt: new Date(),
        updatedBy: changedBy,
      },
      create: {
        key,
        value,
        type: 'string',
        category: 'behavior',
        updatedAt: new Date(),
        updatedBy: changedBy,
      },
    });

    // Record in history
    await prisma.appConfigHistory.create({
      data: {
        key,
        oldValue: oldConfig?.value,
        newValue: value,
        changedBy,
        changedAt: new Date(),
      },
    });

    invalidateCache();
  } catch (error) {
    console.error(`[AppConfigService] Failed to set key ${key}:`, error);
    throw error;
  }
}

/**
 * Get public configuration only (for UI)
 */
let publicCache: AppConfig | null = null;
let publicExpiry = 0;

/** Paramétrage public, lu à chaque rendu de page : gardé 30 secondes. */
export async function getPublicConfig(): Promise<AppConfig> {
  if (publicCache && publicExpiry > Date.now()) return publicCache;
  try {
    const configs = await prisma.appConfiguration.findMany({
      where: { isPublic: true },
    });
    publicCache = Object.fromEntries(
      configs.map((c) => [c.key, c.value])
    );
    publicExpiry = Date.now() + 30_000;
    return publicCache;
  } catch (error) {
    console.error('[AppConfigService] Failed to fetch public config:', error);
    return {};
  }
}

/**
 * Invalidate cache (call after updates)
 */
export function invalidateCache(): void {
  configCache = null;
  cacheExpiry = 0;
  publicCache = null;
  publicExpiry = 0;
}
