"use client";

import Link from "next/link";
import { Plus, Search, Eye, Edit2, Trash2, Filter, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Client } from "@/lib/types/models";
import { DeleteConfirmation } from "@/components/modals/DeleteConfirmation";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSecteur, setFilterSecteur] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPays, setFilterPays] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();
      setClients(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch clients");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete client");
      setClients(clients.filter((c) => c.id !== clientId));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete client");
    } finally {
      setDeleting(false);
    }
  };

  // Extract unique values for filter dropdowns
  const uniqueSecteurs = useMemo(() => [...new Set(clients.map((c) => c.secteur).filter(Boolean))].sort(), [clients]);
  const uniqueTypes = useMemo(() => [...new Set(clients.map((c) => c.type).filter(Boolean))].sort(), [clients]);
  const uniquePays = useMemo(() => [...new Set(clients.map((c) => c.pays).filter(Boolean))].sort(), [clients]);

  const activeFilterCount = [filterStatus, filterSecteur, filterType, filterPays].filter(Boolean).length;

  const clearFilters = () => {
    setFilterStatus("");
    setFilterSecteur("");
    setFilterType("");
    setFilterPays("");
  };

  const filteredClients = useMemo(() => clients.filter((client) => {
    const matchesSearch =
      !searchTerm ||
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || client.status === filterStatus;
    const matchesSecteur = !filterSecteur || client.secteur === filterSecteur;
    const matchesType = !filterType || client.type === filterType;
    const matchesPays = !filterPays || client.pays === filterPays;
    return matchesSearch && matchesStatus && matchesSecteur && matchesType && matchesPays;
  }), [clients, searchTerm, filterStatus, filterSecteur, filterType, filterPays]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Clients</h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Gérez les clients et leur signalétique
          </p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all w-full md:w-auto justify-center md:justify-start"
        >
          <Plus size={20} />
          <span>Nouveau client</span>
        </Link>
      </div>

      {/* Search Bar + Filter Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm md:text-base"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
            showFilters || activeFilterCount > 0
              ? "bg-blue-600 text-white"
              : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
          }`}
        >
          <Filter size={16} />
          <span className="hidden sm:inline">Filtres</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 bg-white/20 text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Filtres avancés</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                <X size={12} /> Réinitialiser
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Statut</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="">Tous</option>
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Secteur</label>
              <select value={filterSecteur} onChange={(e) => setFilterSecteur(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="">Tous</option>
                {uniqueSecteurs.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="">Tous</option>
                {uniqueTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Pays</label>
              <select value={filterPays} onChange={(e) => setFilterPays(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="">Tous</option>
                {uniquePays.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      {!loading && (
        <p className="text-sm text-slate-400">
          {filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""} trouvé{filteredClients.length !== 1 ? "s" : ""}
          {(searchTerm || activeFilterCount > 0) && ` sur ${clients.length}`}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingSkeleton rows={6} columns={7} />}

      {/* Table View - Desktop */}
      {!loading && filteredClients.length > 0 && (
        <div className="rounded-lg border border-slate-700 overflow-x-auto">
          <table className="w-full min-w-max md:min-w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">
                  Nom
                </th>
                <th className="hidden sm:table-cell px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">
                  Email
                </th>
                <th className="hidden md:table-cell px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">
                  Secteur
                </th>
                <th className="hidden lg:table-cell px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">
                  Pays
                </th>
                <th className="hidden md:table-cell px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">
                  Type
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">
                  Statut
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-slate-800 transition-colors"
                >
                  <td className="px-4 md:px-6 py-4 font-semibold text-white text-sm md:text-base">
                    {client.nom}
                  </td>
                  <td className="hidden sm:table-cell px-4 md:px-6 py-4 text-slate-400 text-xs md:text-sm">
                    {client.email || "-"}
                  </td>
                  <td className="hidden md:table-cell px-4 md:px-6 py-4 text-slate-400 text-xs md:text-sm">
                    {client.secteur || "-"}
                  </td>
                  <td className="hidden lg:table-cell px-4 md:px-6 py-4 text-slate-400 text-xs md:text-sm">
                    {client.pays || "-"}
                  </td>
                  <td className="hidden md:table-cell px-4 md:px-6 py-4 text-slate-400 text-xs md:text-sm">
                    {client.type || "Entreprise"}
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <span
                      className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium inline-block ${
                        client.status === "Actif"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1 md:space-x-2">
                      <button
                        onClick={() => router.push(`/clients/${client.id}`)}
                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Eye size={16} className="md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/clients/${client.id}/edit`)
                        }
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} className="md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(client.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                      >
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
            {searchTerm
              ? "Essayez une autre recherche"
              : "Créez votre premier client"}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteConfirm !== null}
        title="Supprimer le client"
        message="Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible."
        isDeleting={deleting}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
      />
    </div>
  );
}
