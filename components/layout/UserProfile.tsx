"use client";

import { useEffect, useState } from "react";
import { LogOut, Settings, Users, BarChart3, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { hasMinimumRole } from "@/lib/permissions";

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: "admin" | "manager" | "analyst" | "viewer";
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
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.data);
        } else {
          console.log("Not authenticated");
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

  if (loading) {
    return <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>;
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
    admin: "bg-red-500/20 text-red-400 border-red-500/30",
    manager: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    analyst: "bg-green-500/20 text-green-400 border-green-500/30",
    viewer: "bg-secondary/20 text-muted-foreground border-input/30",
  };

  const roleLabelsFR: Record<string, string> = {
    admin: "Administrateur",
    manager: "Gestionnaire",
    analyst: "Analyste",
    viewer: "Lecteur",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-3 px-3 py-2 text-sm text-secondary-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors border border-input"
      >
        <div className="text-right">
          <div className="font-medium text-foreground">
            {user.prenom} {user.nom}
          </div>
          <div
            className={`text-xs px-2 py-0.5 rounded border ${roleColors[user.role]}`}
          >
            {roleLabelsFR[user.role]}
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground">Connecté en tant que</p>
            <p className="text-sm font-medium text-foreground">{user.email}</p>
          </div>

          {/* Admin Menu — même seuil de rôle que withAdminAuth côté API */}
          {hasMinimumRole(user.role, "scoring_admin") && (
            <>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-3 text-sm text-secondary-foreground hover:text-foreground hover:bg-accent transition-colors border-b border-border"
                onClick={() => setDropdownOpen(false)}
              >
                <Settings size={16} />
                Paramétrage
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-2 px-4 py-3 text-sm text-secondary-foreground hover:text-foreground hover:bg-accent transition-colors border-b border-border"
                onClick={() => setDropdownOpen(false)}
              >
                <Users size={16} />
                Gestion des utilisateurs
              </Link>
              <Link
                href="/admin/scoring-grid-v7pp"
                className="flex items-center gap-2 px-4 py-3 text-sm text-secondary-foreground hover:text-foreground hover:bg-accent transition-colors border-b border-border"
                onClick={() => setDropdownOpen(false)}
              >
                <BarChart3 size={16} />
                Paramétrage des grilles
              </Link>
            </>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-accent transition-colors"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
