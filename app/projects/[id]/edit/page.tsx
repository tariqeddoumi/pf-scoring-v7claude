'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

interface Project {
  id: string;
  nom: string;
  description?: string;
  secteur: string;
  montant: number;
  devise: string;
  status: string;
  countryCode?: string;
  scoreGlobal?: number;
  grade?: string;
  dateCreation: string;
}

const STATUSES = [
  'brouillon',
  'en_cours',
  'en_revue',
  'approuve',
  'rejete',
];

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: project.nom,
          description: project.description,
          secteur: project.secteur,
          montant: project.montant,
          devise: project.devise,
          status: project.status,
          countryCode: project.countryCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      setSuccessMessage('✅ Projet modifié avec succès !');
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href={`/projects/${projectId}`} className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300">
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
        <div className="rounded-lg border border-slate-700 p-8 text-center">
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!project) {
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
      <Link href={`/projects/${projectId}`} className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300">
        <ArrowLeft size={20} />
        <span>Retour</span>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">Modifier le projet</h1>
        <p className="text-slate-400 mt-2">{project.nom}</p>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">{error}</div>}
      {successMessage && <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-400">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-700 p-6 bg-slate-800/50 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Nom du projet *</label>
          <input
            type="text"
            value={project.nom}
            onChange={(e) => setProject({ ...project, nom: e.target.value })}
            required
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Secteur *</label>
          <input
            type="text"
            value={project.secteur}
            onChange={(e) => setProject({ ...project, secteur: e.target.value })}
            required
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Montant *</label>
            <input
              type="number"
              value={project.montant}
              onChange={(e) => setProject({ ...project, montant: parseFloat(e.target.value) || 0 })}
              required
              min="0"
              step="0.01"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Devise *</label>
            <input
              type="text"
              value={project.devise}
              onChange={(e) => setProject({ ...project, devise: e.target.value })}
              required
              maxLength={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Pays</label>
          <input
            type="text"
            value={project.countryCode || ''}
            onChange={(e) => setProject({ ...project, countryCode: e.target.value || undefined })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Statut</label>
          <select
            value={project.status}
            onChange={(e) => setProject({ ...project, status: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Description</label>
          <textarea
            value={project.description || ''}
            onChange={(e) => setProject({ ...project, description: e.target.value || undefined })}
            rows={4}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none resize-none"
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/projects/${projectId}`)}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
