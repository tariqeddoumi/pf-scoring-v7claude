'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { apiGet } from '@/lib/api-client';

interface AppConfigContextType {
  /** Paramétrage général, surchargé par l'habillage de la banque de l'utilisateur. */
  config: Record<string, string>;
  /** Banque de l'utilisateur connecté (null avant connexion ou pour un compte global). */
  entite: string | null;
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
  const pathname = usePathname();
  // Habillage de la banque (et de ses entités mères) : nom de l'outil, logo, couleur.
  const [habillage, setHabillage] = useState<{
    nomOutil: string | null;
    logoUrl: string | null;
    couleurPrimaire: string | null;
    entite: string | null;
  } | null>(null);

  useEffect(() => {
    if (pathname === '/login') {
      setHabillage(null);
      return;
    }
    let annule = false;
    apiGet('/api/entites/habillage')
      .then((r) => (r.ok ? r.json() : null))
      .then((corps) => {
        if (!annule) setHabillage(corps?.data ?? null);
      })
      .catch(() => undefined);
    return () => {
      annule = true;
    };
    // Rechargé à la connexion (changement de page depuis /login) et après un changement de compte.
  }, [pathname === '/login']); // eslint-disable-line react-hooks/exhaustive-deps

  const effective = useMemo(() => {
    if (!habillage) return config;
    return {
      ...config,
      ...(habillage.nomOutil ? { APP_NAME: habillage.nomOutil } : {}),
      ...(habillage.logoUrl ? { APP_LOGO_URL: habillage.logoUrl } : {}),
      ...(habillage.couleurPrimaire ? { PRIMARY_COLOR: habillage.couleurPrimaire } : {}),
    };
  }, [config, habillage]);

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
    <AppConfigContext.Provider value={{ config: effective, entite: habillage?.entite ?? null, loading, refresh }}>
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
