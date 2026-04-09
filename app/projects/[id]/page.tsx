'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

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
  dateMiseAJour?: string;
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

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('Projet non trouvé');
      const data = await response.json();
      setProject(data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/projects" className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300">
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
        <div className="rounded-lg border border-slate-700 p-8 text-center">
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link href="/projects" className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300">
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error || 'Projet non trouvé'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/projects" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{project.nom}</h1>
            <p className="text-slate-400 mt-2">Détails du projet</p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/projects/${project.id}/edit`)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Edit2 size={20} />
          <span>Modifier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-700 p-6 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white mb-4">Informations générales</h2>
          <div className="space-y-4">
            <div><p className="text-slate-400 text-sm">Nom</p><p className="text-white font-semibold">{project.nom}</p></div>
            <div><p className="text-slate-400 text-sm">Secteur</p><p className="text-white">{project.secteur || '-'}</p></div>
            <div><p className="text-slate-400 text-sm">Montant</p><p className="text-white">{project.montant.toLocaleString('fr-FR')} {project.devise}</p></div>
            <div><p className="text-slate-400 text-sm">Client</p><p className="text-white">{project.client?.nom || '-'}</p></div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 p-6 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white mb-4">Statut & Scoring</h2>
          <div className="space-y-4">
            <div>
              <p className="text-slate-400 text-sm">Statut</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
                project.status === 'approuve'
                  ? 'bg-green-500/20 text-green-400'
                  : project.status === 'rejete'
                  ? 'bg-red-500/20 text-red-400'
                  : project.status === 'en_revue' || project.status === 'en_cours'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {project.status}
              </span>
            </div>
            {project.grade && (
              <div><p className="text-slate-400 text-sm">Grade</p><p className="text-white">{project.grade}</p></div>
            )}
            {project.scoreGlobal !== undefined && (
              <div><p className="text-slate-400 text-sm">Score Global</p><p className="text-white">{project.scoreGlobal.toFixed(2)}</p></div>
            )}
            <div><p className="text-slate-400 text-sm">Créé le</p><p className="text-white">{new Date(project.dateCreation).toLocaleDateString('fr-FR')}</p></div>
          </div>
        </div>
      </div>

      {project.description && (
        <div className="rounded-lg border border-slate-700 p-6 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white mb-4">Description</h2>
          <p className="text-slate-300 whitespace-pre-wrap">{project.description}</p>
        </div>
      )}

      {project.user && (
        <div className="rounded-lg border border-slate-700 p-6 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white mb-4">Analyste Responsable</h2>
          <div className="space-y-4">
            <div><p className="text-slate-400 text-sm">Nom</p><p className="text-white">{project.user.prenom} {project.user.nom}</p></div>
            <div><p className="text-slate-400 text-sm">Email</p><p className="text-white">{project.user.email}</p></div>
          </div>
        </div>
      )}

      {project.client && (
        <div className="rounded-lg border border-slate-700 p-6 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white mb-4">Client Associé</h2>
          <div className="space-y-4">
            <div><p className="text-slate-400 text-sm">Nom</p><p className="text-white">{project.client.nom}</p></div>
            <div><p className="text-slate-400 text-sm">Email</p><p className="text-white">{project.client.email || '-'}</p></div>
            <div>
              <Link
                href={`/clients/${project.client.id}`}
                className="text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Voir le profil client →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
