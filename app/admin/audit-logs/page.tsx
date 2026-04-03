'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, User, FileText, Clock } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  module: 'evaluation' | 'project' | 'client' | 'config' | 'user';
  severity: 'info' | 'warning' | 'critical';
  details: string;
  entityId: string;
  entityName: string;
  changes?: { field: string; oldValue: string; newValue: string }[];
}

const MOCK_LOGS: AuditLog[] = [
  {
    id: 'log1',
    timestamp: new Date('2026-04-03T14:30:00'),
    user: 'Ahmed Ben Selhami',
    action: 'Validation Évaluation',
    module: 'evaluation',
    severity: 'info',
    details: 'Évaluation validée pour Parc Éolien Taourirt',
    entityId: 'ev1',
    entityName: 'Parc Éolien Taourirt',
    changes: [{ field: 'Status', oldValue: 'Soumis', newValue: 'Validé' }],
  },
  {
    id: 'log2',
    timestamp: new Date('2026-04-03T10:15:00'),
    user: 'Fatima Zohra El Fassi',
    action: 'Création Projet',
    module: 'project',
    severity: 'info',
    details: 'Nouveau projet créé',
    entityId: 'p5',
    entityName: 'Port Logistique Casablanca',
  },
  {
    id: 'log3',
    timestamp: new Date('2026-04-02T16:45:00'),
    user: 'Mohamed Karim Bennani',
    action: 'Soumission Évaluation',
    module: 'evaluation',
    severity: 'info',
    details: 'Évaluation soumise pour validation',
    entityId: 'ev3',
    entityName: 'Parc Éolien Taourirt Annuelle',
  },
  {
    id: 'log4',
    timestamp: new Date('2026-04-01T09:20:00'),
    user: 'Ahmed Ben Selhami',
    action: 'Configuration Modifiée',
    module: 'config',
    severity: 'warning',
    details: 'Poids domaines ajustés',
    entityId: 'config1',
    entityName: 'Scoring Model V7++',
    changes: [
      { field: 'D3 Weight', oldValue: '15%', newValue: '16%' },
      { field: 'D7 Weight', oldValue: '15%', newValue: '14%' },
    ],
  },
  {
    id: 'log5',
    timestamp: new Date('2026-03-31T15:30:00'),
    user: 'Fatima Zohra El Fassi',
    action: 'Nouvel Utilisateur',
    module: 'user',
    severity: 'info',
    details: 'Utilisateur créé',
    entityId: 'u4',
    entityName: 'Laïla Khouya',
    changes: [{ field: 'Role', oldValue: 'N/A', newValue: 'Analyst' }],
  },
  {
    id: 'log6',
    timestamp: new Date('2026-03-28T11:00:00'),
    user: 'Ahmed Ben Selhami',
    action: 'Modification Client',
    module: 'client',
    severity: 'info',
    details: 'Informations client mises à jour',
    entityId: 'c1',
    entityName: 'ONEE',
    changes: [{ field: 'Rating', oldValue: 'AA', newValue: 'AA' }],
  },
];

const STORAGE_KEY = 'pf_audit_logs';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>(MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setLogs(data.map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) })));
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  }, []);

  const filtered = logs.filter(
    log =>
      (log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!selectedModule || log.module === selectedModule) &&
      (!selectedSeverity || log.severity === selectedSeverity)
  );

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      evaluation: 'bg-blue-500/20 text-blue-400',
      project: 'bg-purple-500/20 text-purple-400',
      client: 'bg-green-500/20 text-green-400',
      config: 'bg-yellow-500/20 text-yellow-400',
      user: 'bg-red-500/20 text-red-400',
    };
    return colors[module] || 'bg-slate-600 text-slate-300';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-500/20 text-blue-400',
      warning: 'bg-yellow-500/20 text-yellow-400',
      critical: 'bg-red-500/20 text-red-400',
    };
    return colors[severity] || 'bg-slate-600 text-slate-300';
  };

  const handleExport = () => {
    const csv = [
      'Date,User,Action,Module,Entity,Severity',
      ...filtered.map(
        log =>
          `"${log.timestamp.toLocaleString('fr-FR')}","${log.user}","${log.action}","${log.module}","${log.entityName}","${log.severity}"`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Journal d'Audit</h1>
          <p className="text-slate-400 mt-2">Historique complet des modifications du système</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Download size={20} />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Logs" value={logs.length.toString()} icon="📋" />
        <StatCard
          label="Aujourd'hui"
          value={logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length.toString()}
          icon="📅"
        />
        <StatCard label="Modifications" value={logs.filter(l => l.changes).length.toString()} icon="📝" />
        <StatCard label="Utilisateurs" value={new Set(logs.map(l => l.user)).size.toString()} icon="👥" />
      </div>

      {/* Search & Filters */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par utilisateur, entité ou action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="">Tous les modules</option>
            <option value="evaluation">Évaluations</option>
            <option value="project">Projets</option>
            <option value="client">Clients</option>
            <option value="config">Configuration</option>
            <option value="user">Utilisateurs</option>
          </select>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="">Toutes les sévérités</option>
            <option value="info">Info</option>
            <option value="warning">Avertissement</option>
            <option value="critical">Critique</option>
          </select>
        </div>

        {/* Logs List */}
        <div className="space-y-3">
          {filtered.map(log => (
            <div key={log.id} className="bg-slate-700 rounded-lg p-4 hover:bg-slate-650 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getModuleColor(log.module)}`}>
                      {log.module.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(log.severity)}`}>
                      {log.severity.toUpperCase()}
                    </span>
                    <span className="text-slate-400 text-xs flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{log.action}</h3>
                  <p className="text-sm text-slate-400">
                    {log.details} • <span className="font-semibold">{log.entityName}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    <User size={12} className="inline mr-1" />
                    {log.user}
                  </p>

                  {log.changes && log.changes.length > 0 && (
                    <div className="mt-2 text-xs space-y-1">
                      {log.changes.map((change, i) => (
                        <div key={i} className="text-slate-300">
                          <span className="font-semibold">{change.field}:</span> {change.oldValue} → {change.newValue}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">Aucun log trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 p-6">
      <p className="text-sm text-slate-400 mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-white">{value}</p>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
