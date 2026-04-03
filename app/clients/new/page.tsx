'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function NewClientPage() {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Société Privée',
    sector: '',
    country: 'Maroc',
    email: '',
    phone: '',
    website: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Appel API POST /api/clients
    console.log('Créer client:', formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/clients"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Créer un nouveau client</h1>
          <p className="text-slate-400 mt-2">Ajoutez un client à votre base de données</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 space-y-6">
          {/* Name */}
          <FormField
            label="Nom du client"
            name="name"
            type="text"
            placeholder="Ex: ONEE"
            value={formData.name}
            onChange={handleChange}
            required
          />

          {/* Type */}
          <FormSelect
            label="Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={[
              'Entreprise Publique',
              'Société Privée',
              'Organisme International',
              'Autre',
            ]}
          />

          {/* Sector */}
          <FormField
            label="Secteur"
            name="sector"
            type="text"
            placeholder="Ex: Énergie"
            value={formData.sector}
            onChange={handleChange}
            required
          />

          {/* Country */}
          <FormSelect
            label="Pays"
            name="country"
            value={formData.country}
            onChange={handleChange}
            options={[
              'Maroc',
              'France',
              'Belgique',
              'Suisse',
              'Autres',
            ]}
          />

          {/* Email */}
          <FormField
            label="Email"
            name="email"
            type="email"
            placeholder="contact@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {/* Phone */}
          <FormField
            label="Téléphone"
            name="phone"
            type="tel"
            placeholder="+212 5XX XX XX XX"
            value={formData.phone}
            onChange={handleChange}
          />

          {/* Website */}
          <FormField
            label="Site Web"
            name="website"
            type="url"
            placeholder="www.example.com"
            value={formData.website}
            onChange={handleChange}
          />

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-700">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-lg transition-all"
            >
              Créer le client
            </button>
            <Link
              href="/clients"
              className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-6 py-3 rounded-lg transition-all text-center"
            >
              Annuler
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-white mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
      />
    </div>
  );
}

function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-white mb-2">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
