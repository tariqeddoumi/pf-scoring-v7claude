'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Eye, Edit2, Trash2, Filter } from 'lucide-react';

// Mock projects data - COMPLET selon spécifications
const MOCK_PROJECTS = [
  {
    id: 'p1',
    name: 'Parc Éolien Taourirt',
    sponsor: 'ONEE',
    sector: 'Énergie - Éolien',
    country: 'Maroc',
    totalCost: '500,000,000 MAD',
    financeRequired: '400,000,000 MAD',
    status: 'En cours d\'évaluation',
    maturity: 'Phase d\'ingénierie',
    rating: 'A',
    createdAt: '2026-02-15',
  },
  {
    id: 'p2',
    name: 'Centrale Solaire Ouarzazate',
    sponsor: 'ONEE',
    sector: 'Énergie - Solaire',
    country: 'Maroc',
    totalCost: '800,000,000 MAD',
    financeRequired: '650,000,000 MAD',
    status: 'Validé',
    maturity: 'Phase de financement',
    rating: 'AA',
    createdAt: '2026-01-20',
  },
  {
    id: 'p3',
    name: 'Dessalement d\'eau Agadir',
    sponsor: 'AMENDIS',
    sector: 'Eau - Dessalement',
    country: 'Maroc',
    totalCost: '350,000,000 MAD',
    financeRequired: '280,000,000 MAD',
    status: 'En préparation',
    maturity: 'Phase de développement',
    rating: 'BBB+',
    createdAt: '2026-03-01',
  },
  {
    id: 'p4',
    name: 'Autoroute Fès-Taza',
    sponsor: 'CITMADA',
    sector: 'Infrastructure - Transport',
    country: 'Maroc',
    totalCost: '1,200,000,000 MAD',
    financeRequired: '900,000,000 MAD',
    status: 'En cours d\'évaluation',
    maturity: 'Phase d\'étude de faisabilité',
    rating: 'A-',
    createdAt: '2026-02-28',
  },
  {
    id: 'p5',
    name: 'Port Sec Béni Mellal',
    sponsor: 'BMCI Capital',
    sector: 'Infrastructure - Logistique',
    country: 'Maroc',
    totalCost: '450,000,000 MAD',
    financeRequired: '350,000,000 MAD',
    status: 'Rejeté',
    maturity: 'Phase d\'analyse',
    rating: 'BB',
    createdAt: '2026-01-10',
  },
];

const STATUSES = [
  'Brouillon',
  'En préparation',
  'En cours d\'évaluation',
  'Soumis validation',
  'Validé',
  'Rejeté',
  'Archivé',
  'Clos',
];

const SECTORS = [
  'Énergie - Éolien',
  'Énergie - Solaire',
  'Énergie - Hydro',
  'Eau - Dessalement',
  'Infrastructure - Transport',
  'Infrastructure - Logistique',
  'Immobilier',
  'Télécom',
  'Industrie',
];

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSector, setSelectedSector] = useState('');

  const filteredProjects = MOCK_PROJECTS.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.sponsor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || project.status === selectedStatus;
    const matchesSector = !selectedSector || project.sector === selectedSector;

    return matchesSearch && matchesStatus && matchesSector;
  });

  const getRatingColor = (rating: string) => {
    if (rating.startsWith('AA')) return 'bg-green-500/20 text-green-400';
    if (rating.startsWith('A')) return 'bg-blue-500/20 text-blue-400';
    if (rating.startsWith('BBB')) return 'bg-cyan-500/20 text-cyan-400';
    if (rating.startsWith('BB')) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Validé':
        return 'bg-green-500/20 text-green-400';
      case 'En cours d\'évaluation':
      case 'En préparation':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Rejeté':
      case 'Archivé':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-slate-600 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projets</h1>
          <p className="text-slate-400 mt-2">Gestion et suivi des projets de financement</p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Plus size={20} />
          <span>Nouveau Projet</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom ou sponsor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-3 text-slate-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Sector Filter */}
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-3 text-slate-500" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">Tous les secteurs</option>
              {SECTORS.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Nom du Projet</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Sponsor</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Secteur</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Pays</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Coût Total</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Financement</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Rating</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredProjects.map((project) => (
              <tr key={project.id} className="hover:bg-slate-700 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-semibold text-white">{project.name}</p>
                  <p className="text-xs text-slate-400 mt-1">Maturité: {project.maturity}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">{project.sponsor}</td>
                <td className="px-4 py-3 text-slate-300 text-sm">{project.sector}</td>
                <td className="px-4 py-3 text-slate-300">{project.country}</td>
                <td className="px-4 py-3 text-white font-semibold text-sm">{project.totalCost}</td>
                <td className="px-4 py-3 text-slate-300 text-sm">{project.financeRequired}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRatingColor(project.rating)}`}>
                    {project.rating}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="p-2 text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Voir"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      href={`/projects/${project.id}/edit`}
                      className="p-2 text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 size={16} />
                    </Link>
                    <button
                      className="p-2 text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProjects.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-400">Aucun projet ne correspond aux critères de recherche.</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Projets" value={MOCK_PROJECTS.length.toString()} color="from-blue-600 to-blue-700" />
        <SummaryCard label="Validés" value={MOCK_PROJECTS.filter((p) => p.status === 'Validé').length.toString()} color="from-green-600 to-green-700" />
        <SummaryCard label="En Évaluation" value={MOCK_PROJECTS.filter((p) => p.status === 'En cours d\'évaluation').length.toString()} color="from-yellow-600 to-yellow-700" />
        <SummaryCard label="Financement Total" value="3,8 Md MAD" color="from-cyan-600 to-cyan-700" />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`rounded-lg bg-gradient-to-br ${color} p-6 text-white`}>
      <p className="text-sm opacity-90 mb-2">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
