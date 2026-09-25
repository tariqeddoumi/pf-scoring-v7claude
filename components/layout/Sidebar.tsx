"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Users,
  Briefcase,
  CheckCircle,
  BookOpen,
  Settings,
  LogOut,
  Search,
  Bell,
  GitCompare,
  TrendingUp,
  LineChart,
  ScrollText,
  ChevronDown,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

interface Entree {
  icon: LucideIcon;
  label: string;
  href: string;
  description: string;
}

interface Groupe {
  id: string;
  titre: string;
  entrees: Entree[];
}

/**
 * Navigation principale, regroupée par tâche.
 *
 * Les douze destinations étaient présentées à plat, sur un pied d'égalité : la
 * personnalisation du tableau de bord voisinait avec les projets, et rien
 * n'indiquait par où commencer. Elles sont désormais rangées selon le moment du
 * travail où l'on s'en sert — suivre, instruire un dossier, analyser le portefeuille,
 * se référer. « Configurer le tableau » a rejoint l'écran qu'il configure.
 */
const GROUPES: Groupe[] = [
  {
    id: "suivi",
    titre: "Suivi",
    entrees: [
      {
        icon: BarChart3,
        label: "Tableau de bord",
        href: "/dashboard",
        description: "Vue d'ensemble du portefeuille",
      },
      {
        icon: Bell,
        label: "Alertes",
        href: "/alerts",
        description: "Points requérant une décision",
      },
    ],
  },
  {
    id: "dossiers",
    titre: "Dossiers",
    entrees: [
      {
        icon: Users,
        label: "Clients",
        href: "/clients",
        description: "Contreparties",
      },
      {
        icon: Briefcase,
        label: "Projets",
        href: "/projects",
        description: "Opérations à financer",
      },
      {
        icon: CheckCircle,
        label: "Évaluations",
        href: "/evaluations",
        description: "Scorings en cours et clos",
      },
    ],
  },
  {
    id: "analyse",
    titre: "Analyse",
    entrees: [
      {
        icon: Search,
        label: "Recherche",
        href: "/search",
        description: "Multi-critères",
      },
      {
        icon: GitCompare,
        label: "Comparaison",
        href: "/compare",
        description: "Projets côte à côte",
      },
      {
        icon: LineChart,
        label: "Analytique",
        href: "/analytics",
        description: "Tendances du portefeuille",
      },
      {
        icon: TrendingUp,
        label: "Monitoring",
        href: "/monitoring",
        description: "Performance post-clôture",
      },
    ],
  },
  {
    id: "reference",
    titre: "Référence",
    entrees: [
      {
        icon: BookOpen,
        label: "Méthodologie",
        href: "/methodology",
        description: "Modèle et barèmes",
      },
      {
        icon: ScrollText,
        label: "Journal d'audit",
        href: "/audit",
        description: "Historique des opérations",
      },
    ],
  },
];

const CLE_REPLIS = "pf_sidebar_groupes_replies";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [replies, setReplies] = useState<Set<string>>(new Set());

  const estActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  /** Groupe contenant l'écran courant : il reste toujours déplié. */
  const groupeCourant = useMemo(
    () => GROUPES.find((g) => g.entrees.some((e) => estActive(e.href)))?.id ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname]
  );

  // L'état de repli est un confort propre à chaque poste : il ne conditionne rien et
  // son absence, en navigation privée ou au premier usage, laisse tout déplié.
  useEffect(() => {
    try {
      const brut = localStorage.getItem(CLE_REPLIS);
      if (brut) setReplies(new Set(JSON.parse(brut) as string[]));
    } catch {
      /* stockage indisponible : tous les groupes restent dépliés */
    }
  }, []);

  const basculer = (id: string) => {
    setReplies((prec) => {
      const suivant = new Set(prec);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      try {
        localStorage.setItem(CLE_REPLIS, JSON.stringify(Array.from(suivant)));
      } catch {
        /* sans persistance, le repli vaut pour la session en cours */
      }
      return suivant;
    });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-card hover:bg-accent text-foreground border border-border rounded-lg transition-colors"
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-screen flex flex-col transition-all z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <nav
          className="flex-1 overflow-y-auto p-3 mt-12 md:mt-0 space-y-4"
          aria-label="Navigation principale"
        >
          {GROUPES.map((groupe) => {
            // Le groupe de l'écran courant ne se replie pas : masquer sa propre
            // position dans l'outil n'aide personne.
            const replie = replies.has(groupe.id) && groupe.id !== groupeCourant;

            return (
              <div key={groupe.id}>
                <button
                  onClick={() => basculer(groupe.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors"
                  aria-expanded={!replie}
                >
                  {groupe.titre}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${replie ? "-rotate-90" : ""}`}
                  />
                </button>

                {!replie && (
                  <div className="space-y-1 mt-1">
                    {groupe.entrees.map((item) => {
                      const Icon = item.icon;
                      const isActive = estActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                              : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          <Icon size={18} className="shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {item.label}
                            </div>
                            <div className="text-xs opacity-75 truncate">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          <Link
            href="/admin"
            onClick={() => setIsOpen(false)}
            aria-current={estActive("/admin") ? "page" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              estActive("/admin")
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <Settings size={18} />
            <span className="text-sm">Paramétrage</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-destructive rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
