'use client';

import Link from 'next/link';
import { TrendingUp, AlertCircle, CheckCircle, Clock, BarChart3, PieChart, Activity, ArrowRight } from 'lucide-react';

const MOCK_PORTFOLIO = {
  projects: [
    { id: 'p1', name: 'Parc Éolien Taourirt', sector: 'Énergie - Éolien', cost: 450000000, status: 'validated', score: 8.08, rating: 'A' },
    { id: 'p2', name: 'Centrale Solaire Ouarzazate', sector: 'Énergie - Solaire', cost: 320000000, status: 'validated', score: 7.85, rating: 'A' },
    { id: 'p3', name: 'Route Express Marrakech', sector: 'Infrastructure - Transport', cost: 280000000, status: 'in_review', score: 7.45, rating: 'BBB+' },
    { id: 'p4', name: 'Dessalement Eau Skhira', sector: 'Eau - Dessalement', cost: 185000000, status: 'draft', score: 6.92, rating: 'BBB' },
    { id: 'p5', name: 'Port Logistique Casablanca', sector: 'Infrastructure - Logistique', cost: 520000000, status: 'validated', score: 8.25, rating: 'A' },
  ],
  evaluations: [
    { id: 'ev1', project: 'Parc Éolien Taourirt', analyst: 'Ahmed Ben Selhami', date: '2026-03-15', status: 'validated', score: 8.08 },
    { id: 'ev2', project: 'Port Logistique Casablanca', analyst: 'Fatima Zohra', date: '2026-03-20', status: 'validated', score: 8.25 },
    { id: 'ev3', project: 'Centrale Solaire Ouarzazate', analyst: 'Mohamed Karim', date: '2026-04-01', status: 'in_review', score: 7.85 },
  ],
  alerts: [
    { id: 'a1', type: 'error', title: 'Évaluation manquante', message: 'Dessalement Eau Skhira n\'a pas d\'évaluation validée', date: '2026-04-02' },
    { id: 'a2', type: 'warning', title: 'Score faible détecté', message: 'Route Express Marrakech: Score 7.45 - À surveiller', date: '2026-04-01' },
    { id: 'a3', type: 'info', title: 'Nouveau projet créé', message: 'Port Logistique Casablanca ajouté au portefeuille', date: '2026-03-28' },
  ],
  activities: [
    { id: '1', action: 'Validation', item: 'Évaluation Parc Éolien Taourirt', user: 'Manager Risk', date: '2026-03-15', time: '14:30' },
    { id: '2', action: 'Création', item: 'Projet Port Logistique Casablanca', user: 'Analyste Junior', date: '2026-03-28', time: '09:15' },
    { id: '3', action: 'Soumission', item: 'Évaluation Centrale Solaire', user: 'Ahmed Ben Selhami', date: '2026-04-01', time: '16:45' },
  ],
};

