'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Project } from '@/lib/types/models';

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [projectId, setProjectId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<Project>>({
    nom: '',
    description: '',
    secteur: '',
    pays: 'Maroc',
    montant: '',
    devise: 'MAD',
    status: 'Actif',
    // Additional project fields
    region: '',
    city: '',
    sponsor: '',
    technology: '',
    capacity: '',
    totalCost: '',
  });

  // Fetch project data on mount
  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        const { id } = await params;
        setProjectId(id);
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) throw new Error('Failed to fetch project');
        const data = await response.json();
        const project = data.data || data;
        setFormData(project);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    resolveAndFetch();
  }, [params]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      if (!projectId) throw new Error('Project ID not found');

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const errors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            errors[err.field] = err.message;
          });
          setFieldErrors(errors);
        }
        throw new Error(data.error || 'Failed to update project');
      }

      // Success - redirect to detail page
      router.push(`/projects/${projectId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Chargement du projet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href={projectId ? `/projects/${projectId}` : '/projects'}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Modifier le projet</h1>
          <p className="text-slate-400 mt-1">{formData.nom}</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          <p className="font-semibold">{error}</p>
          {Object.keys(fieldErrors).length > 0 && (
            <ul className="mt-2 ml-4 list-disc">
              {Object.entries(fieldErrors).map(([field, message]) => (
                <li key={field} className="text-sm">{message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">

        {/* Nom */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Nom du projet *
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom || ''}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
              fieldErrors.nom ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="Nom du projet"
            required
          />
          {fieldErrors.nom && <p className="mt-1 text-sm text-red-400">{fieldErrors.nom}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            placeholder="Description du projet..."
          />
        </div>

        {/* Secteur */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Secteur
          </label>
          <input
            type="text"
            name="secteur"
            value={formData.secteur || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Ex: Energie, Transport, Santé"
          />
        </div>

        {/* Pays */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Pays
          </label>
          <input
            type="text"
            name="pays"
            value={formData.pays || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Ex: Maroc"
          />
        </div>

        {/* Montant et Devise */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Montant
            </label>
            <input
              type="text"
              name="montant"
              value={formData.montant || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Ex: 100,000,000"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Devise
            </label>
            <select
              name="devise"
              value={formData.devise || 'MAD'}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="MAD">MAD (Dirham marocain)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (Dollar américain)</option>
              <option value="GBP">GBP (Livre sterling)</option>
            </select>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Statut
          </label>
          <select
            name="status"
            value={formData.status || 'Actif'}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
            <option value="Suspendu">Suspendu</option>
            <option value="Terminé">Terminé</option>
          </select>
        </div>


        {/* Region */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Région
          </label>
          <input
            type="text"
            name="region"
            value={formData.region || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Ex: Grand Casablanca"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Ville
          </label>
          <input
            type="text"
            name="city"
            value={formData.city || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Ex: Casablanca"
          />
        </div>

        {/* Sponsor */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Sponsor
          </label>
          <input
            type="text"
            name="sponsor"
            value={formData.sponsor || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Nom du sponsor"
          />
        </div>

        {/* Technology */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Technologie
          </label>
          <input
            type="text"
            name="technology"
            value={formData.technology || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Ex: Énergie Solaire, Éolienne"
          />
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Capacité
          </label>
          <input
            type="text"
            name="capacity"
            value={formData.capacity || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Ex: 100 MW"
          />
        </div>

        {/* Total Cost */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Coût Total
          </label>
          <input
            type="text"
            name="totalCost"
            value={formData.totalCost || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Montant total"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-all"
          >
            {submitting && <Loader2 size={20} className="animate-spin" />}
            <span>{submitting ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
          <Link
            href={projectId ? `/projects/${projectId}` : '/projects'}
            className="inline-flex items-center space-x-2 px-6 py-2 border border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            <span>Annuler</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
