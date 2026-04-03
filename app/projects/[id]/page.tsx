'use client';

import Link from 'next/link';
import { ArrowLeft, Edit2, MapPin, Briefcase, BarChart3, Users, FileText, AlertCircle, Shield, TrendingUp } from 'lucide-react';

// Mock project data - COMPLET selon spécifications (12 sous-blocs)
const MOCK_PROJECT = {
  // === SOUS-BLOC 1: IDENTIFICATION ===
  id: 'p1',
  projectCode: 'PRJ-2026-0001',
  name: 'Parc Éolien Taourirt',
  bankInternalCode: 'INT-EOLIEN-001',
  creditFileRef: 'CF-2026-450',
  committeeRef: 'COM-Q1-2026',
  clientRef: 'CLI-0001',

  description: 'Développement d\'un parc éolien de 100 MW avec 25 turbines de 4 MW chacune en région du Drâa-Tafilalet.',
  sponsor: 'ONEE',
  bankEntity: 'Direction Project Finance',
  analyst: 'Ahmed Ben Selhami',
  businessCenter: 'Centre d\'Affaires Énergie & Infrastructure',

  // === SOUS-BLOC 2: LOCALISATION ===
  country: 'Maroc',
  region: 'Drâa-Tafilalet',
  city: 'Taourirt',
  address: 'Zone de Taourirt, province de Tafilalet',
  coordinates: { lat: 32.5243, lng: -4.6178 },
  climateZone: 'Zone aride - Exposition élevée aux vents',
  geopoliticalRisk: 'Risque faible - Maroc stable',

  // === SOUS-BLOC 3: PARTIES PRENANTES ===
  sponsor_info: {
    name: 'ONEE',
    role: 'Sponsor Principal',
    country: 'Maroc',
    quality: 'Excellente - Entité publique stable',
    bankRelation: 'Client historique - 60+ ans',
  },
  coSponsors: [],
  epcContractor: {
    name: 'Siemens Gamesa Energy',
    country: 'Espagne',
    experience: 'Très confirmée - 50+ projets similaires',
    rating: 'A+',
  },
  omContractor: {
    name: 'Nordex O&M Services',
    country: 'Allemagne',
    experience: 'Expérience confirmée en Afrique',
    rating: 'A',
  },
  offTaker: {
    name: 'ONEE Distribution',
    role: 'Acheteur Principal',
    type: 'PPA 25 ans - Take-or-pay',
    rating: 'AAA',
  },
  technicalAdvisor: {
    name: 'DNV GL',
    country: 'Norvège',
    expertise: 'Expert indépendant certifié',
  },
  legalAdvisor: {
    name: 'King & Spalding',
    country: 'USA/International',
    expertise: 'Spécialiste PF en Afrique du Nord',
  },
  bankParticipants: ['Banque Al-Maghrib', 'BMCI', 'Attijariwafa Bank'],
  guarantor: {
    name: 'État du Maroc (garantie implicite)',
    type: 'Garantie souveraine',
    level: 'Maximum',
  },

  // === SOUS-BLOC 4: CARACTÉRISTIQUES TECHNIQUES ===
  technology: 'Turbines Éoliennes - 25x 4MW',
  installedCapacity: '100 MW',
  technologyMaturity: 'Mature - Technologie standard',
  technicalRisk: 'Faible - Technologie éprouvée',
  interconnections: 'Connexion au réseau ONEE via ligne 225 kV',
  executionComplexity: 'Moyenne - Terrain accessible',
  inputsAvailability: 'Vent: Resource très bon (7-8 m/s)',
  standardization: 'Oui - Turbines standardisées Siemens Gamesa',
  importedTechnology: 'Oui - Technologie importée d\'Espagne',

  // === SOUS-BLOC 5: CALENDRIER ===
  financialClose: '2026-06-30',
  constructionStart: '2026-07-15',
  commissioning: '2028-03-31',
  commercialOp: '2028-04-01',
  concessionDuration: '25 ans',
  offTakeDuration: '25 ans (PPA)',
  omDuration: '25 ans',
  debtMaturity: '15 ans',
  gracePeriodsMonths: '24 mois',
  keyMilestones: [
    { date: '2026-06-30', milestone: 'Financial Close' },
    { date: '2026-09-30', milestone: 'Turbine Orders Locked' },
    { date: '2027-06-30', milestone: 'Foundation Works Completed' },
    { date: '2028-01-31', milestone: 'All Turbines Installed' },
    { date: '2028-03-31', milestone: 'Commissioning Complete' },
  ],

  // === SOUS-BLOC 6: FINANCEMENT ===
  totalCost: '500,000,000 MAD',
  equity: '100,000,000 MAD (20%)',
  quasiEquity: '0 MAD',
  seniorDebt: '350,000,000 MAD (70%)',
  subordinatedDebt: '50,000,000 MAD (10%)',
  subsidies: '0 MAD',
  externalFinancing: '0 MAD',
  gearing: '80% (Debt/Total Cost)',
  dscr_target: '1.35x',
  llcr_target: '2.10x',
  debtTerm: '15 ans',
  amortizationProfile: 'Bullet avec remboursement principal en année 15',
  interestRate: 'SOFR + 350 bps',
  rateHedging: 'Interest Rate Swap 15 ans',
  dsrAccount: '6 mois OPEX',

  // === SOUS-BLOC 7: REVENUS / CONTRATS ===
  revenueType: 'PPA - Contrat de vente d\'électricité',
  revenueStability: 'Très Stable - Acheteur public avec garantie implicite',
  offTakeStatus: 'Signé',
  ppaContractDuration: '25 ans',
  tarifFormula: 'Take-or-Pay - Paiement garanti 90% de capacity factor',
  indexation: 'Annuelle basée sur CPI+2%',
  takeOrPayClause: 'Oui - 90% capacity factor garanti',
  volumeGuarantee: '100% de la production estimée',
  marketExposure: 'Zéro - Revenus garantis par PPA',
  buyerQuality: 'Excellente - ONEE Distribution (AAA)',
  terminationRisk: 'Très Faible',

  // === SOUS-BLOC 8: CONSTRUCTION ===
  epcContractType: 'Fixed Price Turnkey',
  priceFixed: 'Oui - Prix garanti 500 MUAD',
  contractTerms: 'Date certaine avec pénalités de retard',
  delayPenalties: '0.5% par mois retard (max 5%)',
  performanceGuarantees: 'Oui - 97% availability guarantee',
  liquidatedDamages: 'Oui - USD 500k par semaine retard',
  completionSupport: 'Performance Bond de l\'EPC contracteur',
  performanceBond: 'Oui - 10% du coût EPC',
  numberOfInterfaces: 'Limité - EPC responsable intégration',
  interfaceRisk: 'Faible',
  subcontracting: 'EPC responsable - Siemens Gamesa standard',

  // === SOUS-BLOC 9: EXPLOITATION ===
  omContract: 'Contrat O&M 25 ans avec Nordex',
  operatorExperience: 'Confirmée - 15+ ans en Afrique',
  operatorDependency: 'Moyen - Spécialiste de la marque',
  omCost: '4,5% CAPEX/an',
  maintenanceCoverage: 'Complète - Inclus gros entretiens',
  expectedAvailability: '97% (capacity factor 35%)',
  performanceRatios: 'EBITDA interest coverage: 4.25x minimum',
  businessContinuity: 'Plan de continuité en cas changement opérateur',
  operationalGuarantees: 'Oui - Garanties de performance Nordex',

  // === SOUS-BLOC 10: JURIDIQUE / DOCUMENTATION ===
  authorizationsStatus: 'Complet - Permis construction obtenu',
  permits: ['Permis de construire', 'Autorisation environnementale', 'Accord réseau'],
  landStatus: 'Sécurisé - Contrats de surface 25 ans',
  easements: 'Oui - Servitudes pour accès et câbles',
  complianceStatus: 'Conforme - IFC, EBRD, Moroccan law',
  majorContracts: ['PPA', 'EPC', 'O&M', 'TSA'],
  securityPackage: 'Complet',
  tangibleSecurities: 'Nantissement des actifs du projet',
  personalSecurities: 'Garantie de sponsor (ONEE)',
  stepInRights: 'Oui - Banques peuvent opérer projet',
  precedentConditions: '60 conditions précédentes à financial close',
  drawingConditions: '8 conditions à chaque tirage',
  defaultEvents: 'Standards - LIBOR floor, covenant breaches, non-payment',

  // === SOUS-BLOC 11: ESG / CLIMAT ===
  environmentalSensitivity: 'Faible - Énergie renouvelable',
  socialRisks: 'Moyen - Acceptabilité locale variable',
  localAcceptance: 'Bonne - Projet soutenu par gouvernement',
  esgCompliance: 'Conforme IFC & Equator Principles',
  ifcCompliance: 'Category B - Impacts limités',
  equatorPrinciples: 'Oui',
  physicalClimateExposure: 'Faible - Tempêtes rares en zone',
  transitionExposure: 'N/A',
  mitigationPlan: 'Standard - Assurances tous risques',
  knownEsgIncidents: 'Aucun incident connu',
  complementaryClimateScoring: 'Projet contribue aux objectifs climatiques du Maroc',

  // === SOUS-BLOC 12: GARANTIES ET SÛRETÉS ===
  shares_pledge: 'Oui - 100% des parts SPV nantis',
  revenues_assignment: 'Oui - Cession de revenus PPA',
  dsra_account: 'Oui - Compte de réserve OPEX',
  maintenance_reserve: 'Oui - Compte entretien lourd année 15',
  assetSecurities: 'Oui - Garantie première sur tous les équipements',
  creditAssignment: 'Oui - Cession de créances clients/fournisseurs',
  mortgages: 'Hypothèque sur terrains projet',
  contractSecurities: 'Oui - Cession de droits PPA/EPC/O&M',
  sponsorGuarantees: 'Completion guarantee + Performance guarantee',
  completionGuarantees: 'Siemens Gamesa + ONEE',
  financialCovenants: [
    'DSCR minimum 1.25x',
    'LLCR minimum 1.90x',
    'Endettement net/EBITDA max 4.0x',
    'Interest coverage minimum 3.0x',
  ],
  covenantPackage: 'Complet - Standard pour projets PF',

  // === DOCUMENTS ASSOCIÉS ===
  documents: [
    { name: 'Étude de Faisabilité', type: 'Faisabilité', date: '2025-06-01' },
    { name: 'Modèle Financier', type: 'Financial Model', date: '2025-12-15' },
    { name: 'Due Diligence Technique', type: 'DD Technique', date: '2026-01-31' },
    { name: 'Due Diligence Légale', type: 'DD Légale', date: '2026-02-15' },
    { name: 'Contrat PPA ONEE', type: 'Contrat Principal', date: '2025-11-01' },
    { name: 'Contrat EPC Siemens', type: 'Contrat Principal', date: '2026-03-01' },
    { name: 'Contrat O&M Nordex', type: 'Contrat Principal', date: '2026-03-15' },
    { name: 'Rapports Assurances', type: 'Assurance', date: '2026-02-28' },
  ],

  // === STATUT ET SCORING ===
  status: 'En cours d\'évaluation',
  maturity: 'Phase d\'ingénierie',
  rating: 'A',
  score: 8.08,
  createdAt: '2026-02-15',
  updatedAt: '2026-04-03',
};

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8">
      {/* === HEADER === */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/projects"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{MOCK_PROJECT.name}</h1>
            <p className="text-slate-400 mt-2">{MOCK_PROJECT.description}</p>
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
          { icon: Briefcase, label: 'Secteur', value: 'Énergie Renouvelable' },
          { icon: MapPin, label: 'Localisation', value: `${MOCK_PROJECT.city}, ${MOCK_PROJECT.country}` },
          { icon: BarChart3, label: 'Coût Total', value: MOCK_PROJECT.totalCost },
          { icon: TrendingUp, label: 'Rating', value: MOCK_PROJECT.rating, highlight: true },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="rounded-lg bg-slate-800 border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">{item.label}</span>
                <Icon size={18} className="text-slate-500" />
              </div>
              {item.highlight ? (
                <p className="text-2xl font-bold text-cyan-400">{item.value}</p>
              ) : (
                <p className="text-lg font-semibold text-white">{item.value}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* === BLOC 1: IDENTIFICATION === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Briefcase size={24} />
          <span>Identification du Projet</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Codes et Références</h3>
            <InfoRow label="Code Projet" value={MOCK_PROJECT.projectCode} />
            <InfoRow label="Code Interne" value={MOCK_PROJECT.bankInternalCode} />
            <InfoRow label="Référence Dossier Crédit" value={MOCK_PROJECT.creditFileRef} />
            <InfoRow label="Référence Comité" value={MOCK_PROJECT.committeeRef} />
            <InfoRow label="Référence Client" value={MOCK_PROJECT.clientRef} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Organisation Bancaire</h3>
            <InfoRow label="Entité Bancaire" value={MOCK_PROJECT.bankEntity} />
            <InfoRow label="Analyste Responsable" value={MOCK_PROJECT.analyst} />
            <InfoRow label="Centre d\'Affaires" value={MOCK_PROJECT.businessCenter} />
            <InfoRow label="Statut Projet" value={MOCK_PROJECT.status} />
            <InfoRow label="Maturité" value={MOCK_PROJECT.maturity} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Informations Générales</h3>
            <InfoRow label="Sponsor Principal" value={MOCK_PROJECT.sponsor} />
            <InfoRow label="Score Global" value={MOCK_PROJECT.score.toString()} />
            <InfoRow label="Rating" value={MOCK_PROJECT.rating} />
            <InfoRow label="Créé le" value={MOCK_PROJECT.createdAt} />
            <InfoRow label="Modifié le" value={MOCK_PROJECT.updatedAt} />
          </div>
        </div>
      </div>

      {/* === BLOC 2: LOCALISATION === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <MapPin size={24} />
          <span>Localisation</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Situation Géographique</h3>
            <InfoRow label="Pays" value={MOCK_PROJECT.country} />
            <InfoRow label="Région" value={MOCK_PROJECT.region} />
            <InfoRow label="Ville" value={MOCK_PROJECT.city} />
            <InfoRow label="Adresse" value={MOCK_PROJECT.address} />
            <InfoRow label="Coordonnées" value={`${MOCK_PROJECT.coordinates.lat}, ${MOCK_PROJECT.coordinates.lng}`} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Risques et Exposition</h3>
            <InfoRow label="Zone Climatique" value={MOCK_PROJECT.climateZone} />
            <InfoRow label="Risque Géopolitique" value={MOCK_PROJECT.geopoliticalRisk} />
          </div>
        </div>
      </div>

      {/* === BLOC 3: PARTIES PRENANTES === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Users size={24} />
          <span>Parties Prenantes</span>
        </h2>

        <div className="space-y-6">
          {/* Sponsor */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Sponsor Principal</h3>
            <div className="bg-slate-700 rounded-lg p-4">
              <InfoRow label="Nom" value={MOCK_PROJECT.sponsor_info.name} />
              <InfoRow label="Rôle" value={MOCK_PROJECT.sponsor_info.role} />
              <InfoRow label="Pays" value={MOCK_PROJECT.sponsor_info.country} />
              <InfoRow label="Qualité" value={MOCK_PROJECT.sponsor_info.quality} />
              <InfoRow label="Relation Bancaire" value={MOCK_PROJECT.sponsor_info.bankRelation} />
            </div>
          </div>

          {/* EPC Contractor */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">EPC Contractor</h3>
            <div className="bg-slate-700 rounded-lg p-4">
              <InfoRow label="Nom" value={MOCK_PROJECT.epcContractor.name} />
              <InfoRow label="Pays" value={MOCK_PROJECT.epcContractor.country} />
              <InfoRow label="Expérience" value={MOCK_PROJECT.epcContractor.experience} />
              <InfoRow label="Rating" value={MOCK_PROJECT.epcContractor.rating} />
            </div>
          </div>

          {/* O&M Contractor */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">O&M Contractor</h3>
            <div className="bg-slate-700 rounded-lg p-4">
              <InfoRow label="Nom" value={MOCK_PROJECT.omContractor.name} />
              <InfoRow label="Pays" value={MOCK_PROJECT.omContractor.country} />
              <InfoRow label="Expérience" value={MOCK_PROJECT.omContractor.experience} />
              <InfoRow label="Rating" value={MOCK_PROJECT.omContractor.rating} />
            </div>
          </div>

          {/* Off-Taker */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Off-Taker (Acheteur)</h3>
            <div className="bg-slate-700 rounded-lg p-4">
              <InfoRow label="Nom" value={MOCK_PROJECT.offTaker.name} />
              <InfoRow label="Rôle" value={MOCK_PROJECT.offTaker.role} />
              <InfoRow label="Type Contrat" value={MOCK_PROJECT.offTaker.type} />
              <InfoRow label="Rating" value={MOCK_PROJECT.offTaker.rating} />
            </div>
          </div>

          {/* Advisors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-white mb-2">Conseiller Technique</h4>
              <div className="bg-slate-700 rounded-lg p-3">
                <p className="text-white">{MOCK_PROJECT.technicalAdvisor.name}</p>
                <p className="text-slate-400 text-sm">{MOCK_PROJECT.technicalAdvisor.country}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Conseiller Juridique</h4>
              <div className="bg-slate-700 rounded-lg p-3">
                <p className="text-white">{MOCK_PROJECT.legalAdvisor.name}</p>
                <p className="text-slate-400 text-sm">{MOCK_PROJECT.legalAdvisor.country}</p>
              </div>
            </div>
          </div>

          {/* Banks & Guarantor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-white mb-2">Banques Participantes</h4>
              <div className="space-y-2">
                {MOCK_PROJECT.bankParticipants.map((bank, i) => (
                  <div key={i} className="bg-slate-700 rounded-lg p-2 text-white text-sm">{bank}</div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Garant</h4>
              <div className="bg-slate-700 rounded-lg p-3">
                <p className="text-white">{MOCK_PROJECT.guarantor.name}</p>
                <p className="text-slate-400 text-sm">{MOCK_PROJECT.guarantor.type} - {MOCK_PROJECT.guarantor.level}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === BLOC 4: CARACTÉRISTIQUES TECHNIQUES === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Caractéristiques Techniques</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Spécifications</h3>
            <InfoRow label="Technologie" value={MOCK_PROJECT.technology} />
            <InfoRow label="Capacité Installée" value={MOCK_PROJECT.installedCapacity} />
            <InfoRow label="Maturité Technologique" value={MOCK_PROJECT.technologyMaturity} />
            <InfoRow label="Risque Technique" value={MOCK_PROJECT.technicalRisk} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Exécution et Matières Premières</h3>
            <InfoRow label="Interconnexions" value={MOCK_PROJECT.interconnections} />
            <InfoRow label="Complexité d\'Exécution" value={MOCK_PROJECT.executionComplexity} />
            <InfoRow label="Disponibilité Intrants" value={MOCK_PROJECT.inputsAvailability} />
            <InfoRow label="Standardisation" value={MOCK_PROJECT.standardization} />
            <InfoRow label="Technologie Importée" value={MOCK_PROJECT.importedTechnology} />
          </div>
        </div>
      </div>

      {/* === BLOC 5: CALENDRIER === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Calendrier Projet</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Dates Clés</h3>
            <InfoRow label="Financial Close" value={MOCK_PROJECT.financialClose} />
            <InfoRow label="Démarrage Construction" value={MOCK_PROJECT.constructionStart} />
            <InfoRow label="Mise en Service" value={MOCK_PROJECT.commissioning} />
            <InfoRow label="Exploitation Commerciale" value={MOCK_PROJECT.commercialOp} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Durées</h3>
            <InfoRow label="Concession" value={MOCK_PROJECT.concessionDuration} />
            <InfoRow label="PPA/Off-take" value={MOCK_PROJECT.offTakeDuration} />
            <InfoRow label="Contrat O&M" value={MOCK_PROJECT.omDuration} />
            <InfoRow label="Échéance Emprunt" value={MOCK_PROJECT.debtMaturity} />
            <InfoRow label="Périodes de Grâce" value={`${MOCK_PROJECT.gracePeriodsMonths} mois`} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Jalons Critiques</h3>
          <div className="space-y-2">
            {MOCK_PROJECT.keyMilestones.map((milestone, i) => (
              <div key={i} className="bg-slate-700 rounded-lg p-3 flex justify-between items-center">
                <span className="text-white font-semibold">{milestone.milestone}</span>
                <span className="text-slate-400 text-sm">{milestone.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === BLOC 6: FINANCEMENT === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Structure de Financement</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Allocation du Capital</h3>
            <InfoRow label="Coût Total" value={MOCK_PROJECT.totalCost} />
            <InfoRow label="Équité" value={MOCK_PROJECT.equity} />
            <InfoRow label="Quasi-Équité" value={MOCK_PROJECT.quasiEquity} />
            <InfoRow label="Dette Senior" value={MOCK_PROJECT.seniorDebt} />
            <InfoRow label="Dette Subordonnée" value={MOCK_PROJECT.subordinatedDebt} />
            <InfoRow label="Subventions" value={MOCK_PROJECT.subsidies} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Conditions Financières</h3>
            <InfoRow label="Gearing" value={MOCK_PROJECT.gearing} />
            <InfoRow label="DSCR Cible" value={MOCK_PROJECT.dscr_target} />
            <InfoRow label="LLCR Cible" value={MOCK_PROJECT.llcr_target} />
            <InfoRow label="Échéance" value={MOCK_PROJECT.debtTerm} />
            <InfoRow label="Profil Amortissement" value={MOCK_PROJECT.amortizationProfile} />
            <InfoRow label="Taux d\'Intérêt" value={MOCK_PROJECT.interestRate} />
            <InfoRow label="Couverture de Taux" value={MOCK_PROJECT.rateHedging} />
            <InfoRow label="Compte DSRA" value={MOCK_PROJECT.dsrAccount} />
          </div>
        </div>
      </div>

      {/* === BLOC 7: REVENUS / CONTRATS === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Revenus et Contrats Commerciaux</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Structure des Revenus</h3>
            <InfoRow label="Type de Revenu" value={MOCK_PROJECT.revenueType} />
            <InfoRow label="Stabilité" value={MOCK_PROJECT.revenueStability} />
            <InfoRow label="Statut Off-take" value={MOCK_PROJECT.offTakeStatus} />
            <InfoRow label="Durée Contrat" value={MOCK_PROJECT.ppaContractDuration} />
            <InfoRow label="Formule Tarifaire" value={MOCK_PROJECT.tarifFormula} />
            <InfoRow label="Indexation" value={MOCK_PROJECT.indexation} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Garanties et Risques</h3>
            <InfoRow label="Clause Take-or-Pay" value={MOCK_PROJECT.takeOrPayClause} />
            <InfoRow label="Volume Garanti" value={MOCK_PROJECT.volumeGuarantee} />
            <InfoRow label="Exposition Marché" value={MOCK_PROJECT.marketExposure} />
            <InfoRow label="Qualité Acheteur" value={MOCK_PROJECT.buyerQuality} />
            <InfoRow label="Risque de Résiliation" value={MOCK_PROJECT.terminationRisk} />
          </div>
        </div>
      </div>

      {/* === BLOC 8: CONSTRUCTION === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Phase de Construction</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Contrat EPC</h3>
            <InfoRow label="Type de Contrat" value={MOCK_PROJECT.epcContractType} />
            <InfoRow label="Prix Fixe" value={MOCK_PROJECT.priceFixed} />
            <InfoRow label="Conditions" value={MOCK_PROJECT.contractTerms} />
            <InfoRow label="Pénalités Retard" value={MOCK_PROJECT.delayPenalties} />
            <InfoRow label="Performances Garanties" value={MOCK_PROJECT.performanceGuarantees} />
            <InfoRow label="Dommages Liquidés" value={MOCK_PROJECT.liquidatedDamages} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Réductions de Risque</h3>
            <InfoRow label="Support de Complétion" value={MOCK_PROJECT.completionSupport} />
            <InfoRow label="Performance Bond" value={MOCK_PROJECT.performanceBond} />
            <InfoRow label="Nombre d\'Interfaces" value={MOCK_PROJECT.numberOfInterfaces} />
            <InfoRow label="Risque d\'Interface" value={MOCK_PROJECT.interfaceRisk} />
            <InfoRow label="Sous-traitance" value={MOCK_PROJECT.subcontracting} />
          </div>
        </div>
      </div>

      {/* === BLOC 9: EXPLOITATION === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Phase d\'Exploitation</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Contrat O&M</h3>
            <InfoRow label="Contrat" value={MOCK_PROJECT.omContract} />
            <InfoRow label="Expérience Opérateur" value={MOCK_PROJECT.operatorExperience} />
            <InfoRow label="Dépendance Opérateur" value={MOCK_PROJECT.operatorDependency} />
            <InfoRow label="Coût O&M" value={MOCK_PROJECT.omCost} />
            <InfoRow label="Couverture Maintenance" value={MOCK_PROJECT.maintenanceCoverage} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
            <InfoRow label="Disponibilité Attendue" value={MOCK_PROJECT.expectedAvailability} />
            <InfoRow label="Ratios de Performance" value={MOCK_PROJECT.performanceRatios} />
            <InfoRow label="Continuité Opérationnelle" value={MOCK_PROJECT.businessContinuity} />
            <InfoRow label="Garanties Opérationnelles" value={MOCK_PROJECT.operationalGuarantees} />
          </div>
        </div>
      </div>

      {/* === BLOC 10: JURIDIQUE === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Juridique et Documentation</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Autorisations et Foncier</h3>
              <InfoRow label="Statut Autorisations" value={MOCK_PROJECT.authorizationsStatus} />
              <div>
                <label className="text-sm text-slate-400">Permis</label>
                <div className="mt-2 space-y-1">
                  {MOCK_PROJECT.permits.map((permit, i) => (
                    <div key={i} className="text-white bg-slate-700 rounded px-2 py-1 text-sm">{permit}</div>
                  ))}
                </div>
              </div>
              <InfoRow label="Statut Foncier" value={MOCK_PROJECT.landStatus} />
              <InfoRow label="Servitudes" value={MOCK_PROJECT.easements} />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Conformité</h3>
              <InfoRow label="Conformité Réglementaire" value={MOCK_PROJECT.complianceStatus} />
              <div>
                <label className="text-sm text-slate-400">Contrats Majeurs</label>
                <div className="mt-2 space-y-1">
                  {MOCK_PROJECT.majorContracts.map((contract, i) => (
                    <div key={i} className="text-white bg-slate-700 rounded px-2 py-1 text-sm">{contract}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-700">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Package de Sûretés</h3>
              <InfoRow label="Statut" value={MOCK_PROJECT.securityPackage} />
              <InfoRow label="Sûretés Réelles" value={MOCK_PROJECT.tangibleSecurities} />
              <InfoRow label="Sûretés Personnelles" value={MOCK_PROJECT.personalSecurities} />
              <InfoRow label="Step-in Rights" value={MOCK_PROJECT.stepInRights} />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Conditions Contractuelles</h3>
              <InfoRow label="Conditions Préalables" value={`${MOCK_PROJECT.precedentConditions}`} />
              <InfoRow label="Conditions Tirage" value={`${MOCK_PROJECT.drawingConditions}`} />
              <InfoRow label="Événements de Défaut" value={MOCK_PROJECT.defaultEvents} />
            </div>
          </div>
        </div>
      </div>

      {/* === BLOC 11: ESG / CLIMAT === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">ESG et Climat</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Sensibilités et Risques</h3>
            <InfoRow label="Sensibilité Environnementale" value={MOCK_PROJECT.environmentalSensitivity} />
            <InfoRow label="Risques Sociaux" value={MOCK_PROJECT.socialRisks} />
            <InfoRow label="Acceptabilité Locale" value={MOCK_PROJECT.localAcceptance} />
            <InfoRow label="Conformité ESG" value={MOCK_PROJECT.esgCompliance} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Conformité Standards</h3>
            <InfoRow label="IFC Compliance" value={MOCK_PROJECT.ifcCompliance} />
            <InfoRow label="Equator Principles" value={MOCK_PROJECT.equatorPrinciples} />
            <InfoRow label="Exposition Climat Physique" value={MOCK_PROJECT.physicalClimateExposure} />
            <InfoRow label="Exposition Transition" value={MOCK_PROJECT.transitionExposure} />
            <InfoRow label="Plan de Mitigation" value={MOCK_PROJECT.mitigationPlan} />
            <InfoRow label="Incidents ESG Connus" value={MOCK_PROJECT.knownEsgIncidents} />
            <InfoRow label="Scoring Climat" value={MOCK_PROJECT.complementaryClimateScoring} />
          </div>
        </div>
      </div>

      {/* === BLOC 12: GARANTIES === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Garanties et Sûretés</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Sûretés Principales</h3>
            <InfoRow label="Nantissement Actions SPV" value={MOCK_PROJECT.shares_pledge} />
            <InfoRow label="Cession Revenus" value={MOCK_PROJECT.revenues_assignment} />
            <InfoRow label="Compte DSRA" value={MOCK_PROJECT.dsra_account} />
            <InfoRow label="Réserve Maintenance" value={MOCK_PROJECT.maintenance_reserve} />
            <InfoRow label="Sûretés sur Actifs" value={MOCK_PROJECT.assetSecurities} />
            <InfoRow label="Cession de Créances" value={MOCK_PROJECT.creditAssignment} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Garanties et Covenants</h3>
            <InfoRow label="Hypothèques" value={MOCK_PROJECT.mortgages} />
            <InfoRow label="Sûretés sur Contrats" value={MOCK_PROJECT.contractSecurities} />
            <InfoRow label="Garanties Sponsor" value={MOCK_PROJECT.sponsorGuarantees} />
            <InfoRow label="Completion Guarantees" value={MOCK_PROJECT.completionGuarantees} />
            <InfoRow label="Package Covenants" value={MOCK_PROJECT.covenantPackage} />
          </div>
        </div>

        <div className="pt-8 border-t border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">Covenants Financiers</h3>
          <div className="space-y-2">
            {MOCK_PROJECT.financialCovenants.map((covenant, i) => (
              <div key={i} className="bg-slate-700 rounded-lg p-3 text-white">{covenant}</div>
            ))}
          </div>
        </div>
      </div>

      {/* === DOCUMENTS === */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <FileText size={24} />
          <span>Documents Associés</span>
        </h2>

        <div className="space-y-3">
          {MOCK_PROJECT.documents.map((doc, i) => (
            <div key={i} className="bg-slate-700 rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-white">{doc.name}</p>
                <p className="text-sm text-slate-400">{doc.type} • {doc.date}</p>
              </div>
              <a href="#" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                Télécharger
              </a>
            </div>
          ))}
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
