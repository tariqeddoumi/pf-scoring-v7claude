'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const SECTORS = [
  'Énergie - Éolien',
  'Énergie - Solaire',
  'Énergie - Hydro',
  'Eau - Dessalement',
  'Infrastructure - Transport',
  'Infrastructure - Logistique',
  'Immobilier',
  'Télécom',
  'Industrie',
];

const COUNTRIES = [
  { code: 'MA', label: 'Maroc' },
  { code: 'SN', label: 'Sénégal' },
  { code: 'CI', label: 'Côte d\'Ivoire' },
  { code: 'TN', label: 'Tunisie' },
  { code: 'DZ', label: 'Algérie' },
  { code: 'MZ', label: 'Mozambique' },
  { code: 'ZA', label: 'Afrique du Sud' },
];

export default function NewProjectPage() {
  const [formData, setFormData] = useState({
    name: '',
    sponsor: '',
    sector: SECTORS[0],
    country: 'MA',
    region: '',
    city: '',
    description: '',
    totalCost: '',
    financeRequired: '',
    constructionDuration: '',
    operationalDuration: '25',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('New project:', formData);
    // TODO: Intégrer avec API sur Jour 9-10
    alert('Projet créé avec succès ! (Mock)');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/projects"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Nouveau Projet</h1>
          <p className="text-slate-400 mt-2">Créez un nouveau projet de financement</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Identification */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">
              Identification du Projet
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Nom du Projet" required>
                <input
                  type="text"
                  name="name"
                  placeholder="Ex: Parc Éolien Taourirt"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </FormField>

              <FormField label="Sponsor Principal" required>
                <input
                  type="text"
                  name="sponsor"
                  placeholder="Ex: ONEE"
                  value={formData.sponsor}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </FormField>

              <FormField label="Secteur" required>
                <select
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
                  required
                >
                  {SECTORS.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Pays">
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Description du Projet" required>
              <textarea
                name="description"
                placeholder="Décrivez le projet en détail..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
                required
              />
            </FormField>
          </div>

          {/* Section 2: Localisation */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">
              Localisation
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Région">
                <input
                  type="text"
                  name="region"
                  placeholder="Ex: Drâa-Tafilalet"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </FormField>

              <FormField label="Ville">
                <input
                  type="text"
                  name="city"
                  placeholder="Ex: Taourirt"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </FormField>
            </div>
          </div>

          {/* Section 3: Financement */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">
              Paramètres Financiers
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Coût Total du Projet (MAD)" required>
                <input
                  type="number"
                  name="totalCost"
                  placeholder="Ex: 500000000"
                  value={formData.totalCost}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </FormField>

              <FormField label="Montant à Financer (MAD)" required>
                <input
                  type="number"
                  name="financeRequired"
                  placeholder="Ex: 400000000"
                  value={formData.financeRequired}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </FormField>

              <FormField label="Durée Construction (mois)">
                <input
                  type="number"
                  name="constructionDuration"
                  placeholder="Ex: 24"
                  value={formData.constructionDuration}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </FormField>

              <FormField label="Durée Exploitation (ans)">
                <input
                  type="number"
                  name="operationalDuration"
                  placeholder="Ex: 25"
                  value={formData.operationalDuration}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </FormField>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-slate-700">
            <button
              type="submit"
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all"
            >
              Créer le Projet
            </button>
            <Link
              href="/projects"
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-all text-center"
            >
              Annuler
            </Link>
          </div>
        </form>

        {/* Info */}
        <div className="mt-8 pt-8 border-t border-slate-700">
          <p className="text-slate-400 text-sm">
            <span className="font-semibold text-white">Note:</span> Une fois créé, vous pourrez enrichir le projet avec tous les détails (Parties prenantes, Calendrier, Financement détaillé, Contrats, ESG, Garanties, etc.) et procéder à l\'évaluation selon les 8 catégories de risque.
          </p>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
