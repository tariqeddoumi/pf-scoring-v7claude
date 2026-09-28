"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  CheckCircle,
  GitCompare,
  LineChart,
  ScrollText,
  Search,
  Settings,
  TrendingUp,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { useAppConfig } from "@/components/providers/app-config-provider";

interface Entree {
  icone: LucideIcon;
  libelle: string;
  href: string;
  /** Clé du compteur affiché à droite de l'entrée, s'il y en a un. */
  compteur?: "alertes" | "aTraiter";
  /** Un compteur d'alerte est rouge ; les autres sont neutres. */
  alerte?: boolean;
}

const GROUPES: { titre: string; entrees: Entree[] }[] = [
  {
    titre: "Suivi",
    entrees: [
      { icone: BarChart3, libelle: "Tableau de bord", href: "/dashboard" },
      { icone: Bell, libelle: "Alertes", href: "/alerts", compteur: "alertes", alerte: true },
    ],
  },
  {
    titre: "Dossiers",
    entrees: [
      { icone: Users, libelle: "Clients", href: "/clients" },
      { icone: Briefcase, libelle: "Projets", href: "/projects" },
      { icone: CheckCircle, libelle: "Évaluations", href: "/evaluations", compteur: "aTraiter" },
    ],
  },
  {
    titre: "Analyse",
    entrees: [
      { icone: Search, libelle: "Recherche", href: "/search" },
      { icone: GitCompare, libelle: "Comparaison", href: "/compare" },
      { icone: LineChart, libelle: "Analytique", href: "/analytics" },
      { icone: TrendingUp, libelle: "Monitoring", href: "/monitoring" },
    ],
  },
  {
    titre: "Référence",
    entrees: [
      { icone: BookOpen, libelle: "Méthodologie", href: "/methodology" },
      { icone: ScrollText, libelle: "Journal d'audit", href: "/audit" },
    ],
  },
];

/**
 * Navigation principale.
 *
 * Trois changements par rapport à la version précédente :
 *
 * — Elle est collante et tient dans la hauteur de l'écran. Elle était en
 *   min-h-screen non collante : sur un tableau de bord de 2 300 px, atteindre
 *   « Paramétrage » ou « Déconnexion » demandait de dérouler toute la page.
 * — Chaque entrée tient sur une ligne. La description en seconde ligne était tronquée
 *   (« Points requérant une décisi… ») et portait la barre à 800 px de haut.
 * — Les entrées qui appellent une action portent un compteur : ce qui demande une
 *   décision se voit sans ouvrir l'écran.
 *
 * « Paramétrage » n'est plus ici : il vit dans le menu utilisateur, qui applique le
 * contrôle de rôle. La barre l'affichait à tout le monde.
 */
export function Sidebar({
  ouvertMobile = false,
  onFermer,
}: {
  ouvertMobile?: boolean;
  onFermer?: () => void;
}) {
  const pathname = usePathname() || "/";
  const { config } = useAppConfig();
  const nomAppli = config.APP_NAME || "Scoring PF";
  const [compteurs, setCompteurs] = useState<{ alertes: number; aTraiter: number }>({
    alertes: 0,
    aTraiter: 0,
  });

  // Les compteurs sont un confort : leur échec ne doit rien casser ni rien afficher.
  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const [rAlertes, rEvals] = await Promise.all([
          apiGet("/api/alerts"),
          apiGet("/api/evaluations?limit=200"),
        ]);
        const alertes = rAlertes.ok ? ((await rAlertes.json()).data ?? []) : [];
        const evals = rEvals.ok ? ((await rEvals.json()).data ?? []) : [];
        if (annule) return;
        setCompteurs({
          alertes: Array.isArray(alertes)
            ? alertes.filter((a: { severite?: string }) => a.severite === "critique").length
            : 0,
          aTraiter: Array.isArray(evals)
            ? evals.filter((e: { status?: string }) =>
                e.status === "brouillon" || e.status === "soumis" || e.status === "soumise"
              ).length
            : 0,
        });
      } catch {
        /* compteurs indisponibles : les entrées s'affichent sans pastille */
      }
    })();
    return () => {
      annule = true;
    };
  }, [pathname]);

  const estActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const contenu = (
    <>
      <div className="flex h-14 items-center gap-2.5 px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
            {nomAppli.slice(0, 2).toUpperCase()}
          </span>
          <span className="text-[15px] font-semibold text-sidebar-accent-foreground">
            {nomAppli}
          </span>
        </Link>
        <button
          onClick={onFermer}
          aria-label="Fermer le menu"
          className="ml-auto rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent md:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto px-2.5 pb-3">
        {GROUPES.map((groupe) => (
          <div key={groupe.titre}>
            <p className="px-2.5 pb-1.5 pt-4 text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
              {groupe.titre}
            </p>
            {groupe.entrees.map((e) => {
              const Icone = e.icone;
              const active = estActive(e.href);
              const n = e.compteur ? compteurs[e.compteur] : 0;
              return (
                <Link
                  key={e.href}
                  href={e.href}
                  aria-current={active ? "page" : undefined}
                  className={`mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13.5px] transition-colors ${
                    active
                      ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icone size={16} className="shrink-0 opacity-90" />
                  <span className="truncate">{e.libelle}</span>
                  {n > 0 && (
                    <span
                      className={`ml-auto min-w-[18px] rounded-full px-1.5 text-center text-[10.5px] font-bold leading-[17px] ${
                        e.alerte
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-sidebar-accent-foreground/15 text-sidebar-accent-foreground"
                      }`}
                    >
                      {n}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-[12px] text-sidebar-foreground/70 transition-colors hover:text-sidebar-accent-foreground"
        >
          <Settings size={13} />
          Paramétrage
        </Link>
      </div>
    </>
  );

  return (
    <>
      {ouvertMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onFermer}
          aria-hidden
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[232px] shrink-0 flex-col bg-sidebar transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          ouvertMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {contenu}
      </aside>
    </>
  );
}
