'use client';

import React, { createContext, useContext, useState } from 'react';

export interface Alert {
  id: string;
  projectId: string;
  projectName: string;
  type: 'score_low' | 'nogo_triggered' | 'dscr_breach' | 'equity_low' | 'deadline' | 'document_missing';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
}

interface AlertContextType {
  alerts: Alert[];
  unreadCount: number;
  createAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteAlert: (id: string) => void;
  getAlertsByType: (type: Alert['type']) => Alert[];
  getAlertsBySeverity: (severity: Alert['severity']) => Alert[];
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert1',
    projectId: 'p4',
    projectName: 'Dessalement Eau Skhira',
    type: 'score_low',
    severity: 'warning',
    message: 'Score faible détecté (6.92/10). À surveiller de près.',
    createdAt: new Date('2026-04-03T14:00:00'),
    read: false,
    actionUrl: '/evaluations/ev4',
  },
  {
    id: 'alert2',
    projectId: 'p5',
    projectName: 'Port Logistique Casablanca',
    type: 'nogo_triggered',
    severity: 'critical',
    message: 'Seuil NO-GO déclenché: DSCR insuffisant (1.05x < 1.1x)',
    createdAt: new Date('2026-04-02T10:30:00'),
    read: false,
    actionUrl: '/projects/p5',
  },
  {
    id: 'alert3',
    projectId: 'p1',
    projectName: 'Parc Éolien Taourirt',
    type: 'document_missing',
    severity: 'info',
    message: 'Document manquant: Rapport d\'audit 2026',
    createdAt: new Date('2026-04-01T09:15:00'),
    read: true,
    actionUrl: '/projects/p1',
  },
  {
    id: 'alert4',
    projectId: 'p3',
    projectName: 'Route Express Marrakech',
    type: 'dscr_breach',
    severity: 'critical',
    message: 'DSCR en baisse: 1.15x (cible: 1.30x)',
    createdAt: new Date('2026-03-31T16:45:00'),
    read: true,
  },
];

const STORAGE_KEY = 'pf_alerts';

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);

  const createAlert = (alertData: Omit<Alert, 'id' | 'createdAt'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: `alert_${Date.now()}`,
      createdAt: new Date(),
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const markAsRead = (id: string) => {
    setAlerts(prev =>
      prev.map(alert => (alert.id === id ? { ...alert, read: true } : alert))
    );
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const getAlertsByType = (type: Alert['type']) => {
    return alerts.filter(alert => alert.type === type);
  };

  const getAlertsBySeverity = (severity: Alert['severity']) => {
    return alerts.filter(alert => alert.severity === severity);
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <AlertContext.Provider
      value={{
        alerts,
        unreadCount,
        createAlert,
        markAsRead,
        markAllAsRead,
        deleteAlert,
        getAlertsByType,
        getAlertsBySeverity,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within AlertProvider');
  }
  return context;
}
