'use client';

import Link from 'next/link';
import { ArrowLeft, Download, Check, AlertCircle, TrendingUp } from 'lucide-react';

const MOCK_EVALUATION = {
  id: 'ev1',
  projectId: 'p1',
  projectName: 'Parc Éolien Taourirt',
  type: 'Initiale',
  date: '2026-03-15',
  analyst: 'Ahmed Ben Selhami',
  status: 'Validé',
  modelVersion: 'V7++',
  globalScore: 8.08,
  rating: 'A',
  pdRange: { min: 0.1, max: 0.3 },
  riskClass: 'Modéré',
  noGo: false,
  noGoReasons: [] as string[],
  recommendation: '✅ Favorable',
  redFlags: [],
  strengths: ['✅ D1 (Sponsor): 8.5/10', '✅ D3 (Construction): 8.2/10', '✅ D7 (Financement): 8.1/10'],
  weaknesses: ['⚠️ D4 (Marché): 6.8/10'],
  domainScores: [
    { id: 'D1', name: 'Sponsor & Shareholders', score: 8.5, weight: 10 },
    { id: 'D2', name: 'Project Characteristics', score: 7.2, weight: 10 },
    { id: 'D3', name: 'Construction Risk', score: 8.2, weight: 15 },
    { id: 'D4', name: 'Market Risk', score: 6.8, weight: 10 },
    { id: 'D5', name: 'Operational Risk', score: 8.0, weight: 10 },
    { id: 'D6', name: 'Counterparty Risk', score: 7.9, weight: 10 },
    { id: 'D7', name: 'Financial Structure', score: 8.1, weight: 15 },
    { id: 'D8', name: 'Legal & Documentation', score: 8.3, weight: 10 },
    { id: 'D9', name: 'ESG & Climate', score: 8.0, weight: 10 },
  ],
};

export default function EvaluationDetailPage({ params }: { params: { id: string } }) {
  const colors = {
    AAA: 'from-green-600 to-green-700',
    AA: 'from-green-500 to-green-600',
    A: 'from-blue-500 to-blue-600',
    BBB: 'from-cyan-500 to-cyan-600',
    BB: 'from-yellow-500 to-yellow-600',
    B: 'from-red-500 to-red-600',
  };

  const ratingColor = colors[MOCK_EVALUATION.rating as keyof typeof colors] || colors.B;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/evaluations" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{MOCK_EVALUATION.projectName}</h1>
            <p className="text-slate-400 mt-1">{MOCK_EVALUATION.type} • {MOCK_EVALUATION.date} • Par {MOCK_EVALUATION.analyst}</p>
          </div>
        </div>
        <button className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all">
          <Download size={20} />
          <span>Exporter PDF</span>
        </button>
      </div>

      {/* SCORE GLOBAL */}
      <div className={`rounded-lg bg-gradient-to-br ${ratingColor} p-8 text-white`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Score Global</p>
            <p className="text-4xl font-bold">{MOCK_EVALUATION.globalScore}</p>
            <p className="text-xs opacity-75 mt-1">/10</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Rating</p>
            <p className="text-4xl font-bold">{MOCK_EVALUATION.rating}</p>
            <p className="text-xs opacity-75 mt-1">{MOCK_EVALUATION.riskClass}</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">PD Indicative</p>
            <p className="text-xl font-bold">{MOCK_EVALUATION.pdRange.min}% - {MOCK_EVALUATION.pdRange.max}%</p>
            <p className="text-xs opacity-75 mt-1">Probabilité défaut</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Recommandation</p>
            <p className="text-2xl font-bold">{MOCK_EVALUATION.recommendation}</p>
            <p className="text-xs opacity-75 mt-1">Attribution</p>
          </div>
        </div>
      </div>

      {/* SCORES PAR DOMAINE */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Scores par Domaine</h2>

        <div className="space-y-3">
          {MOCK_EVALUATION.domainScores.map((domain) => (
            <div key={domain.id} className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-white">{domain.id}: {domain.name}</p>
                  <p className="text-sm text-slate-400">Poids: {domain.weight}%</p>
                </div>
                <span className="text-2xl font-bold text-cyan-400">{domain.score}/10</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                  style={{ width: `${(domain.score / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FORCES ET FAIBLESSES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Check size={24} className="text-green-400" />
            <span>Points Forts</span>
          </h2>
          <div className="space-y-3">
            {MOCK_EVALUATION.strengths.map((strength, i) => (
              <p key={i} className="text-white bg-slate-700 rounded px-3 py-2 text-sm">
                {strength}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <AlertCircle size={24} className="text-yellow-400" />
            <span>Points à Surveiller</span>
          </h2>
          <div className="space-y-3">
            {MOCK_EVALUATION.weaknesses.length > 0 ? (
              MOCK_EVALUATION.weaknesses.map((weakness, i) => (
                <p key={i} className="text-white bg-slate-700 rounded px-3 py-2 text-sm">
                  {weakness}
                </p>
              ))
            ) : (
              <p className="text-slate-400 italic">Aucun point faible majeur identifié</p>
            )}
          </div>
        </div>
      </div>

      {/* WORKFLOW */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Statut Workflow</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-white font-semibold">Brouillon</span>
            </div>
            <div className="w-full h-1 bg-gradient-to-r from-green-500 to-slate-600"></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-white font-semibold">Soumis</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-white font-semibold">Validé</span>
            </div>
          </div>
        </div>
        <p className="text-slate-400 text-sm mt-4">Évaluation validée le 15 mars 2026 par Manager Risk</p>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-4">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all">
          ✏️ Modifier
        </button>
        <button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-6 py-3 rounded-lg transition-all">
          🔄 Soumettre
        </button>
        <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-3 rounded-lg transition-all">
          📊 Comparer
        </button>
      </div>
    </div>
  );
}
