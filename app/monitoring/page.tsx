'use client';

import { useState } from 'react';
import { TrendingDown, AlertTriangle, CheckCircle, Clock, BarChart3 } from 'lucide-react';

interface MonitoringData {
  projectId: string;
  projectName: string;
  currentDSCR: number;
  targetDSCR: number;
  dscrTrend: 'up' | 'down' | 'stable';
  equity: number;
  leverage: number;
  covenants: { name: string; status: 'met' | 'warning' | 'breach'; value: string }[];
  financialMetrics: { metric: string; previous: number; current: number; target: number }[];
  lastReview: Date;
}

const MOCK_MONITORING: MonitoringData[] = [
  {
    projectId: 'p1',
    projectName: 'Parc Éolien Taourirt',
    currentDSCR: 1.35,
    targetDSCR: 1.30,
    dscrTrend: 'stable',
    equity: 25,
    leverage: 75,
    covenants: [
      { name: 'Minimum DSCR', status: 'met', value: '1.35x (min: 1.10x)' },
      { name: 'Maximum Leverage', status: 'met', value: '75% (max: 85%)' },
      { name: 'Minimum Equity', status: 'met', value: '25% (min: 20%)' },
      { name: 'Debt Capacity', status: 'met', value: 'OK' },
    ],
    financialMetrics: [
      { metric: 'EBITDA', previous: 45000000, current: 46500000, target: 48000000 },
      { metric: 'Total Debt', previous: 300000000, current: 298000000, target: 290000000 },
      { metric: 'Cash Reserve', previous: 12000000, current: 13500000, target: 15000000 },
    ],
    lastReview: new Date('2026-04-01'),
  },
  {
    projectId: 'p2',
    projectName: 'Centrale Solaire Ouarzazate',
    currentDSCR: 1.28,
    targetDSCR: 1.30,
    dscrTrend: 'down',
    equity: 22,
    leverage: 78,
    covenants: [
      { name: 'Minimum DSCR', status: 'warning', value: '1.28x (min: 1.10x)' },
      { name: 'Maximum Leverage', status: 'warning', value: '78% (max: 85%)' },
      { name: 'Minimum Equity', status: 'met', value: '22% (min: 20%)' },
      { name: 'Debt Capacity', status: 'met', value: 'OK' },
    ],
    financialMetrics: [
      { metric: 'EBITDA', previous: 38000000, current: 37200000, target: 40000000 },
      { metric: 'Total Debt', previous: 240000000, current: 245000000, target: 230000000 },
      { metric: 'Cash Reserve', previous: 10000000, current: 9800000, target: 12000000 },
    ],
    lastReview: new Date('2026-03-28'),
  },
];

export default function MonitoringPage() {
  const [selectedProject, setSelectedProject] = useState<string>(MOCK_MONITORING[0].projectId);

  const monitoring = MOCK_MONITORING.find(m => m.projectId === selectedProject) || MOCK_MONITORING[0];

  const getCovenantIcon = (status: string) => {
    switch (status) {
      case 'met':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-400" size={20} />;
      case 'breach':
        return <AlertTriangle className="text-red-400" size={20} />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➡️';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Suivi Post-Clôture</h1>
        <p className="text-slate-400 mt-2">Monitoring des projets financés</p>
      </div>

      {/* Project Selector */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <label className="text-sm font-semibold text-white block mb-3">Sélectionner un Projet</label>
        <div className="flex flex-wrap gap-2">
          {MOCK_MONITORING.map(m => (
            <button
              key={m.projectId}
              onClick={() => setSelectedProject(m.projectId)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedProject === m.projectId
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {m.projectName}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="DSCR Actuel"
          value={`${monitoring.currentDSCR.toFixed(2)}x`}
          target={`cible: ${monitoring.targetDSCR.toFixed(2)}x`}
          trend={getTrendIcon(monitoring.dscrTrend)}
          status={monitoring.currentDSCR >= monitoring.targetDSCR - 0.1 ? 'ok' : 'warning'}
        />
        <MetricCard
          label="Equity"
          value={`${monitoring.equity}%`}
          target="min: 20%"
          status={monitoring.equity >= 20 ? 'ok' : 'warning'}
        />
        <MetricCard
          label="Leverage"
          value={`${monitoring.leverage}%`}
          target="max: 85%"
          status={monitoring.leverage <= 85 ? 'ok' : 'warning'}
        />
      </div>

      {/* Covenants */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
          <CheckCircle size={24} />
          <span>Covenants</span>
        </h2>

        <div className="space-y-3">
          {monitoring.covenants.map((covenant, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                {getCovenantIcon(covenant.status)}
                <div>
                  <p className="font-semibold text-white">{covenant.name}</p>
                  <p className="text-sm text-slate-400">{covenant.value}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                covenant.status === 'met' ? 'bg-green-500/20 text-green-400' :
                covenant.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {covenant.status === 'met' ? 'Respecté' : covenant.status === 'warning' ? 'Attention' : 'Dépassé'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Metrics Trend */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
          <BarChart3 size={24} />
          <span>Métriques Financières</span>
        </h2>

        <div className="space-y-4">
          {monitoring.financialMetrics.map((metric, i) => {
            const change = metric.current - metric.previous;
            const changePercent = ((change / metric.previous) * 100).toFixed(1);
            const onTrack = metric.current <= metric.target;

            return (
              <div key={i} className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-white">{metric.metric}</p>
                  <span className={`text-sm font-bold ${onTrack ? 'text-green-400' : 'text-yellow-400'}`}>
                    {onTrack ? '✓ Sur cible' : '⚠️ À surveiller'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Période Précédente</p>
                    <p className="text-white font-semibold">${(metric.previous / 1000000).toFixed(1)}M</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Actuel</p>
                    <p className={`font-semibold ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${(metric.current / 1000000).toFixed(1)}M
                    </p>
                    <p className={`text-xs ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {change > 0 ? '+' : ''}{changePercent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Cible</p>
                    <p className="text-cyan-400 font-semibold">${(metric.target / 1000000).toFixed(1)}M</p>
                  </div>
                </div>

                <div className="w-full bg-slate-600 rounded-full h-2 mt-3">
                  <div
                    className={`h-2 rounded-full ${onTrack ? 'bg-green-500' : 'bg-yellow-500'}`}
                    style={{
                      width: `${Math.min((metric.current / metric.target) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Last Review */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Clock className="text-cyan-400" size={20} />
          <div>
            <p className="text-sm text-slate-400">Dernier Suivi</p>
            <p className="text-white font-semibold">{monitoring.lastReview.toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
        <button className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all">
          Mettre à Jour
        </button>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  target,
  status,
  trend,
}: {
  label: string;
  value: string;
  target: string;
  status: 'ok' | 'warning' | 'critical';
  trend?: string;
}) {
  const statusColor =
    status === 'ok' ? 'from-green-600 to-green-700' : status === 'warning' ? 'from-yellow-600 to-yellow-700' : 'from-red-600 to-red-700';

  return (
    <div className={`rounded-lg bg-gradient-to-br ${statusColor} p-6 text-white`}>
      <p className="text-sm opacity-90 mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-xs opacity-75 mt-1">{target}</p>
        </div>
        {trend && <span className="text-2xl">{trend}</span>}
      </div>
    </div>
  );
}
