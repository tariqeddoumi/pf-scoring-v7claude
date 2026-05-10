"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Shield, Mail } from "lucide-react";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: "system_admin" | "scoring_admin" | "risk_manager" | "committee_member" | "risk_analyst" | "auditor" | "read_only";
  createdAt: string;
}

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<User> & { password?: string; confirmPassword?: string }>({
    nom: "",
    prenom: "",
    email: "",
    role: "risk_analyst",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        const { id } = await params;
        setUserId(id);
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) throw new Error("Échec du chargement de l'utilisateur");
        const data = await response.json();
        const user = data.data || data;
        setFormData({
          nom: user.nom || "",
          prenom: user.prenom || "",
          email: user.email || "",
          role: user.role || "risk_analyst",
          password: "",
          confirmPassword: "",
        });
        setError(null);
      } catch (err: any) {
        setError(err.message || "Échec du chargement");
      } finally {
        setLoading(false);
      }
    };

    resolveAndFetch();
  }, [params]);

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
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      if (!userId) throw new Error("ID utilisateur non trouvé");

      const updateData: any = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        role: formData.role,
      };

      if (formData.password && formData.password.length > 0) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Les mots de passe ne correspondent pas");
        }
        if (formData.password.length < 8) {
          throw new Error("Le mot de passe doit contenir au moins 8 caractères");
        }
        if (!/[A-Z]/.test(formData.password)) {
          throw new Error("Le mot de passe doit contenir au moins une lettre majuscule");
        }
        if (!/[0-9]/.test(formData.password)) {
          throw new Error("Le mot de passe doit contenir au moins un chiffre");
        }
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
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
        throw new Error(data.error || "Échec de la mise à jour");
      }

      router.push(`/users/${userId}`);
    } catch (err: any) {
      setError(err.message || "Échec de la mise à jour");
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
      <div className="flex items-center space-x-4">
        <Link
          href={userId ? `/users/${userId}` : "/users"}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Modifier l'utilisateur</h1>
          <p className="text-slate-400 mt-1">{formData.prenom} {formData.nom}</p>
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
            <AccordionItem title="Informations Personnelles" defaultOpen={true} icon={<Mail size={18} />}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Nom *</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Prénom *</label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
                    value={formData.role || "risk_analyst"}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="read_only">Lecture seule</option>
                    <option value="auditor">Auditeur</option>
                    <option value="risk_analyst">Analyste Risque</option>
                    <option value="committee_member">Membre Comité</option>
                    <option value="risk_manager">Gestionnaire Risque</option>
                    <option value="scoring_admin">Admin Scoring</option>
                    <option value="system_admin">Super Admin</option>
                  </select>
                </div>

                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-sm text-slate-300">
                  Laissez vides pour ne pas changer le mot de passe
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Mot de passe</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="Min 8 caractères (1 majuscule + 1 chiffre)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Confirmer</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="Confirmer"
                  />
                </div>
              </div>
            </AccordionItem>
          </Accordion>

          <div className="flex gap-3 pt-6 border-t border-slate-700">
            <Link
              href={userId ? `/users/${userId}` : "/users"}
              className="flex-1 px-6 py-2 border border-slate-600 rounded-lg text-slate-400 hover:text-white text-center"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded-lg flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Mise à jour...
                </>
              ) : (
                "Mettre à jour"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
