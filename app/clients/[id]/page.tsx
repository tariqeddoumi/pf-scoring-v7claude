'use client';

import Link from 'next/link';
import { ArrowLeft, Edit2, MapPin, Mail, Phone, Globe, Users, Briefcase, BarChart3 } from 'lucide-react';

// Mock client data
const MOCK_CLIENT = {
  id: '1',
  name: 'ONEE (Office National de l\'Électricité)',
  type: 'Entreprise Publique',
  sector: 'Énergie',
  country: 'Maroc',
  email: 'contact@onee.ma',
  phone: '+212 537 71 06 06',
  website: 'www.onee.ma',
  rating: 'AA',
  createdAt: '2025-01-15',
  updatedAt: '2026-04-03',
  status: 'Actif',
  // Signalétique complète
  description:
    'Office National de l\'Électricité et de l\'Eau Potable - Société publique marocaine responsable de la production, du transport et de la distribution d\'électricité.',
  address: 'Avenue Al Fadila, Casablanca, Maroc',
  postalCode: '20000',
  numberOfEmployees: 15000,
  yearFounded: 1963,
  boardMembers: [
    { name: 'Mohamed El Kettani', position: 'Président du Conseil d\'Administration' },
    { name: 'Abdellatif Zaghnoun', position: 'Directeur Général' },
  ],
  legalRepresentative: 'Abdellatif Zaghnoun',
  registrationNumber: 'MA 000000001234',
  taxNumber: 'FR 12 345 678 901',
  capitalAmount: '2,500,000,000 MAD',
  currency: 'MAD',
  // Financial Info
  lastAnnualRevenue: '45,000,000,000 MAD',
  financialRating: 'AA',
  liquidityRatio: 1.45,
  leverageRatio: 0.65,
  // Projects
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
  // Evaluations
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
      {/* Header */}
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
            <p className="text-slate-400 mt-2">{MOCK_CLIENT.description}</p>
          </div>
        </div>
        <button className="inline-flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-all">
          <Edit2 size={20} />
          <span>Modifier</span>
        </button>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Globe, label: 'Type', value: MOCK_CLIENT.type },
          { icon: Briefcase, label: 'Secteur', value: MOCK_CLIENT.sector },
          { icon: BarChart3, label: 'Rating', value: MOCK_CLIENT.rating, highlight: true },
          { icon: Users, label: 'Statut', value: MOCK_CLIENT.status, statusBadge: true },
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

      {/* Signalétique Complète */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Signalétique</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Coordonnées</h3>

            <div>
              <label className="text-sm text-slate-400">Email</label>
              <div className="flex items-center space-x-2 text-white mt-1">
                <Mail size={16} className="text-cyan-500" />
                <a href={`mailto:${MOCK_CLIENT.email}`} className="hover:text-cyan-400">
                  {MOCK_CLIENT.email}
                </a>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400">Téléphone</label>
              <div className="flex items-center space-x-2 text-white mt-1">
                <Phone size={16} className="text-cyan-500" />
                <a href={`tel:${MOCK_CLIENT.phone}`} className="hover:text-cyan-400">
                  {MOCK_CLIENT.phone}
                </a>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400">Site Web</label>
              <div className="flex items-center space-x-2 text-white mt-1">
                <Globe size={16} className="text-cyan-500" />
                <a href={`https://${MOCK_CLIENT.website}`} className="hover:text-cyan-400">
                  {MOCK_CLIENT.website}
                </a>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400">Adresse</label>
              <div className="flex items-center space-x-2 text-white mt-1">
                <MapPin size={16} className="text-cyan-500" />
                <span>{MOCK_CLIENT.address}, {MOCK_CLIENT.postalCode}</span>
              </div>
            </div>
          </div>

          {/* Legal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Informations légales</h3>

            <InfoRow label="Numéro d'Enregistrement" value={MOCK_CLIENT.registrationNumber} />
            <InfoRow label="Numéro de Taxe" value={MOCK_CLIENT.taxNumber} />
            <InfoRow label="Représentant Légal" value={MOCK_CLIENT.legalRepresentative} />
            <InfoRow label="Année de Fondation" value={MOCK_CLIENT.yearFounded.toString()} />
            <InfoRow label="Nombre d'Employés" value={MOCK_CLIENT.numberOfEmployees.toLocaleString()} />
            <InfoRow label="Capital Social" value={MOCK_CLIENT.capitalAmount} />
          </div>
        </div>

        {/* Board Members */}
        <div className="mt-8 pt-8 border-t border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Conseil d'Administration</h3>
          <div className="space-y-3">
            {MOCK_CLIENT.boardMembers.map((member, i) => (
              <div key={i} className="bg-slate-700 rounded-lg p-4">
                <p className="font-semibold text-white">{member.name}</p>
                <p className="text-sm text-slate-400">{member.position}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Informations Financières</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FinancialCard
            label="Dernier Revenu Annuel"
            value={MOCK_CLIENT.lastAnnualRevenue}
            color="from-blue-600 to-blue-700"
          />
          <FinancialCard
            label="Rating Financier"
            value={MOCK_CLIENT.financialRating}
            color="from-cyan-600 to-cyan-700"
            highlight
          />
          <FinancialCard
            label="Ratio de Liquidité"
            value={MOCK_CLIENT.liquidityRatio.toFixed(2) + 'x'}
            color="from-green-600 to-green-700"
          />
        </div>
      </div>

      {/* Projects */}
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

      {/* Evaluations */}
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
              {MOCK_CLIENT.evaluations.map((eval) => (
                <tr key={eval.id} className="hover:bg-slate-700 transition-colors">
                  <td className="px-4 py-3 text-white font-semibold">{eval.projectName}</td>
                  <td className="px-4 py-3 text-slate-400">{eval.date}</td>
                  <td className="px-4 py-3 text-cyan-400 font-bold">{eval.rating}</td>
                  <td className="px-4 py-3 text-white font-semibold">{eval.score}</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                      {eval.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/evaluations/${eval.id}`}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-sm text-slate-400">{label}</label>
      <p className="text-white mt-1 font-semibold">{value}</p>
    </div>
  );
}

function FinancialCard({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg bg-gradient-to-br ${color} p-6 text-white`}>
      <p className="text-sm opacity-90 mb-2">{label}</p>
      {highlight ? (
        <p className="text-3xl font-bold">{value}</p>
      ) : (
        <p className="text-2xl font-bold">{value}</p>
      )}
    </div>
  );
}
