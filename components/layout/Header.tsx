"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, Menu, X, User, Settings } from "lucide-react";

interface CurrentUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: "admin" | "manager" | "analyst" | "viewer";
}

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user || data);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/20 text-red-400",
    manager: "bg-blue-500/20 text-blue-400",
    analyst: "bg-green-500/20 text-green-400",
    viewer: "bg-slate-500/20 text-slate-400",
  };

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
    analyst: "Analyste",
    viewer: "Lecteur",
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800">
      <div className="px-4 py-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-cyan-400">PF</div>
            <span className="hidden md:inline text-white font-semibold">
              Scoring V7++
            </span>
          </Link>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="text-slate-400">Chargement...</div>
            ) : user ? (
              <>
                {/* Desktop User Info */}
                <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                  <User size={18} className="text-cyan-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {user.prenom} {user.nom}
                    </p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      roleColors[user.role]
                    }`}
                  >
                    {roleLabels[user.role]}
                  </span>
                </div>

                {/* Admin Link (if admin) */}
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="hidden md:inline-flex items-center space-x-1 px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    title="Administration"
                  >
                    <Settings size={18} />
                    <span className="text-sm">Admin</span>
                  </Link>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="hidden md:inline-flex items-center space-x-1 px-4 py-2 text-slate-400 hover:text-red-400 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut size={18} />
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-slate-400 hover:text-white"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
                >
                  Connexion
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && user && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-700 space-y-2">
            <div className="px-4 py-3 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-sm font-semibold text-white">
                {user.prenom} {user.nom}
              </p>
              <p className="text-xs text-slate-400 mb-2">{user.email}</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  roleColors[user.role]
                }`}
              >
                {roleLabels[user.role]}
              </span>
            </div>

            {user.role === "admin" && (
              <Link
                href="/admin"
                className="block px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Administration
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
