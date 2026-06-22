"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Edit2, Mail, Shield, Calendar } from "lucide-react";
import { apiGet } from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: "system_admin" | "scoring_admin" | "risk_manager" | "committee_member" | "risk_analyst" | "auditor" | "read_only";
  avatar?: string;
  createdAt: string;
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        const { id } = await params;
        setUserId(id);
        const response = await apiGet(`/api/users/${id}`);
        if (!response.ok) throw new Error("Failed to fetch user");
        const data = await response.json();
        setUser(data.data || data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    resolveAndFetch();
  }, [params]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Chargement de l'utilisateur...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Link
          href="/users"
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft size={20} />
          <span>Retour aux utilisateurs</span>
        </Link>
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error || "Utilisateur non trouvé"}
        </div>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/20 text-red-400",
    manager: "bg-blue-500/20 text-blue-400",
    analyst: "bg-green-500/20 text-green-400",
    viewer: "bg-slate-500/20 text-slate-400",
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrateur",
    manager: "Gestionnaire",
    analyst: "Analyste",
    viewer: "Lecteur",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/users"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {user.nom} {user.prenom}
            </h1>
            <p className="text-slate-400 mt-1 text-sm">ID: {user.id}</p>
          </div>
        </div>
        <button
          onClick={() => userId && router.push(`/users/${userId}/edit`)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Edit2 size={20} />
          <span>Modifier</span>
        </button>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Email */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Mail size={16} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Email
            </p>
          </div>
          <p className="mt-2 text-white break-all">{user.email}</p>
        </div>

        {/* Role */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Shield size={16} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Rôle
            </p>
          </div>
          <p className="mt-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${roleColors[user.role]}`}
            >
              {roleLabels[user.role]}
            </span>
          </p>
        </div>

        {/* Date de création */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Créé le
            </p>
          </div>
          <p className="mt-2 text-white">
            {new Date(user.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>

      {/* User Details Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Informations complètes
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Nom complet
            </p>
            <p className="mt-1 text-white">
              {user.nom} {user.prenom}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Adresse email
            </p>
            <p className="mt-1 text-white">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Rôle d'accès
            </p>
            <p className="mt-1">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${roleColors[user.role]}`}
              >
                {roleLabels[user.role]}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href="/users"
          className="inline-flex items-center space-x-2 px-4 py-2 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
      </div>
    </div>
  );
}
