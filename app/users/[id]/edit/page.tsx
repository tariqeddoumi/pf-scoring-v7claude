'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { User } from '@/lib/types/models';
import { FormInput } from '@/components/form/FormInput';
import { RoleSelect } from '@/components/form/RoleSelect';

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
        <FormInput
          label="Nom"
          name="nom"
          type="text"
          value={formData.nom || ''}
          onChange={handleChange}
          placeholder="Nom"
          error={fieldErrors.nom}
          required
        />

        <FormInput
          label="Prénom"
          name="prenom"
          type="text"
          value={formData.prenom || ''}
          onChange={handleChange}
          placeholder="Prénom"
          error={fieldErrors.prenom}
          required
        />

        <FormInput
          label="Email"
          name="email"
          type="email"
          value={formData.email || ''}
          onChange={handleChange}
          placeholder="email@example.com"
          error={fieldErrors.email}
          required
        />

        <RoleSelect
          value={formData.role || 'analyst'}
          onChange={handleChange}
          error={fieldErrors.role}
          required
        />

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
