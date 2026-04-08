'use client';

import Link from 'next/link';
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormBuilder } from '@/components/crud/FormBuilder';
import { createClientSchema } from '@/lib/validation-schemas';

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
  const [open, setOpen] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  const handleCreateClient = async (formData: any) => {
    try {
      setCreatingClient(true);
      setCreateError(null);
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }

      setOpen(false);
      await fetchClients();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create client');
    } finally {
      setCreatingClient(false);
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
          <h1 className="text-3xl font-bold text-white">Clients</h1>
          <p className="text-slate-400 mt-2">Gérez les clients et leur signalétique</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all">
              <Plus size={20} />
              <span>Nouveau client</span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
              <DialogDescription>
                Add a new client to the system
              </DialogDescription>
            </DialogHeader>
            {createError && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                {createError}
              </div>
            )}
            <FormBuilder
              schema={createClientSchema}
              fields={[
                { name: 'nom', label: 'Client Name', type: 'text', placeholder: 'Company name', required: true },
                { name: 'email', label: 'Email', type: 'email', placeholder: 'contact@company.com' },
                { name: 'telephone', label: 'Phone', type: 'text', placeholder: '+212 6 XX XX XX XX' },
                { name: 'secteur', label: 'Sector', type: 'text', placeholder: 'e.g., Agriculture, Energy' },
                { name: 'pays', label: 'Country', type: 'text', placeholder: 'e.g., Morocco' },
                {
                  name: 'type',
                  label: 'Client Type',
                  type: 'select',
                  options: [
                    { label: 'Entreprise', value: 'Entreprise' },
                    { label: 'PME', value: 'PME' },
                    { label: 'TPME', value: 'TPME' },
                    { label: 'Start-up', value: 'Start-up' },
                    { label: 'Gouvernement', value: 'Gouvernement' },
                  ],
                  defaultValue: 'Entreprise',
                },
                { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Client description' },
              ]}
              onSubmit={handleCreateClient}
              submitLabel="Create Client"
              loading={creatingClient}
              error={undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-500" size={20} />
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border border-slate-700 p-8 text-center">
          <p className="text-slate-400">Loading clients...</p>
        </div>
      )}

      {/* Table View */}
      {!loading && filteredClients.length > 0 && (
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Nom</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Secteur</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Pays</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Statut</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">{client.nom}</td>
                  <td className="px-6 py-4 text-slate-400">{client.email || '-'}</td>
                  <td className="px-6 py-4 text-slate-400">{client.secteur || '-'}</td>
                  <td className="px-6 py-4 text-slate-400">{client.pays || '-'}</td>
                  <td className="px-6 py-4 text-slate-400">{client.type || 'Entreprise'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      client.status === 'Actif'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors">
                        <Eye size={18} />
                      </button>
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
      )}

      {/* Empty State */}
      {!loading && filteredClients.length === 0 && (
        <div className="text-center py-12 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-lg">Aucun client trouvé</p>
          <p className="text-slate-500 mt-1">
            {searchTerm ? 'Essayez une autre recherche' : 'Créez votre premier client'}
          </p>
        </div>
      )}
    </div>
  );
}
