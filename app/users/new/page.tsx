"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "analyst",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      if (!formData.nom || !formData.prenom || !formData.email) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Les mots de passe ne correspondent pas");
      }

      if (formData.password.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      router.push(`/users/${data.data.id}`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/users"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Créer un nouvel utilisateur</h1>
          <p className="text-slate-400 mt-1">Ajouter un nouvel utilisateur au système</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Accordion>
            <AccordionItem title="Informations Personnelles" defaultOpen={true}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Nom *</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="Dupont"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Prénom *</label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="Jean"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="jean.dupont@example.com"
                    required
                  />
                </div>
              </div>
            </AccordionItem>

            <AccordionItem title="Authentification & Permissions" defaultOpen={false} icon={<Shield size={18} />}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Rôle *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="viewer">Lecteur</option>
                    <option value="analyst">Analyste</option>
                    <option value="manager">Gestionnaire</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Mot de passe *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="Min 6 caractères"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Confirmer *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="Confirmer le mot de passe"
                    required
                  />
                </div>
              </div>
            </AccordionItem>
          </Accordion>

          <div className="flex gap-3 pt-6 border-t border-slate-700">
            <Link
              href="/users"
              className="flex-1 px-6 py-2 border border-slate-600 rounded-lg text-slate-400 hover:text-white text-center"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Création...
                </>
              ) : (
                "Créer l'utilisateur"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
