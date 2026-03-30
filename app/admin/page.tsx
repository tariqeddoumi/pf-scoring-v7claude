"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AdminSection {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
}

const ADMIN_SECTIONS: AdminSection[] = [
  {
    id: "scoring",
    title: "Configuration du Scoring",
    description: "Gérez les domaines, critères et échelles de notation",
    href: "/admin/scoring-config",
    icon: "⚙️",
  },
  {
    id: "country-risk",
    title: "Risque Pays",
    description: "Configurez les scores de risque par pays",
    href: "/admin/country-risk",
    icon: "🌍",
  },
  {
    id: "auth",
    title: "Authentification",
    description: "Paramétrez les méthodes d'authentification et les politiques",
    href: "/admin/auth-settings",
    icon: "🔐",
  },
  {
    id: "system",
    title: "Paramètres Système",
    description: "Configurez les paramètres généraux de l'application",
    href: "/admin/system-settings",
    icon: "🛠️",
  },
  {
    id: "users",
    title: "Gestion des Utilisateurs",
    description: "Gérez les utilisateurs et leurs rôles",
    href: "/admin/users",
    icon: "👥",
  },
  {
    id: "audit",
    title: "Journal d'Audit",
    description: "Consultez l'historique complet des modifications",
    href: "/admin/audit-logs",
    icon: "📋",
  },
];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check admin access
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Panneau d'Administration</h1>
            <p className="mt-2 text-muted-foreground">
              Paramétrez tous les aspects de l'application
            </p>
          </div>
        </div>

        {/* Security Warning */}
        <Card className="mb-8 p-6 bg-amber-950/30 border-amber-700">
          <p className="text-amber-200 text-sm font-medium">
            ⚠️ Seuls les administrateurs peuvent accéder à cette section. Toutes
            les modifications sont enregistrées dans le journal d'audit.
          </p>
        </Card>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ADMIN_SECTIONS.map((section) => (
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
              <p className="text-sm text-muted-foreground">Domaines Actifs</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utilisateurs</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Projets</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pays Configurés</p>
              <p className="text-2xl font-bold">13</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
