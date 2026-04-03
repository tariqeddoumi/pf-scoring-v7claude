'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Eye, Edit2, Download } from 'lucide-react';

const MOCK_EVALUATIONS = [
  {
    id: 'ev1',
    projectName: 'Parc Éolien Taourirt',
    projectId: 'p1',
    type: 'Initiale',
    analyst: 'Ahmed Ben Selhami',
    status: 'Validé',
    score: 8.08,
    rating: 'A',
    date: '2026-03-15',
    noGo: false,
  },
  {
    id: 'ev2',
    projectName: 'Centrale Solaire Ouarzazate',
    projectId: 'p2',
    type: 'Initiale',
    analyst: 'Fatima Zohra',
    status: 'Brouillon',
    score: 7.45,
    rating: 'A-',
    date: '2026-04-01',
    noGo: false,
  },
  {
    id: 'ev3',
    projectName: 'Parc Éolien Taourirt',
    projectId: 'p1',
    type: 'Annuelle',
    analyst: 'Mohamed Karim',
    status: 'Soumis',
    score: 7.92,
    rating: 'A',
    date: '2026-04-02',
    noGo: false,
  },
];

export default function EvaluationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const filtered = MOCK_EVALUATIONS.filter(
    (ev) =>
      ev.projectName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!selectedStatus || ev.status === selectedStatus)
  );

  const getRatingColor = (rating: string) => {
    if (rating.startsWith('AA')) return 'bg-green-500/20 text-green-400';
    if (rating.startsWith('A')) return 'bg-blue-500/20 text-blue-400';
    if (rating.startsWith('BBB')) return 'bg-cyan-500/20 text-cyan-400';
    return 'bg-red-500/20 text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Validé':
        return 'bg-green-500/20 text-green-400';
      case 'Soumis':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Brouillon':
        return 'bg-slate-600 text-slate-300';
      default:
        return 'bg-red-500/20 text-red-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Évaluations</h1>
          <p className="text-slate-400 mt-2">Gestion et suivi des évaluations de risque</p>
        </div>
        <Link
          href="/evaluations/new"
          className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Plus size={20} />
          <span>Nouvelle Évaluation</span>
        </Link>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom de projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            <option value="Brouillon">Brouillon</option>
            <option value="Soumis">Soumis</option>
            <option value="Validé">Validé</option>
            <option value="Rejeté">Rejeté</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Projet</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Analyste</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Score</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-700 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{ev.projectName}</td>
                  <td className="px-4 py-3 text-slate-300">{ev.type}</td>
                  <td className="px-4 py-3 text-slate-300">{ev.analyst}</td>
                  <td className="px-4 py-3 font-bold text-cyan-400">{ev.score}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRatingColor(ev.rating)}`}>
                      {ev.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ev.status)}`}>
                      {ev.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{ev.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/evaluations/${ev.id}`}
                        className="p-2 text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Consulter"
                      >
                        <Eye size={16} />
                      </Link>
                      {ev.status === 'Brouillon' && (
                        <Link
                          href={`/evaluations/${ev.id}/edit`}
                          className="p-2 text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </Link>
                      )}
                      <button className="p-2 text-green-400 hover:bg-slate-700 rounded-lg transition-colors" title="Exporter">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card label="Total" value={MOCK_EVALUATIONS.length.toString()} />
        <Card label="Validées" value={MOCK_EVALUATIONS.filter((e) => e.status === 'Validé').length.toString()} />
        <Card label="Score moyen" value="7.82" />
        <Card label="Rating moyen" value="A" />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
      <p className="text-sm opacity-90 mb-2">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
