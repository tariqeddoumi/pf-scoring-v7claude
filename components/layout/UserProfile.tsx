'use client';

import { useEffect, useState } from 'react';
import { LogOut, Settings, Users, BarChart3, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  avatar?: string;
  createdAt: string;
}

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.data);
        } else {
          console.log('Not authenticated');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-10 w-32 bg-slate-700 rounded animate-pulse"></div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        Se connecter
      </Link>
    );
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    manager: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    analyst: 'bg-green-500/20 text-green-400 border-green-500/30',
    viewer: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const roleLabelsFR: Record<string, string> = {
    admin: 'Administrateur',
    manager: 'Gestionnaire',
    analyst: 'Analyste',
    viewer: 'Lecteur',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors border border-slate-600"
      >
        <div className="text-right">
          <div className="font-medium text-white">
            {user.prenom} {user.nom}
          </div>
          <div className={`text-xs px-2 py-0.5 rounded border ${roleColors[user.role]}`}>
            {roleLabelsFR[user.role]}
          </div>
        </div>
        <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-xs text-slate-400">Connecté en tant que</p>
            <p className="text-sm font-medium text-white">{user.email}</p>
          </div>

          {/* Admin Menu */}
          {user.role === 'admin' && (
            <>
              <Link
                href="/admin/users"
                className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border-b border-slate-700"
                onClick={() => setDropdownOpen(false)}
              >
                <Users size={16} />
                Gestion des utilisateurs
              </Link>
              <Link
                href="/admin/scoring-grid"
                className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border-b border-slate-700"
                onClick={() => setDropdownOpen(false)}
              >
                <BarChart3 size={16} />
                Paramétrage des grilles
              </Link>
            </>
          )}

          {/* Settings */}
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border-b border-slate-700"
            onClick={() => setDropdownOpen(false)}
          >
            <Settings size={16} />
            Paramètres
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
