'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, MapPin, Phone, Briefcase, Shield, Users, BarChart3 } from 'lucide-react';
import { useState } from 'react';

export default function NewClientPage() {
  const [formData, setFormData] = useState({
    // Identité & Administration
    legal_name: '',
    trade_name: '',
    type: 'Société Privée',
    legal_form: '',
    // Organisation & Secteur
    sector: '',
    sub_sector: '',
    segment: '',
    employees: '',
    capital_amount: '',
    // Coordonnées
    country: 'Maroc',
    city: '',
    address: '',
    postal_code: '',
    email: '',
    phone: '',
    website: '',
    // Relations Bancaires
    business_center: '',
    account_manager: '',
    rating: '',
    banking_status: 'Prospect',
    relationship_start_date: '',
    exposure: '',
    // KYC & Compliance
    kyc_status: 'En attente',
    kyc_last_update: '',
    compliance_status: 'En attente',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});

    try {
      // Map form fields to API schema
      const apiData = {
        nom: formData.legal_name,
        email: formData.email || undefined,
        telephone: formData.phone || undefined,
        secteur: formData.sector || undefined,
        pays: formData.country || undefined,
        type: formData.type,
        description: formData.address || undefined,
      };

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      });

      const data = await response.json();

      if (!response.ok) {
        // Gestion des erreurs avec codes
        if (data.errors && Array.isArray(data.errors)) {
          const errors: Record<string, string> = {};
          // Map API field names back to form field names
          const fieldMapping: Record<string, string> = {
            nom: 'legal_name',
            email: 'email',
            telephone: 'phone',
            secteur: 'sector',
            pays: 'country',
            type: 'type',
            description: 'address'
          };

          data.errors.forEach((err: any) => {
            const formFieldName = fieldMapping[err.field] || err.field;
            errors[formFieldName] = err.message;
          });
          setFieldErrors(errors);
          setErrorMessage('Veuillez corriger les erreurs dans le formulaire');
        } else if (data.error) {
          setErrorMessage(`${data.error} (${data.errorCode || 'ERR_API_001'})`);
        } else {
          setErrorMessage('Une erreur serveur est survenue (ERR_API_001)');
        }
        return;
      }

      // Succès
      setSuccessMessage('✅ Client créé avec succès !');
      setFormData({
        legal_name: '',
        trade_name: '',
        type: 'Société Privée',
        legal_form: '',
        sector: '',
        sub_sector: '',
        segment: '',
        employees: '',
        capital_amount: '',
        country: 'Maroc',
        city: '',
        address: '',
        postal_code: '',
        email: '',
        phone: '',
        website: '',
        business_center: '',
        account_manager: '',
        rating: '',
        banking_status: 'Prospect',
        relationship_start_date: '',
        exposure: '',
        kyc_status: 'En attente',
        kyc_last_update: '',
        compliance_status: 'En attente',
      });

      // Redirection après 2 secondes
      setTimeout(() => {
        window.location.href = '/clients';
      }, 2000);
    } catch (error: any) {
      setErrorMessage(`Erreur connexion serveur (ERR_NET_001): ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-start space-x-2 md:space-x-4">
        <Link
          href="/clients"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0 mt-1"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-white truncate">Créer un nouveau client</h1>
          <p className="text-slate-400 mt-1 md:mt-2 text-sm md:text-base">Renseignez la signalétique complète du client</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-400 text-sm md:text-base">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm md:text-base">
          🔴 {errorMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">

        {/* === SECTION 1 : Identité & Administration === */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 md:p-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center space-x-2">
            <Building2 size={20} className="text-cyan-500 flex-shrink-0" />
            <span className="truncate">Identité et Informations Administratives</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <FormField
              label="Raison Sociale"
              name="legal_name"
              type="text"
              placeholder="Ex: Office National de l'Électricité et de l'Eau Potable"
              value={formData.legal_name}
              onChange={handleChange}
              required
              error={fieldErrors.legal_name}
            />
            <FormField
              label="Nom Commercial"
              name="trade_name"
              type="text"
              placeholder="Ex: ONEE"
              value={formData.trade_name}
              onChange={handleChange}
            />
            <FormSelect
              label="Type de Client"
              name="type"
              value={formData.type}
              onChange={handleChange}
              options={[
                'Entreprise Publique',
                'Société Privée',
                'Organisme International',
                'PME',
                'Startup',
                'Autre',
              ]}
              required
            />
            <FormSelect
              label="Forme Juridique"
              name="legal_form"
              value={formData.legal_form}
              onChange={handleChange}
              options={[
                '',
                'SA (Société Anonyme)',
                'SARL (Société à Responsabilité Limitée)',
                'SAS (Société par Actions Simplifiée)',
                'SNC (Société en Nom Collectif)',
                'Établissement Public',
                'EPIC',
                'GIE',
                'Coopérative',
                'Association',
                'Autre',
              ]}
              placeholder="Sélectionner..."
            />
          </div>
        </div>

        {/* === SECTION 2 : Organisation & Secteur === */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 md:p-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center space-x-2">
            <Briefcase size={20} className="text-cyan-500 flex-shrink-0" />
            <span className="truncate">Organisation et Secteur d&apos;Activité</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <FormSelect
              label="Secteur"
              name="sector"
              value={formData.sector}
              onChange={handleChange}
              options={[
                '',
                'Énergie',
                'Infrastructure',
                'Transport',
                'Télécommunications',
                'Immobilier',
                'Industrie',
                'Agriculture',
                'Mines',
                'Eau & Assainissement',
                'Santé',
                'Éducation',
                'Tourisme',
                'Services Financiers',
                'BTP',
                'Autre',
              ]}
              required
              placeholder="Sélectionner un secteur..."
            />
            <FormField
              label="Sous-Secteur"
              name="sub_sector"
              type="text"
              placeholder="Ex: Production, Transport & Distribution Électricité"
              value={formData.sub_sector}
              onChange={handleChange}
            />
            <FormSelect
              label="Segment de Clientèle"
              name="segment"
              value={formData.segment}
              onChange={handleChange}
              options={[
                '',
                'Grands Corporates',
                'Grands Corporates - Secteur Public',
                'Corporate',
                'PME / ETI',
                'Institutionnel',
                'Retail',
                'Autre',
              ]}
              placeholder="Sélectionner un segment..."
            />
            <FormField
              label="Nombre d'Employés"
              name="employees"
              type="number"
              placeholder="Ex: 15000"
              value={formData.employees}
              onChange={handleChange}
            />
            <FormField
              label="Capital Social (MAD)"
              name="capital_amount"
              type="number"
              placeholder="Ex: 2500000000"
              value={formData.capital_amount}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* === SECTION 3 : Coordonnées === */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 md:p-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center space-x-2">
            <MapPin size={20} className="text-cyan-500 flex-shrink-0" />
            <span>Coordonnées</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <FormSelect
              label="Pays"
              name="country"
              value={formData.country}
              onChange={handleChange}
              options={[
                'Maroc',
                'Algérie',
                'Tunisie',
                'Mauritanie',
                'Sénégal',
                'Côte d\'Ivoire',
                'France',
                'Belgique',
                'Suisse',
                'Espagne',
                'Autres',
              ]}
              required
            />
            <FormField
              label="Ville"
              name="city"
              type="text"
              placeholder="Ex: Casablanca"
              value={formData.city}
              onChange={handleChange}
            />
            <div className="md:col-span-2">
              <FormTextarea
                label="Adresse"
                name="address"
                placeholder="Adresse complète du siège social"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <FormField
              label="Code Postal"
              name="postal_code"
              type="text"
              placeholder="Ex: 20000"
              value={formData.postal_code}
              onChange={handleChange}
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              placeholder="contact@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              error={fieldErrors.email}
            />
            <FormField
              label="Téléphone"
              name="phone"
              type="tel"
              placeholder="+212 5XX XX XX XX"
              value={formData.phone}
              onChange={handleChange}
              error={fieldErrors.phone}
            />
            <FormField
              label="Site Web"
              name="website"
              type="url"
              placeholder="www.example.com"
              value={formData.website}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* === SECTION 4 : Relations Bancaires === */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 md:p-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center space-x-2">
            <BarChart3 size={20} className="text-cyan-500 flex-shrink-0" />
            <span>Relations Bancaires</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <FormField
              label="Centre d'Affaires"
              name="business_center"
              type="text"
              placeholder="Ex: Centre d'Affaires Énergie & Infrastructure"
              value={formData.business_center}
              onChange={handleChange}
            />
            <FormField
              label="Chargé d'Affaires"
              name="account_manager"
              type="text"
              placeholder="Nom du chargé d'affaires"
              value={formData.account_manager}
              onChange={handleChange}
            />
            <FormSelect
              label="Rating Interne"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              options={[
                '',
                'AAA',
                'AA+',
                'AA',
                'AA-',
                'A+',
                'A',
                'A-',
                'BBB+',
                'BBB',
                'BBB-',
                'BB+',
                'BB',
                'BB-',
                'B+',
                'B',
                'B-',
                'CCC',
                'CC',
                'C',
                'D',
              ]}
              placeholder="Sélectionner un rating..."
            />
            <FormSelect
              label="Statut Bancaire"
              name="banking_status"
              value={formData.banking_status}
              onChange={handleChange}
              options={[
                'Prospect',
                'Client Actif',
                'Client Inactif',
                'En Cours d\'Activation',
                'Résilié',
                'Suspendu',
              ]}
            />
            <FormField
              label="Date Début Relation"
              name="relationship_start_date"
              type="date"
              placeholder=""
              value={formData.relationship_start_date}
              onChange={handleChange}
            />
            <FormField
              label="Exposition Globale (MAD)"
              name="exposure"
              type="number"
              placeholder="Ex: 12500000000"
              value={formData.exposure}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* === SECTION 5 : KYC & Compliance === */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 md:p-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center space-x-2">
            <Shield size={20} className="text-cyan-500 flex-shrink-0" />
            <span>KYC et Conformité</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <FormSelect
              label="Statut KYC"
              name="kyc_status"
              value={formData.kyc_status}
              onChange={handleChange}
              options={[
                'En attente',
                'En cours',
                'Complète et À Jour',
                'Expirée',
                'Non conforme',
              ]}
            />
            <FormField
              label="Dernière Mise à Jour KYC"
              name="kyc_last_update"
              type="date"
              placeholder=""
              value={formData.kyc_last_update}
              onChange={handleChange}
            />
            <FormSelect
              label="Statut Conformité"
              name="compliance_status"
              value={formData.compliance_status}
              onChange={handleChange}
              options={[
                'En attente',
                'Conforme',
                'Non conforme',
                'En cours de vérification',
              ]}
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col md:flex-row gap-4 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className={`flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-lg transition-all text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? '⏳ Création en cours...' : 'Créer le client'}
          </button>
          <Link
            href="/clients"
            className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-6 py-3 rounded-lg transition-all text-center text-sm md:text-base"
          >
            Annuler
          </Link>
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
  error,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs md:text-sm font-semibold text-white mb-2">
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
        className={`w-full px-3 md:px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 text-sm md:text-base transition-all ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-600 focus:border-cyan-500 focus:ring-cyan-500'
        }`}
      />
      {error && <p className="text-red-400 text-xs md:text-sm mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({
  label,
  name,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs md:text-sm font-semibold text-white mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        rows={3}
        className="w-full px-3 md:px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none text-sm md:text-base"
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
  required,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs md:text-sm font-semibold text-white mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 md:px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm md:text-base"
      >
        {placeholder && options[0] === '' && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(option =>
          option === '' && placeholder ? null : (
            <option key={option} value={option}>
              {option}
            </option>
          )
        )}
      </select>
    </div>
  );
}
