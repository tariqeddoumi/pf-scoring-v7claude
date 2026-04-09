'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

interface Client {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  secteur?: string;
  pays?: string;
  type?: string;
  description?: string;
  status: string;
  createdAt: string;
  projects?: Array<{ id: string; nom: string; status: string }>;
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) throw new Error('Client non trouvé');
      const data = await response.json();
      setClient(data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      setClient(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/clients" className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300">
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
        <div className="rounded-lg border border-slate-700 p-8 text-center">
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-6">
        <Link href="/clients" className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300">
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error || 'Client non trouvé'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/clients" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{client.nom}</h1>
            <p className="text-slate-400 mt-2">Détails du client</p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/clients/${client.id}/edit`)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Edit2 size={20} />
          <span>Modifier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-700 p-6 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white mb-4">Informations personnelles</h2>
          <div className="space-y-4">
            <div><p className="text-slate-400 text-sm">Nom</p><p className="text-white font-semibold">{client.nom}</p></div>
            <div><p className="text-slate-400 text-sm">Email</p><p className="text-white">{client.email || '-'}</p></div>
            <div><p className="text-slate-400 text-sm">Téléphone</p><p className="text-white">{client.telephone || '-'}</p></div>
            <div><p className="text-slate-400 text-sm">Type</p><p className="text-white">{client.type || 'Entreprise'}</p></div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 p-6 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white mb-4">Localisation & Secteur</h2>
          <div className="space-y-4">
            <div><p className="text-slate-400 text-sm">Pays</p><p className="text-white">{client.pays || '-'}</p></div>
            <div><p className="text-slate-400 text-sm">Secteur</p><p className="text-white">{client.secteur || '-'}</p></div>
            <div>
              <p className="text-slate-400 text-sm">Statut</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${client.status === 'Actif' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {client.status}
              </span>
            </div>
            <div><p className="text-slate-400 text-sm">Créé le</p><p className="text-white">{new Date(client.createdAt).toLocaleDateString('fr-FR')}</p></div>
          </div>
        </div>
      </div>

      {client.description && (
        <div className="rounded-lg border border-slate-700 p-6 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white mb-4">Description</h2>
          <p className="text-slate-300 whitespace-pre-wrap">{client.description}</p>
        </div>
      )}

      {client.projects && client.projects.length > 0 && (
        <div className="rounded-lg border border-slate-700 p-6 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white mb-4">Projets associés ({client.projects.length})</h2>
          <div className="space-y-2">
            {client.projects.map(project => (
              <Link key={project.id} href={`/projects/${project.id}`} className="block p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">{project.nom}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${project.status === 'approuve' ? 'bg-green-500/20 text-green-400' : project.status === 'rejete' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {project.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
