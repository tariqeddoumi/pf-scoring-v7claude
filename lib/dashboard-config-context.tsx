'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'alerts' | 'activities' | 'distribution' | 'exposure';
  label: string;
  enabled: boolean;
  position: number;
  size: 'small' | 'medium' | 'large';
}

export type DashboardTemplate = 'default' | 'executive' | 'analyst' | 'custom';

interface DashboardConfigContextType {
  widgets: DashboardWidget[];
  activeTemplate: DashboardTemplate;
  toggleWidget: (id: string) => void;
  reorderWidgets: (widgets: DashboardWidget[]) => void;
  resizeWidget: (id: string, size: DashboardWidget['size']) => void;
  loadTemplate: (template: DashboardTemplate) => void;
  saveAsTemplate: (name: string) => void;
}

const DashboardConfigContext = createContext<DashboardConfigContextType | undefined>(undefined);

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'kpi-projects', type: 'kpi', label: 'Projets', enabled: true, position: 0, size: 'small' },
  { id: 'kpi-evaluations', type: 'kpi', label: 'Évaluations', enabled: true, position: 1, size: 'small' },
  { id: 'kpi-score', type: 'kpi', label: 'Score Moyen', enabled: true, position: 2, size: 'small' },
  { id: 'kpi-exposure', type: 'kpi', label: 'Exposition', enabled: true, position: 3, size: 'small' },
  { id: 'alerts', type: 'alerts', label: 'Alertes', enabled: true, position: 4, size: 'large' },
  { id: 'distribution', type: 'distribution', label: 'Distribution Ratings', enabled: true, position: 5, size: 'medium' },
  { id: 'exposure', type: 'exposure', label: 'Exposition Secteur', enabled: true, position: 6, size: 'medium' },
  { id: 'activities', type: 'activities', label: 'Activités Récentes', enabled: true, position: 7, size: 'large' },
];

const EXECUTIVE_TEMPLATE: DashboardWidget[] = [
  { id: 'kpi-projects', type: 'kpi', label: 'Projets', enabled: true, position: 0, size: 'small' },
  { id: 'kpi-score', type: 'kpi', label: 'Score Moyen', enabled: true, position: 1, size: 'small' },
  { id: 'kpi-exposure', type: 'kpi', label: 'Exposition', enabled: true, position: 2, size: 'small' },
  { id: 'alerts', type: 'alerts', label: 'Alertes', enabled: true, position: 3, size: 'large' },
  { id: 'distribution', type: 'distribution', label: 'Distribution Ratings', enabled: true, position: 4, size: 'large' },
  { id: 'kpi-evaluations', type: 'kpi', label: 'Évaluations', enabled: false, position: 5, size: 'small' },
  { id: 'exposure', type: 'exposure', label: 'Exposition Secteur', enabled: false, position: 6, size: 'medium' },
  { id: 'activities', type: 'activities', label: 'Activités Récentes', enabled: false, position: 7, size: 'large' },
];

const ANALYST_TEMPLATE: DashboardWidget[] = [
  { id: 'kpi-evaluations', type: 'kpi', label: 'Évaluations', enabled: true, position: 0, size: 'small' },
  { id: 'kpi-score', type: 'kpi', label: 'Score Moyen', enabled: true, position: 1, size: 'small' },
  { id: 'distribution', type: 'distribution', label: 'Distribution Ratings', enabled: true, position: 2, size: 'medium' },
  { id: 'exposure', type: 'exposure', label: 'Exposition Secteur', enabled: true, position: 3, size: 'medium' },
  { id: 'activities', type: 'activities', label: 'Activités Récentes', enabled: true, position: 4, size: 'large' },
  { id: 'alerts', type: 'alerts', label: 'Alertes', enabled: true, position: 5, size: 'large' },
  { id: 'kpi-projects', type: 'kpi', label: 'Projets', enabled: false, position: 6, size: 'small' },
  { id: 'kpi-exposure', type: 'kpi', label: 'Exposition', enabled: false, position: 7, size: 'small' },
];

const TEMPLATES = {
  default: DEFAULT_WIDGETS,
  executive: EXECUTIVE_TEMPLATE,
  analyst: ANALYST_TEMPLATE,
};

const STORAGE_KEY = 'pf_dashboard_config';

export function DashboardConfigProvider({ children }: { children: React.ReactNode }) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [activeTemplate, setActiveTemplate] = useState<DashboardTemplate>('default');

  // Initialize from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setWidgets(parsed.widgets);
        setActiveTemplate(parsed.template);
      }
    } catch (error) {
      console.error('Failed to load dashboard config from localStorage', error);
    }
  }, []);

  // Save to localStorage whenever widgets change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets, template: activeTemplate }));
  }, [widgets, activeTemplate]);

  const toggleWidget = (id: string) => {
    setWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const reorderWidgets = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets.map((w, idx) => ({ ...w, position: idx })));
  };

  const resizeWidget = (id: string, size: DashboardWidget['size']) => {
    setWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, size } : w))
    );
  };

  const loadTemplate = (template: DashboardTemplate) => {
    setActiveTemplate(template);
    const templateWidgets = TEMPLATES[template as keyof typeof TEMPLATES];
    if (templateWidgets) {
      setWidgets(JSON.parse(JSON.stringify(templateWidgets)));
    }
  };

  const saveAsTemplate = (name: string) => {
    // This would typically save to a database
    console.log('Saving custom template:', name);
  };

  return (
    <DashboardConfigContext.Provider
      value={{
        widgets,
        activeTemplate,
        toggleWidget,
        reorderWidgets,
        resizeWidget,
        loadTemplate,
        saveAsTemplate,
      }}
    >
      {children}
    </DashboardConfigContext.Provider>
  );
}

export function useDashboardConfig() {
  const context = useContext(DashboardConfigContext);
  if (context === undefined) {
    throw new Error('useDashboardConfig must be used within DashboardConfigProvider');
  }
  return context;
}
