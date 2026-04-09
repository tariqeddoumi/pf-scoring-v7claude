'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Eye, Edit2, Trash2, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  nom: string;
  description?: string;
  secteur: string;
  montant: number;
  devise: string;
  status: string;
  scoreGlobal?: number;
  grade?: string;
  dateCreation: string;
  user?: {
    nom: string;
    prenom: string;
    email: string;
  };
  client?: {
    id: string;
    nom: string;
    email: string;
  };
}

const STATUSES = [
  'brouillon',
  'en_cours',
  'en_revue',
  'approuve',
  'rejete',
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
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete project');
      setProjects(projects.filter(p => p.id !== projectId));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || project.status === selectedStatus;
    const matchesSector = !selectedSector || project.secteur === selectedSector;

    return matchesSearch && matchesStatus && matchesSector;
  });

  const getRatingColor = (grade: string) => {
    if (grade.startsWith('AA')) return 'bg-green-500/20 text-green-400';
    if (grade.startsWith('A')) return 'bg-blue-500/20 text-blue-400';
    if (grade.startsWith('BBB')) return 'bg-cyan-500/20 text-cyan-400';
    if (grade.startsWith('BB')) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approuve':
        return 'bg-green-500/20 text-green-400';
      case 'en_revue':
      case 'en_cours':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'rejete':
        return 'bg-red-500/20 text-red-400';
      case 'brouillon':
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border border-slate-700 p-8 text-center">
          <p className="text-slate-400">Chargement des projets...</p>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4">Confirmer la suppression</h3>
            <p className="text-slate-400 mb-6">Êtes-vous sûr ? Cette action est irréversible.</p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

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
      {!loading && filteredProjects.length > 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Nom du Projet</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Client</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Secteur</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Montant</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Grade</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-700 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{project.nom}</td>
                  <td className="px-4 py-3 text-slate-300">{project.client?.nom || '-'}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{project.secteur}</td>
                  <td className="px-4 py-3 text-white font-semibold text-sm">
                    {project.montant.toLocaleString('fr-FR')} {project.devise}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {project.grade && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRatingColor(project.grade)}`}>
                        {project.grade}
                      </span>
                    )}
                    {!project.grade && <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="p-2 text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => router.push(`/projects/${project.id}/edit`)}
                        className="p-2 text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(project.id)}
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
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProjects.length === 0 && (
        <div className="text-center py-12 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-lg">Aucun projet trouvé</p>
          <p className="text-slate-500 mt-1">
            {searchTerm ? 'Essayez une autre recherche' : 'Créez votre premier projet'}
          </p>
        </div>
      )}

      {/* Summary */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard label="Total Projets" value={projects.length.toString()} color="from-blue-600 to-blue-700" />
          <SummaryCard
            label="Approuvés"
            value={projects.filter((p) => p.status === 'approuve').length.toString()}
            color="from-green-600 to-green-700"
          />
          <SummaryCard
            label="En Révision"
            value={projects.filter((p) => p.status === 'en_revue').length.toString()}
            color="from-yellow-600 to-yellow-700"
          />
          <SummaryCard
            label="Financement Total"
            value={`${(projects.reduce((sum, p) => sum + p.montant, 0) / 1000000).toFixed(0)} M ${projects[0]?.devise || 'MAD'}`}
            color="from-cyan-600 to-cyan-700"
          />
        </div>
      )}
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
