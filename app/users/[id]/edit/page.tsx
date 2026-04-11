'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<User>>({
    email: '',
    nom: '',
    prenom: '',
    role: 'analyst',
  });

  // Fetch user data on mount
  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        const { id } = await params;
        setUserId(id);
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();
        const user = data.data || data;
        setFormData(user);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    resolveAndFetch();
  }, [params]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      if (!userId) throw new Error('User ID not found');

      const response = await fetch(`/api/users/${userId}`, {
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
        throw new Error(data.error || 'Failed to update user');
      }

      // Success - redirect to detail page
      router.push(`/users/${userId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Chargement de l'utilisateur...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href={userId ? `/users/${userId}` : '/users'}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Modifier l'utilisateur</h1>
          <p className="text-slate-400 mt-1">{formData.nom} {formData.prenom}</p>
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
            Nom *
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom || ''}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
              fieldErrors.nom ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="Nom"
            required
          />
          {fieldErrors.nom && <p className="mt-1 text-sm text-red-400">{fieldErrors.nom}</p>}
        </div>

        {/* Prénom */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Prénom *
          </label>
          <input
            type="text"
            name="prenom"
            value={formData.prenom || ''}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
              fieldErrors.prenom ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="Prénom"
            required
          />
          {fieldErrors.prenom && <p className="mt-1 text-sm text-red-400">{fieldErrors.prenom}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
              fieldErrors.email ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="email@example.com"
            required
          />
          {fieldErrors.email && <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Rôle *
          </label>
          <select
            name="role"
            value={formData.role || 'analyst'}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          >
            <option value="viewer">Lecteur</option>
            <option value="analyst">Analyste</option>
            <option value="manager">Gestionnaire</option>
            <option value="admin">Administrateur</option>
          </select>
          {fieldErrors.role && <p className="mt-1 text-sm text-red-400">{fieldErrors.role}</p>}
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
            href={userId ? `/users/${userId}` : '/users'}
            className="inline-flex items-center space-x-2 px-6 py-2 border border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            <span>Annuler</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
