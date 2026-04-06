'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, TrendingUp, Target, Users, Award } from 'lucide-react';

interface BenchmarkData {
  metric: string;
  projectScore: number;
  sectorAvg: number;
  percentile: number;
}

interface SectorMetrics {
  sector: string;
  avgScore: number;
  count: number;
  medianScore: number;
  range: string;
}

const SECTOR_DATA: SectorMetrics[] = [
  {
    sector: 'Énergie Renouvelable',
    avgScore: 7.1,
    count: 45,
    medianScore: 7.2,
    range: '5.2 - 8.9',
  },
  {
    sector: 'Infrastructure Transport',
    avgScore: 6.8,
    count: 32,
    medianScore: 6.9,
    range: '4.8 - 8.3',
  },
  {
    sector: 'Eau & Assainissement',
    avgScore: 6.9,
    count: 28,
    medianScore: 7.0,
    range: '5.0 - 8.6',
  },
  {
    sector: 'Télécom',
    avgScore: 7.3,
    count: 22,
    medianScore: 7.4,
    range: '6.1 - 9.0',
  },
  {
    sector: 'Immobilier Commercial',
    avgScore: 6.5,
    count: 18,
    medianScore: 6.6,
    range: '4.5 - 8.1',
  },
];

const BENCHMARK_METRICS: BenchmarkData[] = [
  { metric: 'Score Global', projectScore: 7.2, sectorAvg: 7.1, percentile: 72 },
  { metric: 'Score Construction', projectScore: 7.5, sectorAvg: 6.8, percentile: 85 },
  { metric: 'Score Marché', projectScore: 6.5, sectorAvg: 7.1, percentile: 38 },
  { metric: 'Score Opérationnel', projectScore: 7.1, sectorAvg: 7.0, percentile: 68 },
  { metric: 'Score Financier', projectScore: 6.9, sectorAvg: 7.2, percentile: 42 },
  { metric: 'Ratio DSCR', projectScore: 1.32, sectorAvg: 1.28, percentile: 65 },
  { metric: 'Ratio Equity', projectScore: 28, sectorAvg: 30, percentile: 45 },
  { metric: 'Ratio Leverage', projectScore: 72, sectorAvg: 70, percentile: 55 },
];

const PEER_PROJECTS = [
  { name: 'Parc Éolien Taourirt', sector: 'Énergie', score: 7.2, rating: 'A' },
  { name: 'Port Logistique Casablanca', sector: 'Infrastructure', score: 6.8, rating: 'BBB' },
  { name: 'Route Express Marrakech', sector: 'Infrastructure', score: 7.4, rating: 'A' },
  { name: 'Usine Dessalement Skhira', sector: 'Eau', score: 6.9, rating: 'BBB' },
  { name: 'Parc Solar Ouarzazate', sector: 'Énergie', score: 8.1, rating: 'AA' },
];

function PercentileBar({ percentile }: { percentile: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 bg-slate-700 rounded overflow-hidden">
        <div
          className={`h-full ${
            percentile >= 75 ? 'bg-emerald-500' : percentile >= 50 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentile}%` }}
        ></div>
      </div>
      <span className="text-sm font-semibold text-slate-300 w-12 text-right">{percentile}%</span>
    </div>
  );
}