export default function DashboardPage() {
  const totalProjects = MOCK_PORTFOLIO.projects.length;
  const validatedProjects = MOCK_PORTFOLIO.projects.filter(p => p.status === 'validated').length;
  const avgScore = (MOCK_PORTFOLIO.projects.reduce((sum, p) => sum + p.score, 0) / totalProjects).toFixed(2);
  const totalExposure = MOCK_PORTFOLIO.projects.reduce((sum, p) => sum + p.cost, 0);

  const ratingDistribution = {
    AAA: MOCK_PORTFOLIO.projects.filter(p => p.rating === 'AAA').length,
    AA: MOCK_PORTFOLIO.projects.filter(p => p.rating === 'AA').length,
    A: MOCK_PORTFOLIO.projects.filter(p => p.rating === 'A').length,
    BBB: MOCK_PORTFOLIO.projects.filter(p => p.rating === 'BBB' || p.rating === 'BBB+').length,
    B: MOCK_PORTFOLIO.projects.filter(p => p.rating === 'B').length,
  };

  const sectorExposure = [
    { sector: 'Énergie - Éolien', amount: 450000000, percentage: 28.9 },
    { sector: 'Infrastructure - Logistique', amount: 520000000, percentage: 33.3 },
    { sector: 'Énergie - Solaire', amount: 320000000, percentage: 20.5 },
    { sector: 'Infrastructure - Transport', amount: 280000000, percentage: 18.0 },
    { sector: 'Eau - Dessalement', amount: 185000000, percentage: 11.8 },
  ];

  const statusBreakdown = {
    validated: MOCK_PORTFOLIO.projects.filter(p => p.status === 'validated').length,
    in_review: MOCK_PORTFOLIO.projects.filter(p => p.status === 'in_review').length,
    draft: MOCK_PORTFOLIO.projects.filter(p => p.status === 'draft').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return { bg: 'bg-green-500/20', text: 'text-green-400', badge: 'bg-green-500/20 text-green-400' };
      case 'in_review': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400' };
      case 'draft': return { bg: 'bg-slate-600', text: 'text-slate-300', badge: 'bg-slate-600 text-slate-300' };
      default: return { bg: 'bg-slate-600', text: 'text-slate-300', badge: 'bg-slate-600 text-slate-300' };
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return '🔴';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const getRatingColor = (rating: string) => {
    if (rating.startsWith('AA')) return 'text-green-400';
    if (rating.startsWith('A')) return 'text-blue-400';
    if (rating.startsWith('BBB')) return 'text-cyan-400';
    return 'text-yellow-400';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Tableau de Bord</h1>
        <p className="text-slate-400 mt-2">Vue d'ensemble du portefeuille de projets</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Projets Total</p>
          <p className="text-3xl font-bold">{totalProjects}</p>
          <p className="text-xs opacity-75 mt-2">{validatedProjects} validés</p>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-cyan-600 to-cyan-700 p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Évaluations</p>
          <p className="text-3xl font-bold">{MOCK_PORTFOLIO.evaluations.length}</p>
          <p className="text-xs opacity-75 mt-2">Dernière: {MOCK_PORTFOLIO.evaluations[0]?.date}</p>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Score Moyen</p>
          <p className="text-3xl font-bold">{avgScore}</p>
          <p className="text-xs opacity-75 mt-2">/10</p>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-orange-600 to-orange-700 p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Exposition Total</p>
          <p className="text-3xl font-bold">{(totalExposure / 1000000000).toFixed(1)}B</p>
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
              {MOCK_PORTFOLIO.alerts.map((alert) => (
                <div key={alert.id} className="bg-slate-700 rounded-lg p-3 border-l-4 border-red-500">
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">{getAlertIcon(alert.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{alert.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{alert.message}</p>
                      <p className="text-xs text-slate-500 mt-2">{alert.date}</p>
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
                  <span className="text-sm text-slate-300">Validés</span>
                </div>
                <span className="text-lg font-bold text-white">{statusBreakdown.validated}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-slate-300">En Révision</span>
                </div>
                <span className="text-lg font-bold text-white">{statusBreakdown.in_review}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                  <span className="text-sm text-slate-300">Brouillon</span>
                </div>
                <span className="text-lg font-bold text-white">{statusBreakdown.draft}</span>
              </div>
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
              {['AAA', 'AA', 'A', 'BBB', 'B'].map((rating) => {
                const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                const percentage = (count / totalProjects) * 100;
                return (
                  <div key={rating}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold text-sm ${getRatingColor(rating)}`}>{rating}</span>
                      <span className="text-xs text-slate-400">{count} projet{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          rating.startsWith('AA') ? 'bg-green-500' :
                          rating.startsWith('A') ? 'bg-blue-500' :
                          rating.startsWith('BBB') ? 'bg-cyan-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${percentage * 20}%` }}
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
                      style={{ width: `${sector.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
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
          {MOCK_PORTFOLIO.activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 pb-3 border-b border-slate-700 last:border-b-0">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-semibold text-cyan-400">{activity.action}</span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400">{activity.date} {activity.time}</span>
                </div>
                <p className="text-sm text-white">{activity.item}</p>
                <p className="text-xs text-slate-500 mt-1">Par {activity.user}</p>
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
