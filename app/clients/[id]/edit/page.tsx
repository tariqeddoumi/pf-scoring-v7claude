'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!client) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      setSuccessMessage('✅ Client modifié avec succès !');
      setTimeout(() => {
        router.push(`/clients/${clientId}`);
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
        <Link href={`/clients/${clientId}`} className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300">
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
        <div className="rounded-lg border border-slate-700 p-8 text-center">
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!client) {
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
      <Link href={`/clients/${clientId}`} className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300">
        <ArrowLeft size={20} />
        <span>Retour</span>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">Modifier le client</h1>
        <p className="text-slate-400 mt-2">{client.nom}</p>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">{error}</div>}
      {successMessage && <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-400">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-700 p-6 bg-slate-800/50 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Nom *</label>
          <input type="text" value={client.nom} onChange={(e) => setClient({ ...client, nom: e.target.value })} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Email</label>
          <input type="email" value={client.email || ''} onChange={(e) => setClient({ ...client, email: e.target.value || undefined })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Téléphone</label>
          <input type="tel" value={client.telephone || ''} onChange={(e) => setClient({ ...client, telephone: e.target.value || undefined })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Secteur</label>
            <input type="text" value={client.secteur || ''} onChange={(e) => setClient({ ...client, secteur: e.target.value || undefined })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Pays</label>
            <input type="text" value={client.pays || ''} onChange={(e) => setClient({ ...client, pays: e.target.value || undefined })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Type</label>
          <input type="text" value={client.type || ''} onChange={(e) => setClient({ ...client, type: e.target.value || undefined })} placeholder="Entreprise" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Description</label>
          <textarea value={client.description || ''} onChange={(e) => setClient({ ...client, description: e.target.value || undefined })} rows={4} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none resize-none" />
        </div>

        <div className="flex space-x-3 pt-4">
          <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors">
            {submitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button type="button" onClick={() => router.push(`/clients/${clientId}`)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
