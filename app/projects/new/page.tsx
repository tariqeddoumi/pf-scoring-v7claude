"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  FileText,
  MapPin,
  DollarSign,
  Zap,
  Users,
  BarChart3,
} from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<any>({
    // Identification
    nom: "",
    description: "",
    secteur: "",
    status: "brouillon",
    countryCode: "",
    // Localisation
    pays: "",
    // Finances
    montant: "",
    devise: "MAD",
    coutTotal: "",
    financement: "",
    apportPropre: "",
    taux: "",
    dureeCredit: "",
    typeCredit: "",
    tauxCouverture: "",
    ratio: "",
    // Technique
    sponsorPrincipal: "",
    nomSPV: "",
    constructeurEPC: "",
    operateurOM: "",
    technologie: "",
    capaciteInstallee: "",
    dureeProjet: "",
    periodeAmorce: "",
    periodeRemboursement: "",
    // Dates
    debutConstruction: "",
    finConstruction: "",
    // Structure
    structureCapitalePrincipale: "",
    // Evaluation
    scoreGlobal: "",
    grade: "",
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
      const response = await fetch("/api/projects", {
        method: "POST",
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
        throw new Error(data.error || "Failed to create project");
      }

      // Success - redirect to projects page
      router.push("/projects");
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    {
      id: "identification",
      label: "Identification",
      icon: <FileText size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Nom du projet</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange}
                className={`w-full px-4 py-2 bg-slate-700 border ${fieldErrors.nom ? "border-red-500" : "border-slate-600"} rounded-lg text-white focus:outline-none focus:border-blue-500`}
              />
              {fieldErrors.nom && <p className="text-red-400 text-sm mt-1">{fieldErrors.nom}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
                className={`w-full px-4 py-2 bg-slate-700 border ${fieldErrors.description ? "border-red-500" : "border-slate-600"} rounded-lg text-white focus:outline-none focus:border-blue-500`}
              />
              {fieldErrors.description && <p className="text-red-400 text-sm mt-1">{fieldErrors.description}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Secteur</label>
              <input type="text" name="secteur" value={formData.secteur} onChange={handleChange}
                className={`w-full px-4 py-2 bg-slate-700 border ${fieldErrors.secteur ? "border-red-500" : "border-slate-600"} rounded-lg text-white focus:outline-none focus:border-blue-500`}
              />
              {fieldErrors.secteur && <p className="text-red-400 text-sm mt-1">{fieldErrors.secteur}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Statut</label>
              <select name="status" value={formData.status} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                <option value="brouillon">Brouillon</option>
                <option value="en_cours">En cours</option>
                <option value="en_revue">En revue</option>
                <option value="approuve">Approuvé</option>
                <option value="rejete">Rejeté</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Code pays</label>
              <input type="text" name="countryCode" value={formData.countryCode || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="MA, FR, etc."
              />
            </div>
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Pays</label>
              <input type="text" name="pays" value={formData.pays || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "finances",
      label: "Finances",
      icon: <DollarSign size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Montant (MAD)</label>
              <input type="number" name="montant" value={formData.montant} onChange={handleChange}
                className={`w-full px-4 py-2 bg-slate-700 border ${fieldErrors.montant ? "border-red-500" : "border-slate-600"} rounded-lg text-white focus:outline-none focus:border-blue-500`}
                step="0.01"
              />
              {fieldErrors.montant && <p className="text-red-400 text-sm mt-1">{fieldErrors.montant}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Devise</label>
              <input type="text" name="devise" value={formData.devise} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Coût total (MAD)</label>
              <input type="number" name="coutTotal" value={formData.coutTotal || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Financement (MAD)</label>
              <input type="number" name="financement" value={formData.financement || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Apport propre (MAD)</label>
              <input type="number" name="apportPropre" value={formData.apportPropre || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Taux (%)</label>
              <input type="number" name="taux" value={formData.taux || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Type de crédit</label>
              <input type="text" name="typeCredit" value={formData.typeCredit || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Durée du crédit (ans)</label>
              <input type="number" name="dureeCredit" value={formData.dureeCredit || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Taux de couverture (%)</label>
              <input type="number" name="tauxCouverture" value={formData.tauxCouverture || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Ratio</label>
              <input type="number" name="ratio" value={formData.ratio || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "technique",
      label: "Technique",
      icon: <Zap size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Sponsor principal</label>
              <input type="text" name="sponsorPrincipal" value={formData.sponsorPrincipal || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nom du SPV</label>
              <input type="text" name="nomSPV" value={formData.nomSPV || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Constructeur EPC</label>
              <input type="text" name="constructeurEPC" value={formData.constructeurEPC || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Opérateur O&M</label>
              <input type="text" name="operateurOM" value={formData.operateurOM || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Technologie</label>
              <input type="text" name="technologie" value={formData.technologie || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Capacité installée (MW)</label>
              <input type="number" name="capaciteInstallee" value={formData.capaciteInstallee || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Durée du projet (ans)</label>
              <input type="number" name="dureeProjet" value={formData.dureeProjet || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Période d&apos;amorce (ans)</label>
              <input type="number" name="periodeAmorce" value={formData.periodeAmorce || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Période de remboursement (ans)</label>
              <input type="number" name="periodeRemboursement" value={formData.periodeRemboursement || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "dates",
      label: "Calendrier",
      icon: <FileText size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Début de construction</label>
              <input type="date" name="debutConstruction" value={formData.debutConstruction || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Fin de construction</label>
              <input type="date" name="finConstruction" value={formData.finConstruction || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "structure",
      label: "Structure Capital",
      icon: <Users size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Structure capitaleprincipale</label>
              <textarea name="structureCapitalePrincipale" value={formData.structureCapitalePrincipale || ""} onChange={handleChange} rows={3}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "evaluation",
      label: "Évaluation",
      icon: <BarChart3 size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Score global</label>
              <input type="number" name="scoreGlobal" value={formData.scoreGlobal || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Grade</label>
              <input type="text" name="grade" value={formData.grade || ""} onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                disabled
              />
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
          <h1 className="text-3xl font-bold text-white">Créer un nouveau projet</h1>
          <p className="text-slate-400 mt-1">Remplissez les informations du projet</p>
        </div>
        <Link href="/projects" className="inline-flex items-center space-x-2 text-slate-400 hover:text-slate-300 transition-colors">
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
        <Tabs tabs={tabs} defaultTab="identification" />

        {/* Form Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-slate-700">
          <button type="submit" disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
            {submitting ? (<><Loader2 size={18} className="animate-spin" /><span>Création...</span></>) : <span>Créer le projet</span>}
          </button>
          <Link href="/projects" className="inline-flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
