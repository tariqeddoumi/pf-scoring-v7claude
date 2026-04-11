"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Client } from "@/lib/types/models";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  User,
  MapPin,
  Briefcase,
  FileText,
  Shield,
} from "lucide-react";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";

export default function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [clientId, setClientId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Client>>({
    nom: '',
    email: '',
    telephone: '',
    secteur: '',
    pays: 'Maroc',
    type: '',
    description: '',
    status: 'Actif',
  });

  // Resolve params and fetch client data
  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        const { id } = await params;
        setClientId(id);
        const response = await fetch(`/api/clients/${id}`);
        if (!response.ok) throw new Error("Failed to fetch client");
        const data = await response.json();
        const client = data.data || data;
        setFormData(client);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load client");
      } finally {
        setLoading(false);
      }
    };

    resolveAndFetch();
  }, [params]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
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
      if (!clientId) throw new Error("Client ID not found");

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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
        throw new Error(data.error || "Failed to update client");
      }

      // Success - redirect to detail page
      router.push(`/clients/${clientId}`);
    } catch (err: any) {
      setError(err.message || "Failed to update client");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Chargement du client...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href={clientId ? `/clients/${clientId}` : "/clients"}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Modifier le client</h1>
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
                <li key={field} className="text-sm">
                  {message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Accordion>
          {/* Section 1: Informations Générales */}
          <AccordionItem
            title="Informations Générales"
            defaultOpen={true}
            icon={<User size={18} />}
          >
            <div className="space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Nom du client *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                    fieldErrors.nom ? "border-red-500" : "border-slate-600"
                  }`}
                  placeholder="Nom du client"
                  required
                />
                {fieldErrors.nom && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.nom}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                    fieldErrors.email ? "border-red-500" : "border-slate-600"
                  }`}
                  placeholder="email@example.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-400">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="+212 5XX XXX XXX"
                />
              </div>
            </div>
          </AccordionItem>

          {/* Section 2: Localisation */}
          <AccordionItem title="Localisation" icon={<MapPin size={18} />}>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Pays */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Pays
                </label>
                <input
                  type="text"
                  name="pays"
                  value={formData.pays || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Maroc"
                />
              </div>

              {/* Ville */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Casablanca"
                />
              </div>

              {/* Adresse */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-white mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Adresse complète"
                />
              </div>
            </div>
          </AccordionItem>

          {/* Section 3: Secteur d'Activité */}
          <AccordionItem
            title="Secteur d'Activité"
            icon={<Briefcase size={18} />}
          >
            <div className="grid md:grid-cols-2 gap-4">
              {/* Secteur */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Secteur
                </label>
                <input
                  type="text"
                  name="secteur"
                  value={formData.secteur || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Energie, Banque, Retail"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Type
                </label>
                <input
                  type="text"
                  name="type"
                  value={formData.type || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Entreprise, PME"
                />
              </div>
            </div>
          </AccordionItem>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-all"
          >
            {submitting && <Loader2 size={20} className="animate-spin" />}
            <span>{submitting ? "Enregistrement..." : "Enregistrer"}</span>
          </button>
          <Link
            href={clientId ? `/clients/${clientId}` : "/clients"}
            className="inline-flex items-center space-x-2 px-6 py-2 border border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            <span>Annuler</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
