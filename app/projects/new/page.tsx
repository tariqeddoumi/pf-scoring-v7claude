'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api, apiFetchWithErrorHandling } from '@/lib/api-client';
import { createAppError, parseApiError, logAppError } from '@/lib/error-utils';

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

interface Client {
  id: string;
  nom: string;
  email?: string;
  type?: string;
}

export default function NewProjectPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await api.clients.list();
        setClients(data.data || []);
        setClientsError(null);
      } catch (error: any) {
        setClientsError(error.message || 'Failed to fetch clients');
        setClients([]);
      } finally {
        setClientsLoading(false);
      }
    };
    fetchClients();
  }, []);

  const [formData, setFormData] = useState({
    // Client Selection
    clientId: '',
    // Section 1: Identification
    name: '',
    projectId: '',
    sponsor: '',
    sector: SECTORS[0],
    country: 'MA',
    description: '',
    spvName: '',
    spvJurisdiction: '',
    // Section 2: Localisation
    region: '',
    city: '',
    siteAddress: '',
    coordinates: '',
    // Section 3: Parties Prenantes
    epcContractor: '',
    omOperator: '',
    offtaker: '',
    legalAdvisor: '',
    technicalAdvisor: '',
    insuranceAdvisor: '',
    // Section 4: Caractéristiques Techniques
    technology: '',
    capacity: '',
    capacityUnit: 'MW',
    availabilityTarget: '',
    designLife: '25',
    // Section 5: Calendrier
    constructionStart: '',
    constructionEnd: '',
    codDate: '',
    concessionEnd: '',
    constructionDuration: '',
    operationalDuration: '25',
    // Section 6: Financement
    totalCost: '',
    equityAmount: '',
    equityPercentage: '',
    debtAmount: '',
    financeRequired: '',
    interestRate: '',
    tenorYears: '',
    gracePeriod: '',
    dscr: '',
    llcr: '',
    leverageRatio: '',
    // Section 7: Revenus / Contrats
    ppaType: '',
    ppaDuration: '',
    ppaTariff: '',
    tariffEscalation: '',
    revenueModel: '',
    contractStatus: '',
    // Section 8: Construction
    epcContractType: '',
    epcAmount: '',
    epcGuarantees: '',
    completionGuarantee: false,
    liquidatedDamages: false,
    performanceBond: '',
    // Section 9: Exploitation
    omContractType: '',
    omDuration: '',
    omCostAnnual: '',
    majorMaintenanceReserve: '',
    insuranceCoverage: '',
    // Section 10: Juridique
    governingLaw: '',
    arbitration: '',
    securityPackage: '',
    stepInRights: false,
    assignmentRights: false,
    // Section 11: ESG / Climat
    esgCategory: '',
    environmentalImpact: '',
    socialImpact: '',
    climateRisk: '',
    carbonReduction: '',
    communityBenefits: '',
    // Section 12: Garanties
    collateralType: '',
    pledgeAssets: '',
    guaranteeAmount: '',
    reserveAccounts: '',
    insuranceAssignment: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId) {
      setErrorMessage('Veuillez sélectionner un client (ERR_VALID_001)');
      setFieldErrors({ clientId: 'Client est obligatoire' });
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});

    try {
      const { ok, data } = await apiFetchWithErrorHandling('/api/projects', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (!ok) {
        // Parse API error and create structured error
        const appError = parseApiError(data, '/api/projects');
        logAppError(appError);

        setErrorMessage(appError.userMessage);

        // Handle field-level errors
        if (data.errors && Array.isArray(data.errors)) {
          const errors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            errors[err.field] = err.message;
          });
          setFieldErrors(errors);
        }
        return;
      }

      setSuccessMessage('✅ Projet créé avec succès !');
      setTimeout(() => {
        window.location.href = '/projects';
      }, 2000);
    } catch (error: any) {
      let appError;

      if (error.message?.includes('Unauthorized')) {
        appError = createAppError('AUTH', 'EXPIRED_SESSION', {
          endpoint: '/api/projects',
          method: 'POST'
        });
      } else if (error.message?.includes('Failed to fetch')) {
        appError = createAppError('NETWORK', 'CONNECTION_ERROR', {
          endpoint: '/api/projects',
          method: 'POST'
        });
      } else {
        appError = createAppError('NETWORK', 'SERVER_ERROR', {
          endpoint: '/api/projects',
          method: 'POST',
          payload: formData
        });
      }

      logAppError(appError);
      setErrorMessage(appError.userMessage);
    } finally {
      setSubmitting(false);
    }
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
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection - REQUIRED */}
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <span className="text-red-400">*</span>
              <span>Sélectionner un Client</span>
            </h2>
            {clientsLoading && <p className="text-slate-400">Chargement des clients...</p>}
            {clientsError && <p className="text-red-400">{clientsError}</p>}
            {!clientsLoading && !clientsError && (
              <div>
                <label htmlFor="clientId" className="block text-sm font-semibold text-white mb-2">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  id="clientId"
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-1 transition-all ${
                    fieldErrors.clientId
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-600 focus:border-cyan-500 focus:ring-cyan-500'
                  }`}
                >
                  <option value="">-- Sélectionner un client --</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nom} {client.type ? `(${client.type})` : ''}
                    </option>
                  ))}
                </select>
                {fieldErrors.clientId && <p className="text-red-400 text-sm mt-1">{fieldErrors.clientId}</p>}
                {clients.length === 0 && !clientsLoading && (
                  <p className="text-yellow-400 text-sm mt-2">
                    ⚠️ Aucun client disponible. Veuillez <Link href="/clients/new" className="underline hover:text-yellow-300">créer un client</Link> d'abord.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Section 1: Identification */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">1. Identification du Projet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Nom du Projet" required><input type="text" name="name" placeholder="Ex: Parc Éolien Taourirt" value={formData.name} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" required /></FormField>
              <FormField label="Identifiant Projet"><input type="text" name="projectId" placeholder="PF-2026-001" value={formData.projectId} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Sponsor Principal" required><input type="text" name="sponsor" placeholder="Ex: ONEE" value={formData.sponsor} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" required /></FormField>
              <FormField label="Secteur" required>
                <select name="sector" value={formData.sector} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" required>
                  {SECTORS.map((sector) => (<option key={sector} value={sector}>{sector}</option>))}
                </select>
              </FormField>
              <FormField label="Pays">
                <select name="country" value={formData.country} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none">
                  {COUNTRIES.map((country) => (<option key={country.code} value={country.code}>{country.label}</option>))}
                </select>
              </FormField>
              <FormField label="Nom de la SPV"><input type="text" name="spvName" placeholder="Ex: Taourirt Wind Energy S.A." value={formData.spvName} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Juridiction SPV"><input type="text" name="spvJurisdiction" placeholder="Ex: Maroc - SA" value={formData.spvJurisdiction} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
            </div>
            <div className="mt-4">
              <FormField label="Description du Projet" required>
                <textarea name="description" placeholder="Décrivez le projet en détail..." value={formData.description} onChange={handleChange} rows={4} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none" required />
              </FormField>
            </div>
          </div>

          {/* Section 2: Localisation */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">2. Localisation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Région"><input type="text" name="region" placeholder="Ex: Drâa-Tafilalet" value={formData.region} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Ville"><input type="text" name="city" placeholder="Ex: Taourirt" value={formData.city} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Adresse du Site"><input type="text" name="siteAddress" placeholder="Adresse complète" value={formData.siteAddress} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Coordonnées GPS"><input type="text" name="coordinates" placeholder="Ex: 34.0181, -1.9998" value={formData.coordinates} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
            </div>
          </div>

          {/* Section 3: Parties Prenantes */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">3. Parties Prenantes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Constructeur EPC"><input type="text" name="epcContractor" placeholder="Ex: Siemens Gamesa" value={formData.epcContractor} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Opérateur O&M"><input type="text" name="omOperator" placeholder="Ex: Vestas Services" value={formData.omOperator} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Acheteur (Offtaker)"><input type="text" name="offtaker" placeholder="Ex: ONEE" value={formData.offtaker} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Conseiller Juridique"><input type="text" name="legalAdvisor" placeholder="Nom du cabinet" value={formData.legalAdvisor} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Conseiller Technique"><input type="text" name="technicalAdvisor" placeholder="Nom du cabinet" value={formData.technicalAdvisor} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Conseiller Assurance"><input type="text" name="insuranceAdvisor" placeholder="Nom du courtier" value={formData.insuranceAdvisor} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
            </div>
          </div>

          {/* Section 4: Caractéristiques Techniques */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">4. Caractéristiques Techniques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Technologie"><input type="text" name="technology" placeholder="Ex: Turbines Vestas V150" value={formData.technology} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Capacité Installée">
                <div className="flex gap-2">
                  <input type="number" name="capacity" placeholder="Ex: 300" value={formData.capacity} onChange={handleChange} className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" />
                  <select name="capacityUnit" value={formData.capacityUnit} onChange={handleChange} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none">
                    <option value="MW">MW</option><option value="MWp">MWp</option><option value="m3/j">m3/j</option><option value="km">km</option>
                  </select>
                </div>
              </FormField>
              <FormField label="Facteur de disponibilité cible (%)"><input type="number" name="availabilityTarget" placeholder="Ex: 97" value={formData.availabilityTarget} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Durée de vie nominale (ans)"><input type="number" name="designLife" placeholder="Ex: 25" value={formData.designLife} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
            </div>
          </div>

          {/* Section 5: Calendrier */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">5. Calendrier</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Début Construction"><input type="date" name="constructionStart" value={formData.constructionStart} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Fin Construction"><input type="date" name="constructionEnd" value={formData.constructionEnd} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Date COD (Mise en Service)"><input type="date" name="codDate" value={formData.codDate} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Fin de Concession"><input type="date" name="concessionEnd" value={formData.concessionEnd} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Durée Construction (mois)"><input type="number" name="constructionDuration" placeholder="Ex: 24" value={formData.constructionDuration} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Durée Exploitation (ans)"><input type="number" name="operationalDuration" placeholder="Ex: 25" value={formData.operationalDuration} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
            </div>
          </div>

          {/* Section 6: Financement */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">6. Structure Financière</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField label="Coût Total (MAD)" required><input type="number" name="totalCost" placeholder="500 000 000" value={formData.totalCost} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" required /></FormField>
              <FormField label="Fonds Propres (MAD)"><input type="number" name="equityAmount" placeholder="150 000 000" value={formData.equityAmount} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Equity (%)"><input type="number" name="equityPercentage" placeholder="30" value={formData.equityPercentage} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Dette Senior (MAD)"><input type="number" name="debtAmount" placeholder="350 000 000" value={formData.debtAmount} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Montant à Financer (MAD)" required><input type="number" name="financeRequired" placeholder="400 000 000" value={formData.financeRequired} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" required /></FormField>
              <FormField label="Taux d'Intérêt (%)"><input type="number" name="interestRate" placeholder="4.5" step="0.1" value={formData.interestRate} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Maturité (ans)"><input type="number" name="tenorYears" placeholder="18" value={formData.tenorYears} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Période de Grâce (mois)"><input type="number" name="gracePeriod" placeholder="24" value={formData.gracePeriod} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="DSCR Minimum"><input type="number" name="dscr" placeholder="1.30" step="0.01" value={formData.dscr} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="LLCR"><input type="number" name="llcr" placeholder="1.20" step="0.01" value={formData.llcr} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Ratio Leverage (%)"><input type="number" name="leverageRatio" placeholder="70" value={formData.leverageRatio} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
            </div>
          </div>

          {/* Section 7: Revenus / Contrats */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">7. Revenus & Contrats</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Type de PPA/Contrat">
                <select name="ppaType" value={formData.ppaType} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none">
                  <option value="">-- Sélectionner --</option><option value="take_or_pay">Take-or-Pay</option><option value="merchant">Merchant</option><option value="feed_in_tariff">Feed-in Tariff</option><option value="concession">Concession</option><option value="availability">Availability-based</option>
                </select>
              </FormField>
              <FormField label="Durée du Contrat (ans)"><input type="number" name="ppaDuration" placeholder="20" value={formData.ppaDuration} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Tarif (MAD/kWh ou MAD/unité)"><input type="number" name="ppaTariff" placeholder="0.85" step="0.01" value={formData.ppaTariff} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Escalation Tarifaire (%/an)"><input type="number" name="tariffEscalation" placeholder="2" step="0.1" value={formData.tariffEscalation} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Statut du Contrat">
                <select name="contractStatus" value={formData.contractStatus} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none">
                  <option value="">-- Sélectionner --</option><option value="signed">Signé</option><option value="negotiation">En négociation</option><option value="draft">Brouillon</option><option value="none">Aucun</option>
                </select>
              </FormField>
            </div>
          </div>

          {/* Section 8: Construction */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">8. Construction</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Type de Contrat EPC">
                <select name="epcContractType" value={formData.epcContractType} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none">
                  <option value="">-- Sélectionner --</option><option value="lump_sum_turnkey">Lump Sum Turnkey</option><option value="cost_plus">Cost Plus</option><option value="target_price">Target Price</option><option value="split_epc">Split EPC</option>
                </select>
              </FormField>
              <FormField label="Montant EPC (MAD)"><input type="number" name="epcAmount" placeholder="350 000 000" value={formData.epcAmount} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Garanties EPC"><input type="text" name="epcGuarantees" placeholder="Performance, Delay LD..." value={formData.epcGuarantees} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Performance Bond (%)"><input type="number" name="performanceBond" placeholder="10" value={formData.performanceBond} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-white cursor-pointer"><input type="checkbox" name="completionGuarantee" checked={formData.completionGuarantee as boolean} onChange={(e) => setFormData(prev => ({...prev, completionGuarantee: e.target.checked}))} className="rounded" /> Garantie d'achèvement</label>
                <label className="flex items-center gap-2 text-white cursor-pointer"><input type="checkbox" name="liquidatedDamages" checked={formData.liquidatedDamages as boolean} onChange={(e) => setFormData(prev => ({...prev, liquidatedDamages: e.target.checked}))} className="rounded" /> Pénalités de retard</label>
              </div>
            </div>
          </div>

          {/* Section 9: Exploitation */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">9. Exploitation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Type de Contrat O&M">
                <select name="omContractType" value={formData.omContractType} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none">
                  <option value="">-- Sélectionner --</option><option value="full_wrap">Full Wrap</option><option value="partial">Partiel</option><option value="in_house">In-House</option>
                </select>
              </FormField>
              <FormField label="Durée O&M (ans)"><input type="number" name="omDuration" placeholder="15" value={formData.omDuration} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Coût O&M Annuel (MAD)"><input type="number" name="omCostAnnual" placeholder="15 000 000" value={formData.omCostAnnual} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Réserve Maintenance Majeure (MAD)"><input type="number" name="majorMaintenanceReserve" placeholder="5 000 000" value={formData.majorMaintenanceReserve} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Couverture Assurance"><input type="text" name="insuranceCoverage" placeholder="All Risk, Business Interruption..." value={formData.insuranceCoverage} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
            </div>
          </div>

          {/* Section 10: Juridique */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">10. Cadre Juridique</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Droit Applicable"><input type="text" name="governingLaw" placeholder="Ex: Droit marocain" value={formData.governingLaw} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Arbitrage"><input type="text" name="arbitration" placeholder="Ex: ICC Paris" value={formData.arbitration} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Package Sûretés"><input type="text" name="securityPackage" placeholder="Nantissement, hypothèque..." value={formData.securityPackage} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-white cursor-pointer"><input type="checkbox" name="stepInRights" checked={formData.stepInRights as boolean} onChange={(e) => setFormData(prev => ({...prev, stepInRights: e.target.checked}))} className="rounded" /> Step-in Rights</label>
                <label className="flex items-center gap-2 text-white cursor-pointer"><input type="checkbox" name="assignmentRights" checked={formData.assignmentRights as boolean} onChange={(e) => setFormData(prev => ({...prev, assignmentRights: e.target.checked}))} className="rounded" /> Droits de cession</label>
              </div>
            </div>
          </div>

          {/* Section 11: ESG / Climat */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">11. ESG & Climat</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Catégorie ESG (IFC)">
                <select name="esgCategory" value={formData.esgCategory} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none">
                  <option value="">-- Sélectionner --</option><option value="A">A - Impact élevé</option><option value="B">B - Impact modéré</option><option value="C">C - Impact faible</option><option value="FI">FI - Intermédiation financière</option>
                </select>
              </FormField>
              <FormField label="Impact Environnemental">
                <select name="environmentalImpact" value={formData.environmentalImpact} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none">
                  <option value="">-- Sélectionner --</option><option value="positive">Positif</option><option value="neutral">Neutre</option><option value="negative_managed">Négatif géré</option><option value="negative_unmanaged">Négatif non géré</option>
                </select>
              </FormField>
              <FormField label="Impact Social">
                <select name="socialImpact" value={formData.socialImpact} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none">
                  <option value="">-- Sélectionner --</option><option value="positive">Positif</option><option value="neutral">Neutre</option><option value="negative_managed">Négatif géré</option>
                </select>
              </FormField>
              <FormField label="Risque Climatique">
                <select name="climateRisk" value={formData.climateRisk} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none">
                  <option value="">-- Sélectionner --</option><option value="low">Faible</option><option value="medium">Modéré</option><option value="high">Élevé</option>
                </select>
              </FormField>
              <FormField label="Réduction Carbone (tCO2/an)"><input type="number" name="carbonReduction" placeholder="50 000" value={formData.carbonReduction} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Bénéfices Communautaires"><input type="text" name="communityBenefits" placeholder="Ex: 500 emplois, infrastructure locale..." value={formData.communityBenefits} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
            </div>
          </div>

          {/* Section 12: Garanties */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700">12. Garanties & Sûretés</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Type de Garantie">
                <select name="collateralType" value={formData.collateralType} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none">
                  <option value="">-- Sélectionner --</option><option value="asset_pledge">Nantissement d'actifs</option><option value="share_pledge">Nantissement de parts</option><option value="mortgage">Hypothèque</option><option value="assignment">Cession de créances</option><option value="combined">Combiné</option>
                </select>
              </FormField>
              <FormField label="Actifs Nantis"><input type="text" name="pledgeAssets" placeholder="Équipements, terrains, comptes..." value={formData.pledgeAssets} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Montant Garanties (MAD)"><input type="number" name="guaranteeAmount" placeholder="400 000 000" value={formData.guaranteeAmount} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <FormField label="Comptes de Réserve"><input type="text" name="reserveAccounts" placeholder="DSRA, MRA, Insurance..." value={formData.reserveAccounts} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" /></FormField>
              <label className="flex items-center gap-2 text-white cursor-pointer"><input type="checkbox" name="insuranceAssignment" checked={formData.insuranceAssignment as boolean} onChange={(e) => setFormData(prev => ({...prev, insuranceAssignment: e.target.checked}))} className="rounded" /> Cession des polices d'assurance</label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-slate-700">
            <button
              type="submit"
              disabled={submitting || clientsLoading || clients.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '⏳ Création en cours...' : 'Créer le Projet'}
            </button>
            <Link
              href="/projects"
              className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-4 py-2 rounded-lg transition-all text-center"
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
