'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Check } from 'lucide-react';
import { useUsers, type UserRole, type User } from '@/lib/user-context';

export default function UsersPage() {
  const { users, createUser, updateUser, deleteUser } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'analyst' as UserRole,
    department: '',
    phone: '',
  });

  const filtered = users.filter(
    (user) =>
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!selectedRole || user.role === selectedRole)
  );

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'analyst',
        department: '',
        phone: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      createUser({
        ...formData,
        status: 'active',
      });
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      deleteUser(id);
    }
  };

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      admin: 'bg-red-500/20 text-red-400',
      manager: 'bg-purple-500/20 text-purple-400',
      analyst: 'bg-blue-500/20 text-blue-400',
      viewer: 'bg-slate-600 text-slate-300',
    };
    return colors[role];
  };

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      admin: 'Administrateur',
      manager: 'Manager',
      analyst: 'Analyste',
      viewer: 'Lecteur',
    };
    return labels[role];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestion des Utilisateurs</h1>
          <p className="text-slate-400 mt-2">Gérez les utilisateurs et leurs rôles</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Plus size={20} />
          <span>Nouvel Utilisateur</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard label="Total" value={users.length.toString()} icon="👥" />
        <KPICard label="Admins" value={users.filter((u) => u.role === 'admin').length.toString()} icon="🔐" />
        <KPICard label="Managers" value={users.filter((u) => u.role === 'manager').length.toString()} icon="👔" />
        <KPICard label="Analystes" value={users.filter((u) => u.role === 'analyst').length.toString()} icon="📊" />
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole((e.target.value || '') as UserRole | '')}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="">Tous les rôles</option>
            <option value="admin">Administrateur</option>
            <option value="manager">Manager</option>
            <option value="analyst">Analyste</option>
            <option value="viewer">Lecteur</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Département</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Rôle</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-700 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{user.avatar}</span>
                      <span className="font-semibold text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{user.email}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{user.department}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-8 w-full max-w-md space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white block mb-2">Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-white block mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-white block mb-2">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="analyst">Analyste</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrateur</option>
                  <option value="viewer">Lecteur</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-white block mb-2">Département</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all"
              >
                Enregistrer
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 p-6">
      <p className="text-sm text-slate-400 mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-white">{value}</p>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
