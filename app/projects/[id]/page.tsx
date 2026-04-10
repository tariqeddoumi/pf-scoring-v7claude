'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, MapPin, Briefcase, DollarSign, TrendingUp } from 'lucide-react';

interface Project {
  id: string;
  nom: string;
  description?: string;
  secteur?: string;
  pays?: string;
  montant?: string;
  devise?: string;
  status: string;
  createdAt: string;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        const { id } = await params;
        setProjectId(id);
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) throw new Error('Failed to fetch project');
        const data = await response.json();
        setProject(data.data || data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load project');
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    resolveAndFetch();
  }, [params]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Chargement du projet...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link href="/projects" className="inline-flex items-center space-x-2 text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
          <span>Retour aux projets</span>
        </Link>
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error || 'Projet non trouvé'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/projects"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{project.nom}</h1>
            <p className="text-slate-400 mt-1 text-sm">ID: {project.id}</p>
          </div>
        </div>
        <button
          onClick={() => projectId && router.push(`/projects/${projectId}/edit`)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Edit2 size={20} />
          <span>Modifier</span>
        </button>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Statut</p>
          <p className="mt-2 text-lg font-semibold text-white">
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${
              project.status === 'Actif'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {project.status}
            </span>
          </p>
        </div>

        {/* Secteur */}
        {project.secteur && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Briefcase size={16} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase">Secteur</p>
            </div>
            <p className="mt-2 text-lg font-semibold text-white">{project.secteur}</p>
          </div>
        )}

        {/* Pays */}
        {project.pays && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <MapPin size={16} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase">Pays</p>
            </div>
            <p className="mt-2 text-lg font-semibold text-white">{project.pays}</p>
          </div>
        )}

        {/* Montant */}
        {project.montant && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <DollarSign size={16} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase">Montant</p>
            </div>
            <p className="mt-2 text-lg font-semibold text-white">
              {project.montant} {project.devise || 'MAD'}
            </p>
          </div>
        )}

        {/* Date de création */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Créé le</p>
          <p className="mt-2 text-white">{new Date(project.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
          <p className="text-slate-300">{project.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href="/projects"
          className="inline-flex items-center space-x-2 px-4 py-2 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
      </div>
    </div>
  );
}
