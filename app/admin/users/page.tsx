"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Edit2, Shield } from "lucide-react";

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: "admin" | "manager" | "analyst" | "viewer";
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.data || []);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des utilisateurs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
      setUsers(users.filter((u) => u.id !== userId));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError("Erreur lors de la suppression");
      console.error(err);
    }
  };

  const roleLabelsFR: Record<string, string> = {
    admin: "Administrateur",
    manager: "Gestionnaire",
    analyst: "Analyste",
    viewer: "Lecteur",
  };

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/20 text-red-400",
    manager: "bg-blue-500/20 text-blue-400",
    analyst: "bg-green-500/20 text-green-400",
    viewer: "bg-slate-500/20 text-slate-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Gestion des utilisateurs
            </h1>
            <p className="text-slate-400 mt-2">
              Gérez les comptes utilisateurs et leurs rôles
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Chargement...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Aucun utilisateur trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-white">
                      {user.prenom} {user.nom}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}
                      >
                        {roleLabelsFR[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </Link>
                        {showDeleteConfirm === user.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="px-2 py-1 text-xs bg-slate-600 text-white rounded hover:bg-slate-700"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowDeleteConfirm(user.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-400">
            <p className="font-semibold mb-1">Rôles disponibles</p>
            <ul className="space-y-1 text-xs">
              <li>
                <strong>Administrateur :</strong> Accès complet, gestion des
                utilisateurs et paramètres
              </li>
              <li>
                <strong>Gestionnaire :</strong> Gestion des clients et projets
              </li>
              <li>
                <strong>Analyste :</strong> Créer et modifier les évaluations
              </li>
              <li>
                <strong>Lecteur :</strong> Accès en lecture seule
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
