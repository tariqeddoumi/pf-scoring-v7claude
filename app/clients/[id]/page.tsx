'use client';

import Link from 'next/link';
import { ArrowLeft, Edit2, MapPin, Mail, Phone, Globe, Users, Briefcase, BarChart3, FileText, Clock, AlertCircle, Shield } from 'lucide-react';

// Mock client data - COMPLET selon spécifications
const MOCK_CLIENT = {
  // === IDENTITÉ ET INFORMATIONS DE BASE ===
  id: '1',
  name: 'ONEE (Office National de l\'Électricité)',
  legalName: 'Office National de l\'Électricité et de l\'Eau Potable',
  tradeName: 'ONEE',

  // Identifiants
  clientId: 'CLI-0001',
  registrationNumber: 'MA 000000001234',
  icNumber: 'MA 100000001234567',
  taxNumber: 'FR 12 345 678 901',
  bankInternalId: 'INT-ONEE-2025',

  // Informations de base
  type: 'Entreprise Publique',
  legalForm: 'Établissement Public',
  sector: 'Énergie',
  subSector: 'Production, Transport & Distribution Électricité',
  country: 'Maroc',
  city: 'Casablanca',
  address: 'Avenue Al Fadila, Casablanca, Maroc',
  postalCode: '20000',
  coordinates: { lat: 33.5731, lng: -7.5898 },

  // Informations organisationnelles
  businessCenter: 'Centre d\'Affaires Énergie & Infrastructure',
  accountManager: 'Ahmed Benali',
  accountManagerPhone: '+212 537 71 06 06',
  customerSegment: 'Grands Corporates - Secteur Public',
  foundingYear: 1963,
  numberOfEmployees: 15000,

  // Données Contact
  email: 'contact@onee.ma',
  phone: '+212 537 71 06 06',
  website: 'www.onee.ma',

  // === STATUT ET RELATION BANCAIRE ===
  bankingStatus: 'Client Actif',
  relationshipDuration: '35 ans',
  relationshipStartDate: '1988-01-15',
  bankingProducts: [
    'Financement Projet',
    'Facilités de Trésorerie',
    'Garanties',
    'Services de Change',
    'Crédits à Long Terme'
  ],
  totalBankingExposure: '12,500,000,000 MAD',
  incidents: {
    hasIncidents: false,
    description: 'Aucun incident notoire'
  },
  watchlistStatus: 'N/A - Excellent Standing',

  // === DONNÉES FINANCIÈRES ===
  capitalAmount: '2,500,000,000 MAD',
  lastAnnualRevenue: '45,000,000,000 MAD',
  financialRating: 'AA',
  liquidityRatio: 1.45,
  leverageRatio: 0.65,
  debt2EquityRatio: 0.70,
  interestCoverage: 4.25,

  // === GOUVERNANCE ET MANAGEMENT ===
  managementQuality: 'Très Bonne',
  reputation: 'Excellente - Reconnu nationalement',
  sectorExperience: 'Plus de 60 ans d\'expérience',
  projectFinanceExperience: 'Expérience confirmée en PF (EPC, PPA, O&M)',
  shareholdingStability: 'Très Stable - Capital 100% public',
  governanceQuality: 'Conforme aux meilleures pratiques',
  complianceLevel: 'Conforme IFC, EBRD, Basel',

  // === CONSEIL D'ADMINISTRATION ===
  boardMembers: [
    { name: 'Mohamed El Kettani', position: 'Président du Conseil d\'Administration', country: 'Maroc' },
    { name: 'Abdellatif Zaghnoun', position: 'Directeur Général', country: 'Maroc' },
    { name: 'Fatima El Fassi', position: 'Administrateur - Représentante État', country: 'Maroc' },
  ],
  legalRepresentative: 'Abdellatif Zaghnoun',

  // === GROUPE D'AFFAIRES ET ENTITÉS LIÉES ===
  businessGroup: {
    name: 'Groupe Énergie Maroc',
    parentCompany: 'Ministère de l\'Énergie - Société Mère',
    subsidiaries: [
      { name: 'ONEE - Distribution Maroc', role: 'Distribution d\'électricité' },
      { name: 'ONEE - Production Énergie', role: 'Production d\'électricité' },
      { name: 'ONEE - Services Techniques', role: 'Services et maintenance' },
    ]
  },

  sponsors: [
    { name: 'État du Maroc', role: 'Actionnaire Principal', type: 'Public' },
  ],

  coSponsors: [],

  holdings: {
    name: 'Ministère de l\'Énergie',
    country: 'Maroc',
    ownership: '100%'
  },

  guarantors: [
    { name: 'État du Maroc', type: 'Garantie implicite', level: 'Maximum' },
  ],

  // === STRUCTURE ACTIONNARIALE ===
  shareholding: {
    structure: 'Société Publique - Structure Stable',
    shareholders: [
      {
        name: 'État du Maroc',
        percentage: 100,
        type: 'Public',
        status: 'Propriétaire',
        country: 'Maroc'
      },
    ],
  },

  shareholderBankStatus: [
    {
      name: 'État du Maroc',
      isBankClient: true,
      clientSince: '1963',
      relationshipType: 'Client Principal',
      bankingProducts: ['Financement Projet', 'Garanties']
    },
  ],

  // === KYC ET CONFORMITÉ ===
  kycStatus: 'Complète et À Jour',
  kycLastUpdate: '2026-03-15',
  complianceStatus: 'Conforme',
  sanctionsCheckStatus: 'Négatif',
  pepStatus: 'N/A - Entité Publique',
  amlStatus: 'Approuvé',

  // === DOCUMENTS ASSOCIÉS ===
  documents: [
    { name: 'Statuts Sociaux', type: 'Statuts', uploadDate: '2025-06-01', version: 'v2.0' },
    { name: 'Organigramme Groupe 2026', type: 'Organigramme', uploadDate: '2026-01-15', version: 'v3.1' },
    { name: 'États Financiers 2025', type: 'États Financiers', uploadDate: '2026-03-31', version: 'Audité' },
    { name: 'Rapports d\'Audit 2025', type: 'Audit', uploadDate: '2026-04-02', version: 'Final' },
    { name: 'Rating Externe Moody\'s', type: 'Rating Externe', uploadDate: '2025-09-15', version: 'A1' },
    { name: 'Memo Analytique Interne', type: 'Memo', uploadDate: '2026-02-28', version: 'v1.5' },
  ],

  // === COMMENTAIRES LIBRES ===
  comments: 'Contrepartie de très bonne qualité avec exposition systémique importante au Maroc. Excellent partenaire pour projets en secteur énergie.',

  // === HISTORIQUE / AUDIT ===
  auditHistory: [
    {
      date: '2026-04-03',
      user: 'Ahmed Benali',
      action: 'Modification',
      field: 'Statut Relation Bancaire',
      oldValue: 'Client Actif',
      newValue: 'Client Actif',
      reason: 'Mise à jour annuelle'
    },
    {
      date: '2026-03-15',
      user: 'Fatima Zohra',
      action: 'Création Fiche',
      field: 'Client ONEE',
      oldValue: 'N/A',
      newValue: 'Créé',
      reason: 'Nouvelle signalétique'
    },
  ],

  // === PROJETS ===
  projects: [
    {
      id: 'p1',
      name: 'Parc Éolien Taourirt',
      status: 'En cours',
      amount: '500,000,000 MAD',
      rating: 'A',
    },
    {
      id: 'p2',
      name: 'Centrale Solaire Ouarzazate',
      status: 'Approuvé',
      amount: '800,000,000 MAD',
      rating: 'AA',
    },
  ],

  // === ÉVALUATIONS ===
  evaluations: [
    {
      id: 'e1',
      projectName: 'Parc Éolien Taourirt',
      date: '2026-03-15',
      rating: 'A',
      score: 8.08,
      status: 'Complétée',
    },
    {
      id: 'e2',
      projectName: 'Centrale Solaire Ouarzazate',
      date: '2026-02-20',
      rating: 'AA',
      score: 8.95,
      status: 'Complétée',
    },
  ],
};

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8">
      {/* === HEADER === */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/clients"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{MOCK_CLIENT.name}</h1>
            <p className="text-slate-400 mt-1 text-sm">{MOCK_CLIENT.legalName}</p>
          </div>
        </div>
        <button className="inline-flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-all">
          <Edit2 size={20} />
          <span>Modifier</span>
        </button>
      </div>

      {/* === INFO CARDS === */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Globe, label: 'Forme juridique', value: MOCK_CLIENT.legalForm },
          { icon: Briefcase, label: 'Secteur', value: MOCK_CLIENT.sector },
          { icon: BarChart3, label: 'Rating', value: MOCK_CLIENT.financialRating, highlight: true },
          { icon: Users, label: 'Statut Banque', value: MOCK_CLIENT.bankingStatus, statusBadge: true },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="rounded-lg bg-slate-800 border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">{item.label}</span>
                <Icon size={18} className="text-slate-500" />
              </div>
              {item.statusBadge ? (
                <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                  {item.value}
                </span>
              ) : item.highlight ? (
                <p className="text-2xl font-bold text-cyan-400">{item.value}</p>
              ) : (
                <p className="text-lg font-semibold text-white">{item.value}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* === BLOC 1: IDENTITÉ ET INFORMATIONS ADMINISTRATIVES === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Briefcase size={24} />
          <span>Identité et Informations Administratives</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Identifiants</h3>
            <InfoRow label="Radical Client" value={MOCK_CLIENT.clientId} />
            <InfoRow label="N° Enregistrement" value={MOCK_CLIENT.registrationNumber} />
            <InfoRow label="N° ICE" value={MOCK_CLIENT.icNumber} />
            <InfoRow label="N° Taxe" value={MOCK_CLIENT.taxNumber} />
            <InfoRow label="ID Interne Banque" value={MOCK_CLIENT.bankInternalId} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Informations Générales</h3>
            <InfoRow label="Forme Juridique" value={MOCK_CLIENT.legalForm} />
            <InfoRow label="Date Création" value={MOCK_CLIENT.foundingYear.toString()} />
            <InfoRow label="Représentant Légal" value={MOCK_CLIENT.legalRepresentative} />
            <InfoRow label="Nombre d'Employés" value={MOCK_CLIENT.numberOfEmployees.toLocaleString()} />
            <InfoRow label="Capital Social" value={MOCK_CLIENT.capitalAmount} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Coordonnées</h3>
            <div>
              <label className="text-sm text-slate-400">Email</label>
              <a href={`mailto:${MOCK_CLIENT.email}`} className="flex items-center space-x-2 text-white mt-1 hover:text-cyan-400">
                <Mail size={16} className="text-cyan-500" />
                <span>{MOCK_CLIENT.email}</span>
              </a>
            </div>
            <div>
              <label className="text-sm text-slate-400">Téléphone</label>
              <a href={`tel:${MOCK_CLIENT.phone}`} className="flex items-center space-x-2 text-white mt-1 hover:text-cyan-400">
                <Phone size={16} className="text-cyan-500" />
                <span>{MOCK_CLIENT.phone}</span>
              </a>
            </div>
            <div>
              <label className="text-sm text-slate-400">Site Web</label>
              <a href={`https://${MOCK_CLIENT.website}`} className="flex items-center space-x-2 text-white mt-1 hover:text-cyan-400">
                <Globe size={16} className="text-cyan-500" />
                <span>{MOCK_CLIENT.website}</span>
              </a>
            </div>
            <InfoRow label="Adresse" value={`${MOCK_CLIENT.address}, ${MOCK_CLIENT.postalCode}`} />
          </div>
        </div>
      </div>

      {/* === BLOC 2: INFORMATIONS ORGANISATIONNELLES === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Users size={24} />
          <span>Informations Organisationnelles</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Classification</h3>
            <InfoRow label="Secteur" value={MOCK_CLIENT.sector} />
            <InfoRow label="Sous-Secteur" value={MOCK_CLIENT.subSector} />
            <InfoRow label="Segment de Clientèle" value={MOCK_CLIENT.customerSegment} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Organisation Bancaire</h3>
            <InfoRow label="Centre d'Affaires" value={MOCK_CLIENT.businessCenter} />
            <InfoRow label="Chargé d'Affaires" value={MOCK_CLIENT.accountManager} />
            <InfoRow label="Téléphone CA" value={MOCK_CLIENT.accountManagerPhone} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Localisation</h3>
            <InfoRow label="Pays" value={MOCK_CLIENT.country} />
            <InfoRow label="Ville" value={MOCK_CLIENT.city} />
            <InfoRow label="Coordonnées" value={`${MOCK_CLIENT.coordinates.lat}, ${MOCK_CLIENT.coordinates.lng}`} />
          </div>
        </div>
      </div>

      {/* === BLOC 3: RELATION BANCAIRE === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Shield size={24} />
          <span>Relation Bancaire</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Statut et Ancienneté</h3>
            <InfoRow label="Statut Relation" value={MOCK_CLIENT.bankingStatus} />
            <InfoRow label="Durée de Relation" value={MOCK_CLIENT.relationshipDuration} />
            <InfoRow label="Date Début Relation" value={MOCK_CLIENT.relationshipStartDate} />
            <InfoRow label="Exposition Globale" value={MOCK_CLIENT.totalBankingExposure} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Produits et Incidents</h3>
            <div>
              <label className="text-sm text-slate-400 block mb-2">Produits Bancaires</label>
              <div className="space-y-2">
                {MOCK_CLIENT.bankingProducts.map((product, i) => (
                  <div key={i} className="bg-slate-700 rounded-lg px-3 py-2 text-white text-sm">
                    {product}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400">Statut Incidents</label>
              <p className={`text-white mt-1 font-semibold ${MOCK_CLIENT.incidents.hasIncidents ? 'text-red-400' : 'text-green-400'}`}>
                {MOCK_CLIENT.incidents.description}
              </p>
            </div>
            <InfoRow label="Watchlist" value={MOCK_CLIENT.watchlistStatus} />
          </div>
        </div>
      </div>

      {/* === BLOC 4: GOUVERNANCE ET MANAGEMENT === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <BarChart3 size={24} />
          <span>Gouvernance et Management</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Qualité et Expérience</h3>
            <InfoRow label="Qualité de Management" value={MOCK_CLIENT.managementQuality} />
            <InfoRow label="Réputation" value={MOCK_CLIENT.reputation} />
            <InfoRow label="Expérience Sectorielle" value={MOCK_CLIENT.sectorExperience} />
            <InfoRow label="Expérience Project Finance" value={MOCK_CLIENT.projectFinanceExperience} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Solidité et Conformité</h3>
            <InfoRow label="Solidité Actionnariale" value={MOCK_CLIENT.shareholdingStability} />
            <InfoRow label="Qualité Gouvernance" value={MOCK_CLIENT.governanceQuality} />
            <InfoRow label="Niveau de Conformité" value={MOCK_CLIENT.complianceLevel} />
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Conseil d'Administration</h3>
          <div className="space-y-3">
            {MOCK_CLIENT.boardMembers.map((member, i) => (
              <div key={i} className="bg-slate-700 rounded-lg p-4">
                <p className="font-semibold text-white">{member.name}</p>
                <p className="text-sm text-slate-400">{member.position}</p>
                <p className="text-sm text-slate-400 mt-1">Pays: {member.country}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === BLOC 5: ENTITÉS LIÉES === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Users size={24} />
          <span>Entités Liées et Structure</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sponsors */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Sponsor Principal</h3>
            <div className="space-y-3">
              {MOCK_CLIENT.sponsors.map((sponsor, i) => (
                <div key={i} className="bg-slate-700 rounded-lg p-4">
                  <p className="font-semibold text-white">{sponsor.name}</p>
                  <p className="text-sm text-slate-400 mt-1">Rôle: {sponsor.role}</p>
                  <p className="text-sm text-slate-400">Type: {sponsor.type}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Holding */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Société Mère / Holding</h3>
            <div className="bg-slate-700 rounded-lg p-4">
              <p className="font-semibold text-white">{MOCK_CLIENT.holdings.name}</p>
              <p className="text-sm text-slate-400 mt-1">Pays: {MOCK_CLIENT.holdings.country}</p>
              <p className="text-sm text-slate-400">Ownership: {MOCK_CLIENT.holdings.ownership}</p>
            </div>
          </div>
        </div>

        {/* Filiales */}
        <div className="mt-8 pt-8 border-t border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Filiales</h3>
          <div className="space-y-3">
            {MOCK_CLIENT.businessGroup.subsidiaries.map((subsidiary, i) => (
              <div key={i} className="bg-slate-700 rounded-lg p-4">
                <p className="font-semibold text-white">{subsidiary.name}</p>
                <p className="text-sm text-slate-400 mt-1">{subsidiary.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Garants */}
        {MOCK_CLIENT.guarantors.length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Garants / Support Providers</h3>
            <div className="space-y-3">
              {MOCK_CLIENT.guarantors.map((guarantor, i) => (
                <div key={i} className="bg-slate-700 rounded-lg p-4">
                  <p className="font-semibold text-white">{guarantor.name}</p>
                  <p className="text-sm text-slate-400 mt-1">Type: {guarantor.type}</p>
                  <p className="text-sm text-slate-400">Niveau: {guarantor.level}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* === BLOC 6: STRUCTURE ACTIONNARIALE === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <BarChart3 size={24} />
          <span>Structure Actionnariale</span>
        </h2>

        <InfoRow label="Type de Structure" value={MOCK_CLIENT.shareholding.structure} />

        <div className="mt-6">
          <label className="text-sm text-slate-400 block mb-3">Actionnaires</label>
          <div className="space-y-3">
            {MOCK_CLIENT.shareholding.shareholders.map((shareholder, i) => (
              <div key={i} className="bg-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-white">{shareholder.name}</p>
                  <span className="text-cyan-400 font-bold text-lg">{shareholder.percentage}%</span>
                </div>
                <div className="flex gap-2 text-sm mt-2">
                  <span className="bg-blue-500/20 text-blue-400 rounded-full px-2 py-1">{shareholder.type}</span>
                  <span className="bg-green-500/20 text-green-400 rounded-full px-2 py-1">{shareholder.status}</span>
                </div>
                <p className="text-sm text-slate-400 mt-2">Pays: {shareholder.country}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Statut des Actionnaires à la Banque</h3>
          <div className="space-y-3">
            {MOCK_CLIENT.shareholderBankStatus.map((shareholder, i) => (
              <div key={i} className="bg-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <p className="font-semibold text-white">{shareholder.name}</p>
                  {shareholder.isBankClient && (
                    <span className="bg-green-500/20 text-green-400 rounded-full px-3 py-1 text-sm font-semibold">
                      Client de la banque
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-slate-300 text-sm">
                  <p>Type de relation: <span className="text-white font-semibold">{shareholder.relationshipType}</span></p>
                  {shareholder.isBankClient && (
                    <p>Client depuis: <span className="text-white font-semibold">{shareholder.clientSince}</span></p>
                  )}
                  {shareholder.bankingProducts && (
                    <div className="mt-2">
                      <p className="text-slate-400">Produits:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {shareholder.bankingProducts.map((prod, j) => (
                          <span key={j} className="text-xs bg-slate-600 px-2 py-1 rounded text-slate-200">{prod}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === BLOC 7: KYC ET CONFORMITÉ === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Shield size={24} />
          <span>KYC et Conformité</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KYCCard label="Statut KYC" value={MOCK_CLIENT.kycStatus} status="approved" />
          <KYCCard label="Statut Conformité" value={MOCK_CLIENT.complianceStatus} status="approved" />
          <KYCCard label="Vérification Sanctions" value={MOCK_CLIENT.sanctionsCheckStatus} status="clear" />
          <KYCCard label="Statut PEP" value={MOCK_CLIENT.pepStatus} status="clear" />
          <KYCCard label="Statut AML" value={MOCK_CLIENT.amlStatus} status="approved" />
          <KYCCard label="Mise à jour KYC" value={MOCK_CLIENT.kycLastUpdate} status="info" />
        </div>
      </div>

      {/* === BLOC 8: DOCUMENTS ASSOCIÉS === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <FileText size={24} />
          <span>Documents Associés</span>
        </h2>

        <div className="space-y-3">
          {MOCK_CLIENT.documents.map((doc, i) => (
            <div key={i} className="bg-slate-700 rounded-lg p-4 hover:bg-slate-650 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3 flex-1">
                  <FileText size={18} className="text-cyan-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">{doc.name}</p>
                    <p className="text-sm text-slate-400 mt-1">Type: {doc.type} | Version: {doc.version}</p>
                    <p className="text-xs text-slate-500 mt-1">Uploadé le: {doc.uploadDate}</p>
                  </div>
                </div>
                <a href="#" className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold whitespace-nowrap ml-4">
                  Télécharger
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === BLOC 9: COMMENTAIRES LIBRES === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Commentaires Libres</h2>
        <div className="bg-slate-700 rounded-lg p-4">
          <p className="text-white whitespace-pre-line">{MOCK_CLIENT.comments}</p>
        </div>
      </div>

      {/* === BLOC 10: HISTORIQUE / AUDIT === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Clock size={24} />
          <span>Historique des Modifications</span>
        </h2>

        <div className="space-y-3">
          {MOCK_CLIENT.auditHistory.map((entry, i) => (
            <div key={i} className="bg-slate-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-white">{entry.action}</p>
                <span className="text-slate-400 text-sm">{entry.date}</span>
              </div>
              <p className="text-sm text-slate-400">Par: {entry.user}</p>
              <p className="text-sm text-slate-400">Champ: {entry.field}</p>
              {entry.oldValue !== 'N/A' && (
                <div className="mt-2 text-sm">
                  <span className="text-slate-400">Ancien: </span>
                  <span className="text-red-400">{entry.oldValue}</span>
                  <span className="text-slate-400 mx-2">→</span>
                  <span className="text-green-400">{entry.newValue}</span>
                </div>
              )}
              {entry.reason && (
                <p className="text-sm text-slate-400 mt-1">Motif: {entry.reason}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* === PROJETS === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Projets ({MOCK_CLIENT.projects.length})</h2>
          <Link
            href={`/projects/new?clientId=${MOCK_CLIENT.id}`}
            className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
          >
            Ajouter un projet
          </Link>
        </div>

        <div className="space-y-3">
          {MOCK_CLIENT.projects.map((project) => (
            <div key={project.id} className="bg-slate-700 rounded-lg p-4 hover:bg-slate-650 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-white">{project.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">Montant: {project.amount}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    project.status === 'En cours'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {project.status}
                  </span>
                  <span className="text-cyan-400 font-bold">{project.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === ÉVALUATIONS === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Évaluations Récentes</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Projet</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Score</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {MOCK_CLIENT.evaluations.map((evalItem) => (
                <tr key={evalItem.id} className="hover:bg-slate-700 transition-colors">
                  <td className="px-4 py-3 text-white font-semibold">{evalItem.projectName}</td>
                  <td className="px-4 py-3 text-slate-400">{evalItem.date}</td>
                  <td className="px-4 py-3 text-cyan-400 font-bold">{evalItem.rating}</td>
                  <td className="px-4 py-3 text-white font-semibold">{evalItem.score}</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                      {evalItem.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/evaluations/${evalItem.id}`}
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <label className="text-sm text-slate-400">{label}</label>
      <p className="text-white mt-1 font-semibold">{value}</p>
    </div>
  );
}

function KYCCard({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: 'approved' | 'clear' | 'info';
}) {
  const statusColors = {
    approved: 'bg-green-500/10 text-green-400',
    clear: 'bg-blue-500/10 text-blue-400',
    info: 'bg-slate-600 text-slate-300',
  };

  return (
    <div className="bg-slate-700 rounded-lg p-4">
      <p className="text-sm text-slate-400 mb-2">{label}</p>
      <p className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${statusColors[status]}`}>
        {value}
      </p>
    </div>
  );
}
