"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Building2,
  MapPin,
  Briefcase,
  Shield,
  Users,
  BarChart3,
} from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<any>({
    // Identité & Administration
    nom: "",
    raisonSociale: "",
    nomCommercial: "",
    typeClient: "Entreprise",
    formeJuridique: "",
    // Organisation & Secteur
    secteur: "",
    segmentClientele: "",
    effectifs: "",
    capitalSocial: "",
    chiffreAffaires: "",
    // Localisation
    pays: "Maroc",
    ville: "",
    adresse: "",
    codePostal: "",
    // Coordonnées
    email: "",
    telephone: "",
    website: "",
    // Relations Bancaires
    centreAffaires: "",
    gestionnaire: "",
    ratingInterne: "",
    statutBancaire: "Prospect",
    dateRelation: "",
    exposition: "",
    // KYC & Compliance
    statusKYC: "En attente",
    statusConformite: "En attente",
    // Autres
    description: "",
    status: "Actif",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
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
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create client");
        if (data.errors && Array.isArray(data.errors)) {
          const errors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            errors[err.field] = err.message;
          });
          setFieldErrors(errors);
        }
        return;
      }

      const newClient = data.data || data;
      router.push(`/clients/${newClient.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create client");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    {
      id: "identity",
      label: "Identité & Admin",
      icon: <Building2 size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nom du client
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-slate-700 border ${
                  fieldErrors.nom ? "border-red-500" : "border-slate-600"
                } rounded-lg text-white focus:outline-none focus:border-blue-500`}
              />
              {fieldErrors.nom && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.nom}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Raison sociale
              </label>
              <input
                type="text"
                name="raisonSociale"
                value={formData.raisonSociale || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nom commercial
              </label>
              <input
                type="text"
                name="nomCommercial"
                value={formData.nomCommercial || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type de client
              </label>
              <select
                name="typeClient"
                value={formData.typeClient || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner</option>
                <option value="Entreprise">Entreprise</option>
                <option value="PME">PME</option>
                <option value="GE">Grande Entreprise</option>
                <option value="Etat">État/Institution</option>
                <option value="ONG">ONG</option>
                <option value="Particulier">Particulier</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Forme juridique
              </label>
              <select
                name="formeJuridique"
                value={formData.formeJuridique || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner</option>
                <option value="SARL">SARL</option>
                <option value="SA">S.A.</option>
                <option value="EIRL">EIRL</option>
                <option value="SNC">SNC</option>
                <option value="SCS">SCS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Statut
              </label>
              <select
                name="status"
                value={formData.status || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
                <option value="Suspendu">Suspendu</option>
              </select>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "organisation",
      label: "Organisation & Secteur",
      icon: <Briefcase size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Secteur
              </label>
              <input
                type="text"
                name="secteur"
                value={formData.secteur || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Segment clientèle
              </label>
              <select
                name="segmentClientele"
                value={formData.segmentClientele || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner</option>
                <option value="Particulier">Particulier</option>
                <option value="PME">PME</option>
                <option value="Entreprise">Entreprise</option>
                <option value="Corporate">Corporate</option>
                <option value="Institutionnel">Institutionnel</option>
                <option value="Souverain">Souverain</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Effectifs
              </label>
              <input
                type="number"
                name="effectifs"
                value={formData.effectifs || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Capital social (MAD)
              </label>
              <input
                type="number"
                name="capitalSocial"
                value={formData.capitalSocial || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Chiffre d&apos;affaires (MAD)
              </label>
              <input
                type="number"
                name="chiffreAffaires"
                value={formData.chiffreAffaires || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description / Activités
            </label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      ),
    },
    {
      id: "localisation",
      label: "Localisation",
      icon: <MapPin size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Pays
              </label>
              <input
                type="text"
                name="pays"
                value={formData.pays || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Ville
              </label>
              <input
                type="text"
                name="ville"
                value={formData.ville || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Code postal
              </label>
              <input
                type="text"
                name="codePostal"
                value={formData.codePostal || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Adresse
            </label>
            <textarea
              name="adresse"
              value={formData.adresse || ""}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      ),
    },
    {
      id: "contact",
      label: "Contact",
      icon: <Users size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-slate-700 border ${
                  fieldErrors.email ? "border-red-500" : "border-slate-600"
                } rounded-lg text-white focus:outline-none focus:border-blue-500`}
              />
              {fieldErrors.email && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-slate-700 border ${
                  fieldErrors.telephone ? "border-red-500" : "border-slate-600"
                } rounded-lg text-white focus:outline-none focus:border-blue-500`}
              />
              {fieldErrors.telephone && (
                <p className="text-red-400 text-sm mt-1">
                  {fieldErrors.telephone}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Site web
              </label>
              <input
                type="url"
                name="website"
                value={formData.website || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "banking",
      label: "Relations Bancaires",
      icon: <BarChart3 size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Centre d&apos;affaires
              </label>
              <input
                type="text"
                name="centreAffaires"
                value={formData.centreAffaires || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Gestionnaire
              </label>
              <input
                type="text"
                name="gestionnaire"
                value={formData.gestionnaire || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Rating interne
              </label>
              <select
                name="ratingInterne"
                value={formData.ratingInterne || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Sélectionner</option>
                <option value="AAA">AAA</option>
                <option value="AA">AA</option>
                <option value="A">A</option>
                <option value="BBB">BBB</option>
                <option value="BB">BB</option>
                <option value="B">B</option>
                <option value="CCC">CCC</option>
                <option value="D">D</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Statut bancaire
              </label>
              <select
                name="statutBancaire"
                value={formData.statutBancaire || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Prospect">Prospect</option>
                <option value="Client">Client</option>
                <option value="VIP">VIP</option>
                <option value="Inactif">Inactif</option>
                <option value="Suspendu">Suspendu</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Date du début de relation
              </label>
              <input
                type="date"
                name="dateRelation"
                value={formData.dateRelation || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Exposition (MAD)
              </label>
              <input
                type="number"
                name="exposition"
                value={formData.exposition || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "kyc",
      label: "KYC & Conformité",
      icon: <Shield size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Statut KYC
              </label>
              <select
                name="statusKYC"
                value={formData.statusKYC || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="En attente">En attente</option>
                <option value="Vérifiée">Vérifiée</option>
                <option value="Rejet">Rejet</option>
                <option value="Expiration">Expiration</option>
                <option value="À renouveler">À renouveler</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Statut conformité
              </label>
              <select
                name="statusConformite"
                value={formData.statusConformite || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="En attente">En attente</option>
                <option value="Conforme">Conforme</option>
                <option value="Non conforme">Non conforme</option>
                <option value="Alerte">Alerte</option>
                <option value="Exemption">Exemption</option>
              </select>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Créer un nouveau client</h1>
          <p className="text-slate-400 mt-1">Ajoutez un nouveau client au système</p>
        </div>
        <Link
          href="/clients"
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <Tabs tabs={tabs} defaultTab="identity" />

        {/* Form Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-slate-700">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Création...</span>
              </>
            ) : (
              <span>Créer le client</span>
            )}
          </button>
          <Link
            href="/clients"
            className="inline-flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
