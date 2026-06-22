import { getAppConfigKey } from './app-config-service';

/**
 * Feature flag utilities for controlling feature rollout
 */

export async function isDynamicFormsEnabled(): Promise<boolean> {
  try {
    const value = await getAppConfigKey('SCREENS_DYNAMIC_FORMS_ENABLED');
    return value === 'true' || value === '1';
  } catch (error) {
    console.error('[FeatureFlags] Error checking SCREENS_DYNAMIC_FORMS_ENABLED:', error);
    return false;
  }
}

export async function isGranularityEnabled(): Promise<boolean> {
  try {
    const value = await getAppConfigKey('SCORING_DOMAIN_GRANULARITY');
    return value === 'true' || value === '1' || value === 'enabled';
  } catch (error) {
    console.error('[FeatureFlags] Error checking SCORING_DOMAIN_GRANULARITY:', error);
    return false;
  }
}

export async function isSectorialEnabled(): Promise<boolean> {
  try {
    const value = await getAppConfigKey('SCORING_SECTORIAL_ENABLED');
    return value === 'true' || value === '1' || value === 'enabled';
  } catch (error) {
    console.error('[FeatureFlags] Error checking SCORING_SECTORIAL_ENABLED:', error);
    return false;
  }
}
