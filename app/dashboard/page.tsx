'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, AlertCircle, BarChart3, PieChart, Activity, ArrowRight } from 'lucide-react';

interface Project {
  id: string;
  nom: string;
  secteur: string;
  montant: number;
  devise: string;
  status: string;
  scoreGlobal: number | null;
  grade: string | null;
  dateCreation: string;
}

interface Evaluation {
  id: string;
  projectId: string;
  finalScore: number | null;
  rating: string | null;
  status: string;
  createdAt: string;
  project?: { nom: string };
  analyst?: { nom: string; prenom: string };
}

interface AuditLog {
  id: string;
  action: string;
  details: any;
  utilisateurId: string;
  projectId: string | null;
  dateAction: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, evalRes, auditRes] = await Promise.all([
          fetch('/api/projects?limit=100'),
          fetch('/api/evaluations?limit=100'),
          fetch('/api/audit?limit=10'),
        ]);

        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(projData.data || []);
        }

        if (evalRes.ok) {
          const evalData = await evalRes.json();
          setEvaluations(evalData.data || []);
        }

        if (auditRes.ok) {
          const auditData = await auditRes.json();
          setActivities(Array.isArray(auditData) ? auditData : []);
        }
      } catch (err: any) {
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Tableau de Bord</h1>
          <p className="text-slate-400 mt-2">Chargement...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg bg-slate-800 p-6 animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  const totalProjects = projects.length;
  const approvedProjects = projects.filter(p => p.status === 'approuve').length;
  const scoredProjects = projects.filter(p => p.scoreGlobal != null);
  const avgScore = scoredProjects.length > 0
    ? (scoredProjects.reduce((sum, p) => sum + (p.scoreGlobal || 0), 0) / scoredProjects.length).toFixed(2)
    : '—';
  const totalExposure = projects.reduce((sum, p) => sum + (p.montant || 0), 0);

  // Rating distribution from real project grades
  const ratingCounts: Record<string, number> = {};
  projects.forEach(p => {
    if (p.grade) {
      const base = p.grade.replace(/[+-]/, '');
      ratingCounts[base] = (ratingCounts[base] || 0) + 1;
    }
  });
  const ratingLabels = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D'];

  // Sector exposure computed from real data
  const sectorMap: Record<string, number> = {};
  projects.forEach(p => {
    const sector = p.secteur || 'Autre';
    sectorMap[sector] = (sectorMap[sector] || 0) + (p.montant || 0);
  });
  const sectorExposure = Object.entries(sectorMap)
    .map(([sector, amount]) => ({
      sector,
      amount,
      percentage: totalExposure > 0 ? (amount / totalExposure) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Status breakdown using DB enum values
  const statusBreakdown = {
    approuve: projects.filter(p => p.status === 'approuve').length,
    en_revue: projects.filter(p => p.status === 'en_revue').length,
    en_cours: projects.filter(p => p.status === 'en_cours').length,
    brouillon: projects.filter(p => p.status === 'brouillon').length,
    rejete: projects.filter(p => p.status === 'rejete').length,
  };

  // Alerts generated from real data
  const alerts: { id: string; type: string; title: string; message: string }[] = [];
  projects.forEach(p => {
    if (p.status === 'brouillon' || p.status === 'en_cours') {
      const hasEval = evaluations.some(e => e.projectId === p.id && e.status === 'valide');
      if (!hasEval) {
        alerts.push({
          id: `alert-${p.id}`,
          type: 'warning',
          title: 'Évaluation manquante',
          message: `${p.nom} n'a pas d'évaluation validée`,
        });
      }
    }
    if (p.scoreGlobal != null && p.scoreGlobal < 5) {
      alerts.push({
        id: `alert-score-${p.id}`,
        type: 'error',
        title: 'Score faible détecté',
        message: `${p.nom}: Score ${p.scoreGlobal.toFixed(2)} - À surveiller`,
      });
    }
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return '🔴';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getAlertBorder = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-500';
      case 'warning': return 'border-yellow-500';
      default: return 'border-blue-500';
    }
  };

  const getRatingColor = (rating: string) => {
    if (rating.startsWith('AA')) return 'text-green-400';
    if (rating.startsWith('A')) return 'text-blue-400';
    if (rating.startsWith('BBB')) return 'text-cyan-400';
    return 'text-yellow-400';
  };

  const getRatingBarColor = (rating: string) => {
    if (rating.startsWith('AA')) return 'bg-green-500';
    if (rating.startsWith('A')) return 'bg-blue-500';
    if (rating.startsWith('BBB')) return 'bg-cyan-500';
    return 'bg-yellow-500';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Tableau de Bord</h1>
        <p className="text-slate-400 mt-2">Vue d&apos;ensemble du portefeuille de projets</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Projets Total</p>
          <p className="text-3xl font-bold">{totalProjects}</p>
          <p className="text-xs opacity-75 mt-2">{approvedProjects} approuvés</p>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-cyan-600 to-cyan-700 p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Évaluations</p>
          <p className="text-3xl font-bold">{evaluations.length}</p>
          <p className="text-xs opacity-75 mt-2">
            {evaluations.filter(e => e.status === 'valide').length} validées
          </p>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Score Moyen</p>
          <p className="text-3xl font-bold">{avgScore}</p>
          <p className="text-xs opacity-75 mt-2">/10</p>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-orange-600 to-orange-700 p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Exposition Totale</p>
          <p className="text-3xl font-bold">
            {totalExposure >= 1000000000
              ? `${(totalExposure / 1000000000).toFixed(1)}B`
              : `${(totalExposure / 1000000).toFixed(0)}M`}
          </p>
          <p className="text-xs opacity-75 mt-2">MAD</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alerts and Status */}
        <div className="lg:col-span-1 space-y-6">
          {/* Alerts */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <AlertCircle size={20} />
              <span>Alertes</span>
            </h2>
            <div className="space-y-3">
              {alerts.length === 0 && (
                <p className="text-sm text-slate-400">Aucune alerte active</p>
              )}
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={`bg-slate-700 rounded-lg p-3 border-l-4 ${getAlertBorder(alert.type)}`}>
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">{getAlertIcon(alert.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{alert.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <BarChart3 size={20} />
              <span>État des Projets</span>
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-slate-300">Approuvés</span>
                </div>
                <span className="text-lg font-bold text-white">{statusBreakdown.approuve}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-slate-300">En Révision</span>
                </div>
                <span className="text-lg font-bold text-white">{statusBreakdown.en_revue}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-slate-300">En Cours</span>
                </div>
                <span className="text-lg font-bold text-white">{statusBreakdown.en_cours}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                  <span className="text-sm text-slate-300">Brouillon</span>
                </div>
                <span className="text-lg font-bold text-white">{statusBreakdown.brouillon}</span>
              </div>
              {statusBreakdown.rejete > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-slate-300">Rejetés</span>
                  </div>
                  <span className="text-lg font-bold text-white">{statusBreakdown.rejete}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Column: Ratings and Sectors */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rating Distribution */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <TrendingUp size={20} />
              <span>Distribution par Rating</span>
            </h2>
            <div className="space-y-3">
              {ratingLabels.filter(r => (ratingCounts[r] || 0) > 0 || ['AAA', 'AA', 'A', 'BBB', 'B'].includes(r)).map((rating) => {
                const count = ratingCounts[rating] || 0;
                const percentage = totalProjects > 0 ? (count / totalProjects) * 100 : 0;
                return (
                  <div key={rating}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold text-sm ${getRatingColor(rating)}`}>{rating}</span>
                      <span className="text-xs text-slate-400">{count} projet{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getRatingBarColor(rating)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sector Exposure */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <PieChart size={20} />
              <span>Exposition par Secteur</span>
            </h2>
            {sectorExposure.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun projet avec secteur défini</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sectorExposure.map((sector) => (
                  <div key={sector.sector} className="bg-slate-700 rounded-lg p-3">
                    <p className="text-sm font-semibold text-white truncate">{sector.sector}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-slate-400">{sector.percentage.toFixed(1)}%</p>
                      <p className="text-sm font-bold text-cyan-400">{(sector.amount / 1000000).toFixed(0)}M</p>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-1 mt-2">
                      <div
                        className="bg-cyan-500 h-1 rounded-full"
                        style={{ width: `${Math.min(sector.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <Activity size={20} />
          <span>Activités Récentes</span>
        </h2>
        <div className="space-y-3">
          {activities.length === 0 && (
            <p className="text-sm text-slate-400">Aucune activité récente</p>
          )}
          {activities.slice(0, 8).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 pb-3 border-b border-slate-700 last:border-b-0">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-semibold text-cyan-400">{activity.action}</span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400">{formatDate(activity.dateAction)} {formatTime(activity.dateAction)}</span>
                </div>
                <p className="text-sm text-white">
                  {typeof activity.details === 'object' && activity.details
                    ? activity.details.description || activity.details.message || JSON.stringify(activity.details)
                    : activity.details || activity.action}
                </p>
                <p className="text-xs text-slate-500 mt-1">Par {activity.utilisateurId}</p>
              </div>
              <ArrowRight size={16} className="text-slate-500 mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/projects"
          className="rounded-lg border border-slate-700 bg-slate-800 p-6 hover:bg-slate-700 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white mb-1">Projets</h3>
              <p className="text-sm text-slate-400">Gestion des projets</p>
            </div>
            <ArrowRight size={20} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </div>
        </Link>

        <Link
          href="/evaluations"
          className="rounded-lg border border-slate-700 bg-slate-800 p-6 hover:bg-slate-700 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white mb-1">Évaluations</h3>
              <p className="text-sm text-slate-400">Suivi des scores</p>
            </div>
            <ArrowRight size={20} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </div>
        </Link>

        <Link
          href="/clients"
          className="rounded-lg border border-slate-700 bg-slate-800 p-6 hover:bg-slate-700 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white mb-1">Clients</h3>
              <p className="text-sm text-slate-400">Base clients</p>
            </div>
            <ArrowRight size={20} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}
