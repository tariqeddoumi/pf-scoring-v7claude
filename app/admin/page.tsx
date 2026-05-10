"use client";

import { useState, useEffect } from "react";
import { apiGet, apiPost } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AdminSection {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  requiredRole?: string;
}

const ADMIN_SECTIONS: AdminSection[] = [
  {
    id: "scoring",
    title: "Modèle de Scoring PF V7++",
    description: "Visualisez les domaines, critères et barèmes du modèle actif",
    href: "/admin/scoring",
    icon: "📊",
    requiredRole: "system_admin",
  },
  {
    id: "scoring-grid-v7pp",
    title: "Paramétrage Grille V7++ ★",
    description: "Éditeur hiérarchique complet — domaines, critères, sous-critères, options et plages numériques",
    href: "/admin/scoring-grid-v7pp",
    icon: "🎛️",
    requiredRole: "system_admin",
  },
  {
    id: "scoring-grid",
    title: "Grille de Scoring (legacy)",
    description: "Ancienne grille — critères plats sans hiérarchie",
    href: "/admin/scoring-grid",
    icon: "⚙️",
    requiredRole: "system_admin",
  },
  {
    id: "country-risk",
    title: "Risque Pays",
    description: "Configurez les scores de risque par pays",
    href: "/admin/country-risk",
    icon: "🌍",
    requiredRole: "system_admin",
  },
  {
    id: "auth",
    title: "Authentification",
    description: "Paramétrez les méthodes d'authentification et les politiques",
    href: "/admin/auth-settings",
    icon: "🔐",
    requiredRole: "system_admin",
  },
  {
    id: "system",
    title: "Paramètres Système",
    description: "Configurez les paramètres généraux de l'application",
    href: "/admin/system-settings",
    icon: "🛠️",
    requiredRole: "system_admin",
  },
  {
    id: "diagnostic",
    title: "Diagnostic Système",
    description: "Tests de santé et vérification de la configuration",
    href: "/admin/diagnostic",
    icon: "🔍",
    requiredRole: "system_admin",
  },
  {
    id: "users",
    title: "Gestion des Utilisateurs",
    description: "Gérez les utilisateurs et leurs rôles",
    href: "/admin/users",
    icon: "👥",
    requiredRole: "system_admin",
  },
  {
    id: "audit",
    title: "Journal d'Audit",
    description: "Consultez l'historique complet des modifications",
    href: "/admin/audit-logs",
    icon: "📋",
    requiredRole: "risk_manager",
  },
];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiGet("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const userData = await res.json();

        // Vérifier que c'est admin ou manager
        if (userData.role !== "system_admin" && userData.role !== "risk_manager") {
          router.push("/dashboard");
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error("Erreur:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiPost("/api/auth/logout");
      router.push("/login");
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const visibleSections = ADMIN_SECTIONS.filter(
    (s) =>
      !s.requiredRole || s.requiredRole === user.role || user.role === "system_admin"
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">
                Panneau d&apos;Administration
              </h1>
              <p className="mt-2 text-muted-foreground">
                Paramétrez tous les aspects de l&apos;application
              </p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Déconnexion
          </Button>
        </div>

        {/* Security Warning */}
        <Card className="mb-8 p-6 bg-amber-950/30 border-amber-700">
          <p className="text-amber-200 text-sm font-medium">
            ⚠️ Seuls les administrateurs peuvent accéder à cette section. Toutes
            les modifications sont enregistrées dans le journal d&apos;audit.
          </p>
        </Card>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleSections.map((section) => (
            <Link key={section.id} href={section.href}>
              <Card className="p-6 h-full hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{section.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    Configurer →
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <Card className="mt-8 p-6">
          <h2 className="font-semibold mb-4">Résumé du Système</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Rôle Actuel</p>
              <p className="text-2xl font-bold capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Domaines Actifs</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pays Configurés</p>
              <p className="text-2xl font-bold">13</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <p className="text-2xl font-bold text-green-400">✓ Actif</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
