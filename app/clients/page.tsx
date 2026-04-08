'use client';

import Link from 'next/link';
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Client {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  secteur?: string;
  pays?: string;
  type?: string;
  status: string;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      setClients(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clients');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Clients</h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">Gérez les clients et leur signalétique</p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all w-full md:w-auto justify-center md:justify-start"
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
          placeholder="Rechercher par nom ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm md:text-base"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border border-slate-700 p-8 text-center">
          <p className="text-slate-400">Chargement des clients...</p>
        </div>
      )}

      {/* Table View - Desktop */}
      {!loading && filteredClients.length > 0 && (
        <div className="rounded-lg border border-slate-700 overflow-x-auto">
          <table className="w-full min-w-max md:min-w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">Nom</th>
                <th className="hidden sm:table-cell px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">Email</th>
                <th className="hidden md:table-cell px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">Secteur</th>
                <th className="hidden lg:table-cell px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">Pays</th>
                <th className="hidden md:table-cell px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">Type</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">Statut</th>
                <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-800 transition-colors">
                  <td className="px-4 md:px-6 py-4 font-semibold text-white text-sm md:text-base">{client.nom}</td>
                  <td className="hidden sm:table-cell px-4 md:px-6 py-4 text-slate-400 text-xs md:text-sm">{client.email || '-'}</td>
                  <td className="hidden md:table-cell px-4 md:px-6 py-4 text-slate-400 text-xs md:text-sm">{client.secteur || '-'}</td>
                  <td className="hidden lg:table-cell px-4 md:px-6 py-4 text-slate-400 text-xs md:text-sm">{client.pays || '-'}</td>
                  <td className="hidden md:table-cell px-4 md:px-6 py-4 text-slate-400 text-xs md:text-sm">{client.type || 'Entreprise'}</td>
                  <td className="px-4 md:px-6 py-4">
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium inline-block ${
                      client.status === 'Actif'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1 md:space-x-2">
                      <button className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors">
                        <Eye size={16} className="md:w-5 md:h-5" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors">
                        <Edit2 size={16} className="md:w-5 md:h-5" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors">
                        <Trash2 size={16} className="md:w-5 md:h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredClients.length === 0 && (
        <div className="text-center py-12 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-lg">Aucun client trouvé</p>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            {searchTerm ? 'Essayez une autre recherche' : 'Créez votre premier client'}
          </p>
        </div>
      )}
    </div>
  );
}
