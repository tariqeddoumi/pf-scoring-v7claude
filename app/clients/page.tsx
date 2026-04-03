'use client';

import Link from 'next/link';
import { Plus, Search, MoreVertical, Eye, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';

// Mock data - remplacé par API plus tard
const MOCK_CLIENTS = [
  {
    id: '1',
    name: 'ONEE (Office National de l\'Électricité)',
    type: 'Entreprise Publique',
    sector: 'Énergie',
    country: 'Maroc',
    email: 'contact@onee.ma',
    phone: '+212 537 71 06 06',
    rating: 'AA',
    projects: 5,
    evaluations: 12,
    status: 'Actif',
  },
  {
    id: '2',
    name: 'EDF Renewables Africa',
    type: 'Société Privée',
    sector: 'Énergies Renouvelables',
    country: 'France',
    email: 'info@edf-renewables.fr',
    phone: '+33 1 40 42 22 22',
    rating: 'AA',
    projects: 8,
    evaluations: 18,
    status: 'Actif',
  },
  {
    id: '3',
    name: 'Société Casablanca Infrastructure',
    type: 'Société Privée',
    sector: 'Infrastructure',
    country: 'Maroc',
    email: 'contact@casablanca-infra.ma',
    phone: '+212 522 43 21 00',
    rating: 'BBB',
    projects: 3,
    evaluations: 5,
    status: 'Actif',
  },
];

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const filteredClients = MOCK_CLIENTS.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRatingColor = (rating: string) => {
    const colors: Record<string, string> = {
      AAA: 'text-green-500',
      AA: 'text-cyan-500',
      A: 'text-blue-500',
      BBB: 'text-yellow-500',
      BB: 'text-orange-500',
      B: 'text-red-500',
    };
    return colors[rating] || 'text-slate-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Clients</h1>
          <p className="text-slate-400 mt-2">Gérez les clients et leur signalétique</p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Plus size={20} />
          <span>Nouveau client</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-500" size={20} />
        <input
          type="text"
          placeholder="Rechercher par nom ou secteur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      {/* Table View */}
      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                <input
                  type="checkbox"
                  className="rounded border-slate-600"
                  onChange={(e) =>
                    setSelectedClients(e.target.checked ? MOCK_CLIENTS.map(c => c.id) : [])
                  }
                />
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Nom</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Secteur</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Rating</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Projets</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Statut</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-800 transition-colors">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={(e) =>
                      setSelectedClients(
                        e.target.checked
                          ? [...selectedClients, client.id]
                          : selectedClients.filter(id => id !== client.id)
                      )
                    }
                    className="rounded border-slate-600"
                  />
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/clients/${client.id}`}
                    className="font-semibold text-white hover:text-cyan-400 transition-colors"
                  >
                    {client.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-400">{client.type}</td>
                <td className="px-6 py-4 text-slate-400">{client.sector}</td>
                <td className={`px-6 py-4 font-bold ${getRatingColor(client.rating)}`}>
                  {client.rating}
                </td>
                <td className="px-6 py-4 text-slate-400">{client.projects}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <Link
                      href={`/clients/${client.id}`}
                      className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Voir détails"
                    >
                      <Eye size={18} />
                    </Link>
                    <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid View Alternative */}
      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">Aucun client trouvé</p>
        </div>
      )}
    </div>
  );
}
