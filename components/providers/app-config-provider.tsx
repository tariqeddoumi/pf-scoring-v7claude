'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface AppConfigContextType {
  config: Record<string, string>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(
  undefined
);

export function AppConfigProvider({
  initial = {},
  children,
}: {
  initial?: Record<string, string>;
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<Record<string, string>>(initial);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v9/configuration');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.data || {});
      }
    } catch (error) {
      console.error('[AppConfigProvider] Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppConfigContext.Provider value={{ config, loading, refresh }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return context;
}
