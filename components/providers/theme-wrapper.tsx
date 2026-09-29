'use client';

import { useEffect } from 'react';
import { useAppConfig } from './app-config-provider';

/**
 * ThemeWrapper applies app configuration to the DOM
 * - Sets CSS custom properties for colors
 * - Sets font family
 * - Manages dark/light theme
 */
export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { config } = useAppConfig();

  useEffect(() => {
    const root = document.documentElement;
    const style = root.style;

    // Apply colors (oklch format)
    if (config.PRIMARY_COLOR) {
      style.setProperty('--primary', config.PRIMARY_COLOR);
    }
    if (config.SECONDARY_COLOR) {
      style.setProperty('--secondary', config.SECONDARY_COLOR);
    }

    // Apply font family
    if (config.FONT_FAMILY) {
      style.setProperty('--font-sans', `"${config.FONT_FAMILY}", system-ui, sans-serif`);
    }

    // Le clair est le défaut : seul « dark » explicite bascule le thème. La règle
    // doit rester identique à celle du rendu serveur (app/layout.tsx), sinon le
    // thème change au premier rendu client.
    if (config.THEME_MODE === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Store in localStorage for persistence across reloads
    if (config.THEME_MODE) {
      localStorage.setItem('theme', config.THEME_MODE);
    }
  }, [config]);

  return <>{children}</>;
}
