'use client';

import { useState } from 'react';
import { Plus, X, Download } from 'lucide-react';

const PROJECTS = [
  {
    id: 'p1',
    name: 'Parc Éolien Taourirt',
    sector: 'Énergie - Éolien',
    cost: 450000000,
    score: 8.08,
    rating: 'A',
    dscr: 1.35,
    equity: 25,
    leverage: 75,
    status: 'Validé',
  },
  {
    id: 'p2',
    name: 'Centrale Solaire Ouarzazate',
    sector: 'Énergie - Solaire',
    cost: 320000000,
    score: 7.85,
    rating: 'A',
    dscr: 1.28,
    equity: 22,
    leverage: 78,
    status: 'Validé',
  },
  {
    id: 'p3',
    name: 'Route Express Marrakech',
    sector: 'Infrastructure - Transport',
    cost: 280000000,
    score: 7.45,
    rating: 'BBB+',
    dscr: 1.15,
    equity: 20,
    leverage: 80,
    status: 'En cours',
  },
  {
    id: 'p5',
    name: 'Port Logistique Casablanca',
    sector: 'Infrastructure - Logistique',
    cost: 520000000,
    score: 8.25,
    rating: 'A',
    dscr: 1.42,
    equity: 28,
    leverage: 72,
    status: 'Validé',
  },
];

export default function ComparePage() {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const handleSelectProject = (id: string) => {
    if (selectedProjects.includes(id)) {
      setSelectedProjects(selectedProjects.filter(p => p !== id));
    } else if (selectedProjects.length < 4) {
      setSelectedProjects([...selectedProjects, id]);
    }
  };

  const compareProjects = PROJECTS.filter(p => selectedProjects.includes(p.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Comparaison de Projets</h1>
        <p className="text-slate-400 mt-2">Comparez jusqu'à 4 projets côte à côte</p>
      </div>

      {/* Project Selection */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Sélectionner des Projets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROJECTS.map(project => (
            <button
              key={project.id}
              onClick={() => handleSelectProject(project.id)}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                selectedProjects.includes(project.id)
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-600 bg-slate-700 hover:border-slate-500'
              }`}
            >
              <h3 className="font-semibold text-white">{project.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{project.sector}</p>
              <p className="text-sm text-cyan-400 font-bold mt-2">Score: {project.score}/10</p>
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      {compareProjects.length > 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Métrique</th>
                  {compareProjects.map(project => (
                    <th key={project.id} className="px-4 py-3 text-left text-sm font-semibold text-white">
                      {project.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                <Row label="Score Global" values={compareProjects.map(p => `${p.score}/10`)} highlight />
                <Row label="Rating" values={compareProjects.map(p => p.rating)} highlight />
                <Row label="Statut" values={compareProjects.map(p => p.status)} />
                <Row label="Coût (MAD)" values={compareProjects.map(p => `${(p.cost / 1000000).toFixed(0)}M`)} />
                <Row label="DSCR" values={compareProjects.map(p => `${p.dscr.toFixed(2)}x`)} />
                <Row label="Equity" values={compareProjects.map(p => `${p.equity}%`)} />
                <Row label="Leverage" values={compareProjects.map(p => `${p.leverage}%`)} />
                <Row label="Secteur" values={compareProjects.map(p => p.sector)} />
              </tbody>
            </table>
          </div>

          {/* Export Button */}
          <div className="p-4 border-t border-slate-700 flex justify-end">
            <button className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all">
              <Download size={18} />
              <span>Exporter Comparaison</span>
            </button>
          </div>
        </div>
      )}

      {selectedProjects.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
          <p className="text-slate-400">Sélectionnez au moins 2 projets pour comparer</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, values, highlight }: { label: string; values: string[]; highlight?: boolean }) {
  return (
    <tr className={highlight ? 'bg-slate-700' : ''}>
      <td className="px-4 py-3 font-semibold text-white">{label}</td>
      {values.map((value, i) => (
        <td key={i} className={`px-4 py-3 ${highlight ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}>
          {value}
        </td>
      ))}
    </tr>
  );
}
