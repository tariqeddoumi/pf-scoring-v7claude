'use client';

import Link from 'next/link';
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete user');
      setUsers(users.filter(u => u.id !== userId));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-400',
    manager: 'bg-blue-500/20 text-blue-400',
    analyst: 'bg-green-500/20 text-green-400',
    viewer: 'bg-slate-500/20 text-slate-400',
  };

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    manager: 'Manager',
    analyst: 'Analyste',
    viewer: 'Lecteur',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Utilisateurs</h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">Gérez les utilisateurs et leurs rôles</p>
        </div>
        <Link
          href="/users/new"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all w-full md:w-auto justify-center md:justify-start"
        >
          <Plus size={20} />
          <span>Nouvel utilisateur</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-500" size={20} />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou email..."
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
          <p className="text-slate-400">Chargement des utilisateurs...</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && filteredUsers.length > 0 && (
        <div className="rounded-lg border border-slate-700 overflow-x-auto">
          <table className="w-full min-w-max md:min-w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">Nom</th>
                <th className="hidden sm:table-cell px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">Email</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">Rôle</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 md:px-6 py-4 text-sm md:text-base">
                    <div className="font-semibold text-white">{user.nom} {user.prenom}</div>
                  </td>
                  <td className="hidden sm:table-cell px-4 md:px-6 py-4 text-sm text-slate-400">{user.email}</td>
                  <td className="px-4 md:px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/users/${user.id}`}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        title="Voir"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        href={`/users/${user.id}/edit`}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={18} />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                        title="Supprimer"
                      >
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
      {!loading && filteredUsers.length === 0 && (
        <div className="rounded-lg border border-slate-700 p-8 text-center">
          <p className="text-slate-400">
            {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold text-white mb-4">Confirmer la suppression</h2>
            <p className="text-slate-300 mb-6">
              Êtes-vous sûr ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
