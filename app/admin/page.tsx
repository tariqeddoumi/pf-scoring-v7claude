"use client";

import { useState, useEffect } from "react";
import { apiGet } from "@/lib/api-client";
import { hasMinimumRole, type UserRole } from "@/lib/permissions";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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
    requiredRole: "scoring_admin",
  },
  {
    id: "bareme",
    famille: "modele",
    title: "Barème de notation ★",
    description:
      "Correspondance score → note (AAA…D) appliquée par le moteur à chaque calcul",
    href: "/admin/bareme",
    icon: "🏷️",
    requiredRole: "scoring_admin",
  },
  {
    id: "regles",
    famille: "modele",
    title: "Règles et seuils rédhibitoires ★",
    description:
      "Vue d'ensemble des règles du modèle, dont les seuils NO-GO, et des règles sans effet",
    href: "/admin/regles",
    icon: "🚫",
    requiredRole: "scoring_admin",
  },
  {
    id: "secteurs",
    famille: "referentiels",
    title: "Calibrage sectoriel ★",
    description:
      "Facteurs de pondération par secteur, points d'alerte et tests de résistance",
    href: "/admin/secteurs",
    icon: "🏭",
    requiredRole: "scoring_admin",
  },
  {
    id: "scoring",
    famille: "modele",
    title: "Modèle de scoring PF",
    description: "Visualisez les domaines, critères et barèmes du modèle actif",
    href: "/admin/scoring",
    icon: "📊",
    requiredRole: "scoring_admin",
  },
  {
    id: "grille-scoring",
    famille: "modele",
    title: "Paramétrage de la grille ★",
    description: "Éditeur hiérarchique complet — domaines, critères, sous-critères, options et plages numériques",
    href: "/admin/grille-scoring",
    icon: "🎛️",
    requiredRole: "scoring_admin",
  },
  {
    id: "country-risk",
    famille: "referentiels",
    title: "Risque Pays",
    description: "Configurez les scores de risque par pays",
    href: "/admin/country-risk",
    icon: "🌍",
    requiredRole: "scoring_admin",
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
    requiredRole: "scoring_admin",
  },
  {
    id: "field-management",
    famille: "formulaires",
    title: "Gestion des Champs de Formulaire ★",
    description: "Personnalisez les champs, sections et options des formulaires",
    href: "/admin/field-management",
    icon: "🏷️",
    requiredRole: "scoring_admin",
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
  /** Version publiée du modèle, lue du modèle lui-même. */
  modelVersion: string;
  /** Domaines actifs de cette version. */
  domaines: number | null;
  criteres: number | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [state, setState] = useState<AdminPageState>({
    loading: true,
    user: null,
    modelVersion: "—",
    domaines: null,
    criteres: null,
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
        // L'administrateur du modèle — celui à qui ces écrans s'adressent — était
        // renvoyé au tableau de bord, tandis que le gestionnaire de risque entrait
        // sur une page dont toutes les sections lui étaient masquées.
        if (!hasMinimumRole(userData.role as UserRole, "scoring_admin")) {
          router.push("/dashboard");
          return;
        }

        // Le résumé annonçait « V8 » ou « V7++ » d'après une route de diagnostic qui
        // ne dit que l'état du calibrage sectoriel, et « Domaines actifs : 8 » en dur
        // alors que le modèle publié en compte neuf. Tout vient maintenant du modèle.
        let modelVersion = "—";
        let domaines: number | null = null;
        let criteres: number | null = null;
        try {
          const resModele = await apiGet("/api/methodology");
          if (resModele.ok) {
            const m = (await resModele.json()).data;
            modelVersion = m?.version?.label ?? `Version ${m?.version?.numero ?? "?"}`;
            domaines = m?.volumetrie?.domaines ?? null;
            criteres = m?.volumetrie?.criteres ?? null;
          }
        } catch (e) {
          console.warn("Modèle publié illisible :", e);
        }

        setState({
          loading: false,
          user: userData,
          modelVersion,
          domaines,
          criteres,
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

  if (state.loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  if (!state.user) {
    return null;
  }

  const visibleSections = ADMIN_SECTIONS.filter(
    (s) =>
      !s.requiredRole ||
      hasMinimumRole(state.user!.role as UserRole, s.requiredRole as UserRole)
  );

  return (
    <div>
      <div>
        {/* L'écran composait son propre cadre — pleine hauteur, largeur maximale,
            bouton de déconnexion — alors qu'il vit déjà dans la coque de
            l'application, qui porte la navigation et le profil. */}
        <PageHeader
          titre="Paramétrage"
          description="Modèle de scoring, référentiels et exploitation de l'outil"
          retour={{ href: "/dashboard", libelle: "Tableau de bord" }}
        />

        <p className="mb-6 rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3 text-sm text-warning">
          Ces écrans modifient la façon dont les dossiers sont notés. Toute
          modification est consignée au journal d&apos;audit.
        </p>

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
              <p className="text-sm text-muted-foreground">Domaines actifs</p>
              <p className="text-2xl font-bold">{state.domaines ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critères</p>
              <p className="text-2xl font-bold">{state.criteres ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Version publiée</p>
              <p className="text-2xl font-bold text-foreground">{state.modelVersion}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
