'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, PieChart, Zap, Target } from 'lucide-react';
import { useEvaluation } from '@/lib/evaluation-context';

interface TrendData {
  month: string;
  avgScore: number;
  count: number;
}

interface DomainComparison {
  domain: string;
  weight: number;
  avgScore: number;
  maxScore: number;
}

interface RatingDistribution {
  rating: string;
  count: number;
  percentage: number;
}

// Custom SVG Radar Chart Component
function RadarChart({ data, title }: { data: DomainComparison[]; title: string }) {
  const size = 300;
  const center = size / 2;
  const maxRadius = 100;
  const levels = 5;

  const polarToCartesian = (angle: number, distance: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + distance * Math.cos(rad - Math.PI / 2),
      y: center + distance * Math.sin(rad - Math.PI / 2),
    };
  };

  const points = data.map((item, i) => {
    const angle = (i * 360) / data.length;
    const distance = (item.avgScore / 10) * maxRadius;
    return polarToCartesian(angle, distance);
  });

  const gridLines = Array.from({ length: levels }).map((_, i) => {
    const radius = ((i + 1) / levels) * maxRadius;
    const points = Array.from({ length: data.length }).map((_, j) => {
      const angle = (j * 360) / data.length;
      return polarToCartesian(angle, radius);
    });
    return points;
  });

  return (
    <div className="flex flex-col items-center">
      <h3 className="font-semibold text-slate-100 mb-4">{title}</h3>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-slate-900 rounded">
        {/* Background grid */}
        {gridLines.map((gridPoints, i) => {
          const path = [
            ...gridPoints,
            gridPoints[0],
          ].map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          return <path key={`grid-${i}`} d={path} fill="none" stroke="#334155" strokeWidth="1" />;
        })}

        {/* Axes */}
        {data.map((_, i) => {
          const angle = (i * 360) / data.length;
          const point = polarToCartesian(angle, maxRadius);
          return (
            <line key={`axis-${i}`} x1={center} y1={center} x2={point.x} y2={point.y} stroke="#475569" strokeWidth="1" />
          );
        })}

        {/* Data polygon */}
        <path
          d={[...points, points[0]].map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
          fill="rgba(0, 168, 204, 0.2)"
          stroke="#00a8cc"
          strokeWidth="2"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <circle key={`point-${i}`} cx={point.x} cy={point.y} r="4" fill="#00a8cc" />
        ))}

        {/* Labels */}
        {data.map((item, i) => {
          const angle = (i * 360) / data.length;
          const point = polarToCartesian(angle, maxRadius + 30);
          return (
            <text
              key={`label-${i}`}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-slate-400"
            >
              {item.domain}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// Custom Heat Map Component
function HeatMap({ data, title }: { data: any[]; title: string }) {
  const getColor = (value: number) => {
    if (value < 3) return 'bg-red-500';
    if (value < 5) return 'bg-orange-500';
    if (value < 7) return 'bg-yellow-500';
    if (value < 8.5) return 'bg-lime-500';
    return 'bg-emerald-500';
  };

  const domains = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'];

  return (
    <div>
      <h3 className="font-semibold text-slate-100 mb-4">{title}</h3>
      <div className="space-y-2">
        {data.slice(0, 5).map((evaluation, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-20 text-xs text-slate-400 truncate">{evaluation.name}</div>
            <div className="flex gap-1">
              {domains.map((d, i) => (
                <div
                  key={`${idx}-${i}`}
                  className={`w-6 h-6 rounded text-xs flex items-center justify-center text-white font-semibold ${getColor(
                    evaluation.scores?.[i] || 0
                  )}`}
                  title={`${d}: ${evaluation.scores?.[i]?.toFixed(1) || 0}`}
                >
                  {(evaluation.scores?.[i] || 0).toFixed(0)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Trend Chart Component
function TrendChart({ data, title }: { data: TrendData[]; title: string }) {
  const maxScore = 10;
  const width = 400;
  const height = 200;
  const padding = 40;

  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const xStep = chartWidth / (data.length - 1 || 1);
  const yScale = chartHeight / maxScore;

  const points = data.map((d, i) => ({
    x: padding + i * xStep,
    y: padding + chartHeight - d.avgScore * yScale,
  }));

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div>
      <h3 className="font-semibold text-slate-100 mb-4">{title}</h3>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="bg-slate-900 rounded w-full">
        {/* Grid */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = padding + (chartHeight / 4) * i;
          return (
            <line key={`grid-${i}`} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4" />
          );
        })}

        {/* Axes */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#64748b" strokeWidth="2" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#64748b" strokeWidth="2" />

        {/* Area under curve */}
        <path
          d={`${path} L ${points[points.length - 1]?.x || padding} ${height - padding} L ${padding} ${height - padding}`}
          fill="rgba(0, 168, 204, 0.1)"
        />

        {/* Line */}
        <path d={path} fill="none" stroke="#00a8cc" strokeWidth="3" />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={`point-${i}`} cx={p.x} cy={p.y} r="4" fill="#00a8cc" />
        ))}

        {/* Labels */}
        {data.map((d, i) => (
          <text
            key={`label-${i}`}
            x={padding + i * xStep}
            y={height - padding + 20}
            textAnchor="middle"
            className="text-xs fill-slate-400"
          >
            {d.month}
          </text>
        ))}

        {/* Y-axis labels */}
        {Array.from({ length: 6 }).map((_, i) => {
          const value = i * 2;
          const y = padding + chartHeight - value * yScale;
          return (
            <text key={`y-label-${i}`} x={padding - 10} y={y} textAnchor="end" dominantBaseline="middle" className="text-xs fill-slate-400">
              {value}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function AnalyticsPage() {
  const { evaluations } = useEvaluation();
  const [selectedMetric, setSelectedMetric] = useState('score');

  // Calculate analytics data
  const trendData: TrendData[] = [
    { month: 'Jan', avgScore: 6.2, count: 3 },
    { month: 'Fév', avgScore: 6.8, count: 5 },
    { month: 'Mar', avgScore: 7.2, count: 4 },
    { month: 'Avr', avgScore: 7.4, count: 6 },
  ];

  const domainComparison: DomainComparison[] = [
    { domain: 'Sponsor', weight: 10, avgScore: 7.5, maxScore: 10 },
    { domain: 'Projet', weight: 10, avgScore: 6.8, maxScore: 10 },
    { domain: 'Construction', weight: 15, avgScore: 7.2, maxScore: 10 },
    { domain: 'Marché', weight: 10, avgScore: 6.5, maxScore: 10 },
    { domain: 'Opérationnel', weight: 10, avgScore: 7.1, maxScore: 10 },
    { domain: 'Contrepartie', weight: 10, avgScore: 7.3, maxScore: 10 },
    { domain: 'Financier', weight: 15, avgScore: 6.9, maxScore: 10 },
    { domain: 'Juridique', weight: 10, avgScore: 7.0, maxScore: 10 },
    { domain: 'ESG', weight: 10, avgScore: 6.2, maxScore: 10 },
  ];

  const ratingDistribution: RatingDistribution[] = [
    { rating: 'AAA', count: 0, percentage: 0 },
    { rating: 'AA', count: 1, percentage: 20 },
    { rating: 'A', count: 2, percentage: 40 },
    { rating: 'BBB', count: 1, percentage: 20 },
    { rating: 'BB', count: 1, percentage: 20 },
    { rating: 'B', count: 0, percentage: 0 },
    { rating: 'CCC', count: 0, percentage: 0 },
    { rating: 'D', count: 0, percentage: 0 },
  ];

  const evaluationsList = evaluations ? Object.values(evaluations) : [];

  const heatMapData = evaluationsList.map((e: any) => ({
    name: e.id || e.evaluationId,
    scores: [7.2, 6.8, 7.5, 6.5, 7.1, 7.3, 6.9, 7.0, 6.2], // Mock domain scores
  }));

  const avgScore = evaluationsList.length > 0
    ? (evaluationsList.reduce((sum: number, e: any) => sum + (e.score || 0), 0) / evaluationsList.length).toFixed(2)
    : '0.00';

  const totalEvals = evaluationsList.length;
  const validatedEvals = evaluationsList.filter((e: any) => e.status === 'valide').length;
  const avgImprovement = '+0.4 pts';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Analytique & Tendances</h1>
        <p className="text-slate-400 mt-2">Analyse approfondie des performances et tendances</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-cyan-400">{avgScore}</div>
            <div className="text-sm text-slate-400 mt-1">Score Moyen</div>
            <div className="text-xs text-emerald-400 mt-2">{avgImprovement} vs mois précédent</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-400">{totalEvals}</div>
            <div className="text-sm text-slate-400 mt-1">Total Évaluations</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-emerald-400">{validatedEvals}</div>
            <div className="text-sm text-slate-400 mt-1">Validées</div>
            <div className="text-xs text-slate-500 mt-2">{totalEvals > 0 ? Math.round((validatedEvals / totalEvals) * 100) : 0}% du portefeuille</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-amber-400">72%</div>
            <div className="text-sm text-slate-400 mt-1">Taux de Conformité</div>
          </CardContent>
        </Card>
      </div>

      {/* Metric Selector */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setSelectedMetric('score')}
          className={selectedMetric === 'score' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-700 hover:bg-slate-600'}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Score
        </Button>
        <Button
          onClick={() => setSelectedMetric('rating')}
          className={selectedMetric === 'rating' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-700 hover:bg-slate-600'}
        >
          <Target className="w-4 h-4 mr-2" />
          Ratings
        </Button>
        <Button
          onClick={() => setSelectedMetric('domain')}
          className={selectedMetric === 'domain' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-700 hover:bg-slate-600'}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Domaines
        </Button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Tendance des Scores
            </CardTitle>
            <CardDescription>Évolution mensuelle du score moyen</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={trendData} title="" />
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-cyan-400" />
              Distribution des Ratings
            </CardTitle>
            <CardDescription>Répartition par grade de crédit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ratingDistribution.filter(r => r.count > 0).map(r => (
                <div key={r.rating}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-300">{r.rating}</span>
                    <span className="text-sm text-slate-400">{r.count} ({r.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 to-blue-600"
                      style={{ width: `${r.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Performance par Domaine
            </CardTitle>
            <CardDescription>Score moyen pour chaque domaine</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <RadarChart data={domainComparison} title="" />
          </CardContent>
        </Card>

        {/* Heat Map */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Matrice d'Évaluation</CardTitle>
            <CardDescription>Scores par domaine et évaluation</CardDescription>
          </CardHeader>
          <CardContent>
            <HeatMap data={heatMapData} title="" />
            <div className="mt-4 flex justify-between text-xs text-slate-500">
              <span>Score faible</span>
              <span>Score élevé</span>
            </div>
            <div className="flex gap-1 mt-2">
              {['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'].map((color, i) => (
                <div key={i} className={`h-4 flex-1 rounded ${color}`}></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-cyan-600/30">
        <CardHeader>
          <CardTitle>Insights & Recommandations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-slate-900/50 rounded border border-slate-700">
            <p className="text-sm text-slate-300">
              ✓ <strong>Tendance Positive:</strong> Le score moyen augmente de 0.4 points par mois
            </p>
          </div>
          <div className="p-3 bg-slate-900/50 rounded border border-slate-700">
            <p className="text-sm text-slate-300">
              ⚠ <strong>Point d'Attention:</strong> Le domaine "Marché" affiche le score le plus faible (6.5/10)
            </p>
          </div>
          <div className="p-3 bg-slate-900/50 rounded border border-slate-700">
            <p className="text-sm text-slate-300">
              ✓ <strong>Point Fort:</strong> Les domaines "Sponsor" et "Contrepartie" maintiennent des scores élevés (7.3-7.5/10)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
