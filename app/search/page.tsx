'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, X, Save, Trash2, Clock } from 'lucide-react';

interface SearchFilters {
  query: string;
  type: 'projects' | 'clients' | 'evaluations' | '';
  scoreMin: number;
  scoreMax: number;
  ratingFilter: string;
  statusFilter: string;
  sectorFilter: string;
  dateFrom: string;
  dateTo: string;
}

const MOCK_SEARCH_RESULTS = [
  {
    id: 'p1',
    title: 'Parc Éolien Taourirt',
    type: 'project',
    score: 8.08,
    rating: 'A',
    status: 'Validé',
    sector: 'Énergie - Éolien',
    date: '2026-03-15',
  },
  {
    id: 'p5',
    title: 'Port Logistique Casablanca',
    type: 'project',
    score: 7.92,
    rating: 'A',
    status: 'En cours',
    sector: 'Infrastructure - Logistique',
    date: '2026-03-28',
  },
  {
    id: 'c1',
    title: 'ONEE',
    type: 'client',
    rating: 'AA',
    status: 'Actif',
    sector: 'Énergie',
    date: '2025-01-15',
  },
  {
    id: 'ev1',
    title: 'Parc Éolien Taourirt - Initiale',
    type: 'evaluation',
    score: 8.08,
    rating: 'A',
    status: 'Validée',
    date: '2026-03-15',
  },
];

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: '',
    scoreMin: 0,
    scoreMax: 10,
    ratingFilter: '',
    statusFilter: '',
    sectorFilter: '',
    dateFrom: '',
    dateTo: '',
  });

  const [savedFilters, setSavedFilters] = useState<{ name: string; filters: SearchFilters }[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');

  const filtered = MOCK_SEARCH_RESULTS.filter(result => {
    if (filters.query && !result.title.toLowerCase().includes(filters.query.toLowerCase())) return false;
    if (filters.type && result.type !== filters.type) return false;
    if ('score' in result && (result.score < filters.scoreMin || result.score > filters.scoreMax)) return false;
    if (filters.ratingFilter && result.rating !== filters.ratingFilter) return false;
    if (filters.statusFilter && result.status !== filters.statusFilter) return false;
    if (filters.sectorFilter && 'sector' in result && !result.sector.includes(filters.sectorFilter)) return false;
    return true;
  });

  const handleSaveFilter = () => {
    if (!saveName.trim()) return;
    setSavedFilters(prev => [...prev, { name: saveName, filters: { ...filters } }]);
    setSaveName('');
    setShowSaveModal(false);
  };

  const handleLoadFilter = (f: SearchFilters) => {
    setFilters(f);
  };

  const handleClearFilters = () => {
    setFilters({
      query: '',
      type: '',
      scoreMin: 0,
      scoreMax: 10,
      ratingFilter: '',
      statusFilter: '',
      sectorFilter: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      project: '📊',
      client: '👥',
      evaluation: '📈',
    };
    return icons[type] || '📋';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      project: 'Projet',
      client: 'Client',
      evaluation: 'Évaluation',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Recherche Avancée</h1>
        <p className="text-slate-400 mt-2">Recherchez et filtrez les projets, clients et évaluations</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-500" size={20} />
        <input
          type="text"
          placeholder="Rechercher par nom, client, secteur..."
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-semibold text-white block mb-2">Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="">Tous les types</option>
            <option value="projects">Projets</option>
            <option value="clients">Clients</option>
            <option value="evaluations">Évaluations</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-white block mb-2">Rating</label>
          <select
            value={filters.ratingFilter}
            onChange={(e) => setFilters({ ...filters, ratingFilter: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="">Tous les ratings</option>
            <option value="AAA">AAA</option>
            <option value="AA">AA</option>
            <option value="A">A</option>
            <option value="BBB">BBB</option>
            <option value="BB">BB</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-white block mb-2">Statut</label>
          <select
            value={filters.statusFilter}
            onChange={(e) => setFilters({ ...filters, statusFilter: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="Validé">Validé</option>
            <option value="En cours">En cours</option>
            <option value="Brouillon">Brouillon</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-white block mb-2">Score</label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={filters.scoreMin}
            onChange={(e) => setFilters({ ...filters, scoreMin: parseFloat(e.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-slate-400 mt-1">Min: {filters.scoreMin.toFixed(1)}/10</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowSaveModal(true)}
          className="inline-flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Save size={18} />
          <span>Enregistrer Filtre</span>
        </button>
        <button
          onClick={handleClearFilters}
          className="inline-flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <X size={18} />
          <span>Réinitialiser</span>
        </button>
      </div>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm font-semibold text-white mb-3">Filtres Enregistrés</p>
          <div className="flex flex-wrap gap-2">
            {savedFilters.map((sf, i) => (
              <button
                key={i}
                onClick={() => handleLoadFilter(sf.filters)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded-full text-sm transition-all"
              >
                {sf.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        <p className="text-slate-400">{filtered.length} résultats trouvés</p>

        {filtered.map(result => (
          <Link
            key={result.id}
            href={result.type === 'project' ? `/projects/${result.id}` : result.type === 'client' ? `/clients/${result.id}` : `/evaluations/${result.id}`}
            className="rounded-lg border border-slate-700 bg-slate-800 p-4 hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{getTypeIcon(result.type)}</span>
                  <div>
                    <h3 className="font-semibold text-white">{result.title}</h3>
                    <p className="text-xs text-slate-400">{getTypeLabel(result.type)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                    {result.status}
                  </span>
                  <span className="px-2 py-1 bg-slate-700 rounded text-xs text-cyan-400 font-semibold">
                    {result.rating}
                  </span>
                  {'score' in result && (
                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                      Score: {result.score}/10
                    </span>
                  )}
                  {'sector' in result && (
                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                      {result.sector}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500 flex items-center space-x-1">
                  <Clock size={12} />
                  <span>{new Date(result.date).toLocaleDateString('fr-FR')}</span>
                </p>
              </div>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">Aucun résultat trouvé</p>
          </div>
        )}
      </div>

      {/* Save Filter Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-8 w-full max-w-md space-y-6">
            <h2 className="text-2xl font-bold text-white">Enregistrer le Filtre</h2>
            <input
              type="text"
              placeholder="Nom du filtre"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <div className="flex gap-4">
              <button
                onClick={handleSaveFilter}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all"
              >
                Enregistrer
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