function ComparisonBadge({ isPositive }: { isPositive: boolean }) {
  if (isPositive) {
    return (
      <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
        <ArrowUp className="w-4 h-4" />
        Supérieur
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-red-400 text-sm font-semibold">
      <ArrowDown className="w-4 h-4" />
      Inférieur
    </div>
  );
}

export default function BenchmarkingPage() {
  const [selectedSector, setSelectedSector] = useState('Énergie Renouvelable');
  const sectorData = SECTOR_DATA.find(s => s.sector === selectedSector);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Benchmarking & Comparaison</h1>
        <p className="text-slate-400 mt-2">Comparez votre portefeuille aux normes sectorielles</p>
      </div>

      {/* Project vs Sector Average */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-cyan-600/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Score Global vs Secteur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="4" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#00a8cc"
                      strokeWidth="4"
                      strokeDasharray={`${(7.2 / 10) * 283} 283`}
                      transform="rotate(-90 50 50)"
                    />
                    <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-cyan-400">
                      7.2
                    </text>
                  </svg>
                </div>
                <p className="text-sm text-slate-400">Score Projet</p>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">Votre score</span>
                  <span className="text-sm font-semibold text-cyan-400">7.2/10</span>
                </div>
                <div className="h-2 bg-slate-700 rounded overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: '72%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">Moyenne secteur</span>
                  <span className="text-sm font-semibold text-slate-300">7.1/10</span>
                </div>
                <div className="h-2 bg-slate-700 rounded overflow-hidden">
                  <div className="h-full bg-slate-500" style={{ width: '71%' }}></div>
                </div>
              </div>
              <div className="p-3 bg-slate-900/50 rounded border border-emerald-500/20">
                <p className="text-sm text-emerald-400 font-semibold">
                  ✓ Supérieur à la moyenne de +0.1 points
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-3">
              <div className="p-3 bg-slate-900/50 rounded">
                <p className="text-xs text-slate-400 mb-1">PERCENTILE</p>
                <p className="text-2xl font-bold text-cyan-400">72e</p>
              </div>
              <div className="p-3 bg-slate-900/50 rounded">
                <p className="text-xs text-slate-400 mb-1">RANG DANS LE SECTEUR</p>
                <p className="text-2xl font-bold text-cyan-400">Top 28%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sector Selection */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle>Sélectionner un Secteur de Référence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {SECTOR_DATA.map(sector => (
              <Button
                key={sector.sector}
                onClick={() => setSelectedSector(sector.sector)}
                className={
                  selectedSector === sector.sector
                    ? 'bg-cyan-600 hover:bg-cyan-700 h-auto flex-col p-3'
                    : 'bg-slate-700 hover:bg-slate-600 h-auto flex-col p-3'
                }
              >
                <div className="text-sm font-semibold">{sector.sector}</div>
                <div className="text-xs text-slate-300 mt-1">{sector.avgScore.toFixed(1)}/10</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Sector Details */}
      {sectorData && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              {selectedSector}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900/50 rounded border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Score Moyen</p>
                <p className="text-2xl font-bold text-cyan-400">{sectorData.avgScore}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Score Médian</p>
                <p className="text-2xl font-bold text-blue-400">{sectorData.medianScore}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Nombre de Projets</p>
                <p className="text-2xl font-bold text-purple-400">{sectorData.count}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Plage de Scores</p>
                <p className="text-sm font-bold text-amber-400">{sectorData.range}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benchmark Metrics */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Analyse Détaillée des Métriques
          </CardTitle>
          <CardDescription>Comparaison par métrique vs moyenne secteur</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {BENCHMARK_METRICS.map(metric => (
              <div key={metric.metric} className="p-4 bg-slate-900/50 rounded border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-100">{metric.metric}</h4>
                    <div className="flex gap-4 mt-1 text-sm">
                      <span className="text-cyan-400">
                        Votre score: <strong>{metric.projectScore}</strong>
                      </span>
                      <span className="text-slate-400">
                        Secteur: <strong>{metric.sectorAvg}</strong>
                      </span>
                    </div>
                  </div>
                  <ComparisonBadge isPositive={metric.projectScore > metric.sectorAvg} />
                </div>
                <PercentileBar percentile={metric.percentile} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Peer Projects */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Projets Comparables
          </CardTitle>
          <CardDescription>Projets similaires pour comparaison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PEER_PROJECTS.map((project, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-700">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-100">{project.name}</h4>
                  <p className="text-xs text-slate-400">{project.sector}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-cyan-400">{project.score}</div>
                    <div className="text-xs text-slate-400">/10</div>
                  </div>
                  <div className="px-3 py-1 rounded bg-blue-500/20 text-blue-400 text-sm font-semibold">
                    {project.rating}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-cyan-600/30">
        <CardHeader>
          <CardTitle>Recommandations d'Amélioration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-slate-900/50 rounded border border-amber-500/20">
            <p className="text-sm text-amber-400 font-semibold mb-1">⚠ Domaine Marché</p>
            <p className="text-sm text-slate-300">
              Votre score (6.5) est inférieur à la moyenne (+0.6 points). Considérez une évaluation approfondie des contrats clients.
            </p>
          </div>
          <div className="p-3 bg-slate-900/50 rounded border border-emerald-500/20">
            <p className="text-sm text-emerald-400 font-semibold mb-1">✓ Domaine Construction</p>
            <p className="text-sm text-slate-300">
              Excellent score (7.5) vs secteur (6.8). Continuez à maintenir cette rigueur dans l'évaluation EPC.
            </p>
          </div>
          <div className="p-3 bg-slate-900/50 rounded border border-blue-500/20">
            <p className="text-sm text-blue-400 font-semibold mb-1">💡 Opportunité</p>
            <p className="text-sm text-slate-300">
              DSCR performant (1.32). Considérez une structure de financement plus agressive pour améliorer les retours.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
