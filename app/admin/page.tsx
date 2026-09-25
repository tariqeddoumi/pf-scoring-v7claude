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
  /** Famille de paramétrage : onze tuiles à plat ne disent pas par où commencer. */
  famille: FamilleAdmin;
}

type FamilleAdmin = "modele" | "referentiels" | "formulaires" | "exploitation";

/**
 * Les familles suivent la question que se pose l'administrateur : qu'est-ce que je
 * veux changer ? La façon dont on note, ce sur quoi on s'appuie pour noter, ce qu'on
 * demande à l'analyste de saisir, ou le fonctionnement de l'outil lui-même.
 */
const FAMILLES: { id: FamilleAdmin; titre: string; sousTitre: string }[] = [
  {
    id: "modele",
    titre: "Modèle de scoring",
    sousTitre: "Ce qui est noté, comment, et ce qui bloque",
  },
  {
    id: "referentiels",
    titre: "Référentiels",
    sousTitre: "Les données sur lesquelles le modèle s'appuie",
  },
  {
    id: "formulaires",
    titre: "Formulaires",
    sousTitre: "Ce qui est demandé à la saisie",
  },
  {
    id: "exploitation",
    titre: "Exploitation",
    sousTitre: "Utilisateurs, apparence et santé de l'outil",
  },
];

const ADMIN_SECTIONS: AdminSection[] = [
  {
    id: "configuration",
    famille: "exploitation",
    title: "Paramétrage de l'outil ★",
    description:
      "Nom affiché, logo, couleurs, police et thème — appliqués en direct dans toute l'application",
    href: "/admin/configuration",
    icon: "🎨",
    requiredRole: "system_admin",
  },
  {
    id: "scoring-granularity",
    famille: "modele",
    title: "Granularité du Scoring ★",
    description: "Configurez le niveau de saisie des scores (domaine, critère ou sous-critère) par domaine",
    href: "/admin/scoring/granularity",
    icon: "📐",
    requiredRole: "system_admin",
  },
  {
    id: "bareme",
    famille: "modele",
    title: "Barème de notation ★",
    description:
      "Correspondance score → note (AAA…D) appliquée par le moteur à chaque calcul",
    href: "/admin/bareme",
    icon: "🏷️",
    requiredRole: "system_admin",
  },
  {
    id: "regles",
    famille: "modele",
    title: "Règles et seuils rédhibitoires ★",
    description:
      "Vue d'ensemble des règles du modèle, dont les seuils NO-GO, et des règles sans effet",
    href: "/admin/regles",
    icon: "🚫",
    requiredRole: "system_admin",
  },
  {
    id: "secteurs",
    famille: "referentiels",
    title: "Calibrage sectoriel ★",
    description:
      "Facteurs de pondération par secteur, points d'alerte et tests de résistance",
    href: "/admin/secteurs",
    icon: "🏭",
    requiredRole: "system_admin",
  },
  {
    id: "scoring",
    famille: "modele",
    title: "Modèle de Scoring PF V7++",
    description: "Visualisez les domaines, critères et barèmes du modèle actif",
    href: "/admin/scoring",
    icon: "📊",
    requiredRole: "system_admin",
  },
  {
    id: "scoring-grid-v7pp",
    famille: "modele",
    title: "Paramétrage Grille V7++ ★",
    description: "Éditeur hiérarchique complet — domaines, critères, sous-critères, options et plages numériques",
    href: "/admin/scoring-grid-v7pp",
    icon: "🎛️",
    requiredRole: "system_admin",
  },
  {
    id: "country-risk",
    famille: "referentiels",
    title: "Risque Pays",
    description: "Configurez les scores de risque par pays",
    href: "/admin/country-risk",
    icon: "🌍",
    requiredRole: "system_admin",
  },
  {
    id: "diagnostic",
    famille: "exploitation",
    title: "Diagnostic Système",
    description: "Tests de santé et vérification de la configuration",
    href: "/admin/diagnostic",
    icon: "🔍",
    requiredRole: "system_admin",
  },
  {
    id: "users",
    famille: "exploitation",
    title: "Gestion des Utilisateurs",
    description: "Gérez les utilisateurs et leurs rôles",
    href: "/admin/users",
    icon: "👥",
    requiredRole: "system_admin",
  },
  {
    id: "dynamic-forms",
    famille: "formulaires",
    title: "Formulaires Dynamiques ★",
    description: "Activez les formulaires rendus depuis la base de données, sans code",
    href: "/admin/dynamic-forms",
    icon: "📝",
    requiredRole: "system_admin",
  },
  {
    id: "field-management",
    famille: "formulaires",
    title: "Gestion des Champs de Formulaire ★",
    description: "Personnalisez les champs, sections et options des formulaires",
    href: "/admin/field-management",
    icon: "🏷️",
    requiredRole: "system_admin",
  },
];

interface UserData {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  avatar?: string;
  createdAt?: string;
}

interface AdminPageState {
  loading: boolean;
  user: UserData | null;
  v8Enabled: boolean;
  modelVersion: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [state, setState] = useState<AdminPageState>({
    loading: true,
    user: null,
    v8Enabled: false,
    modelVersion: "V7++",
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiGet("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const userData: UserData = await res.json();

        // Vérifier que c'est admin ou manager
        if (userData.role !== "system_admin" && userData.role !== "risk_manager") {
          router.push("/dashboard");
          return;
        }

        // Check V8 status
        let v8Enabled = false;
        let modelVersion = "V7++";
        try {
          const v8Res = await apiGet("/api/admin/diagnostic/v8-status");
          if (v8Res.ok) {
            const v8Data = await v8Res.json();
            v8Enabled = v8Data.enabled || false;
            modelVersion = v8Enabled ? "V8" : "V7++";
          }
        } catch (e) {
          console.warn("Could not check V8 status:", e);
        }

        setState({
          loading: false,
          user: userData,
          v8Enabled,
          modelVersion,
        });
      } catch (error) {
        console.error("Erreur:", error);
        router.push("/login");
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
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

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!state.user) {
    return null;
  }

  const visibleSections = ADMIN_SECTIONS.filter(
    (s) =>
      !s.requiredRole ||
      s.requiredRole === state.user!.role ||
      state.user!.role === "system_admin"
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

        {/* Écrans de paramétrage, rangés par famille */}
        <div className="space-y-10">
          {FAMILLES.map((famille) => {
            const sections = visibleSections.filter((s) => s.famille === famille.id);
            if (sections.length === 0) return null;

            return (
              <section key={famille.id}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {famille.titre}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {famille.sousTitre}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sections.map((section) => (
                    <Link key={section.id} href={section.href} className="group">
                      <Card className="p-5 h-full hover:border-primary transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl shrink-0">{section.icon}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                              {section.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {section.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Quick Stats */}
        <Card className="mt-8 p-6">
          <h2 className="font-semibold mb-4">Résumé du Système</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Rôle Actuel</p>
              <p className="text-2xl font-bold capitalize">{state.user.role}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Domaines Actifs</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Modèle Actif</p>
              <p
                className={`text-2xl font-bold ${
                  state.v8Enabled ? "text-primary" : "text-warning"
                }`}
              >
                {state.modelVersion}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <p className="text-2xl font-bold text-success">✓ Actif</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
