'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to check if a feature flag is enabled (client-side)
 * Fetches the flag value from public config endpoint
 */
export function useFeatureFlag(flag: string, defaultValue: boolean = false): boolean {
  const [enabled, setEnabled] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlag = async () => {
      try {
        const response = await fetch('/api/config/public');
        if (!response.ok) throw new Error('Failed to fetch config');

        const config = await response.json();
        const value = config[flag];

        setEnabled(value === 'true' || value === '1' || value === 'enabled');
      } catch (error) {
        console.error(`[useFeatureFlag] Error checking ${flag}:`, error);
        setEnabled(defaultValue);
      } finally {
        setLoading(false);
      }
    };

    fetchFlag();
  }, [flag, defaultValue]);

  return enabled;
}
