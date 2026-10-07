"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { UserProfile } from "./UserProfile";

/**
 * Barre supérieure.
 *
 * Elle portait six liens horizontaux qui répétaient le menu latéral, sans état actif :
 * deux navigations concurrentes, et rien n'indiquait laquelle faisait foi. Le menu
 * latéral est désormais la seule navigation ; la barre ne garde que ce qui est utile
 * partout — où l'on se trouve, la recherche, et qui l'on est.
 */

/** Libellés des segments d'URL pour le fil d'Ariane. */
const SEGMENTS: Record<string, string> = {
  dashboard: "Tableau de bord",
  "dashboard-config": "Personnalisation",
  clients: "Clients",
  projects: "Projets",
  evaluations: "Évaluations",
  scoring: "Scoring",
  saisie: "Saisie",
  results: "Résultats",
  new: "Nouveau",
  edit: "Modification",
  search: "Recherche",
  compare: "Comparaison",
  analytics: "Analytique",
  monitoring: "Monitoring",
  alerts: "Alertes",
  audit: "Journal d'audit",
  methodology: "Méthodologie",
  workflows: "Circuits de validation",
  admin: "Paramétrage",
  bareme: "Barème de notation",
  regles: "Règles et seuils",
  secteurs: "Calibrage sectoriel",
  users: "Utilisateurs",
  configuration: "Paramétrage de l'outil",
  diagnostic: "Diagnostic",
  granularity: "Granularité",
  builder: "Constructeur",
  "grille-scoring": "Grille de scoring",
  "country-risk": "Risque pays",
  "dynamic-forms": "Formulaires dynamiques",
  "field-management": "Champs de formulaire",
};

/** Un segment qui ressemble à un identifiant n'a pas sa place dans le fil. */
function estIdentifiant(s: string): boolean {
  return /^[0-9a-f-]{8,}$/i.test(s) || /^[a-z]-\d+$/i.test(s);
}

export function Navbar({ onOuvrirMenu }: { onOuvrirMenu?: () => void }) {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);

  const fil = segments
    .filter((s) => !estIdentifiant(s))
    .map((s, i, liste) => ({
      texte: SEGMENTS[s] ?? s,
      dernier: i === liste.length - 1,
    }));

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
      <button
        onClick={onOuvrirMenu}
        aria-label="Ouvrir le menu"
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
      >
        <Menu size={20} />
      </button>

      <nav aria-label="Fil d'Ariane" className="min-w-0 flex-1 truncate text-sm">
        {fil.length === 0 ? (
          <span className="font-medium text-foreground">Accueil</span>
        ) : (
          fil.map((f, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1.5 text-muted-foreground">›</span>}
              <span
                className={
                  f.dernier ? "font-medium text-foreground" : "text-muted-foreground"
                }
              >
                {f.texte}
              </span>
            </span>
          ))
        )}
      </nav>

      <Link
        href="/search"
        className="hidden h-9 w-64 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-muted-foreground transition-colors hover:border-ring lg:flex"
      >
        <Search size={15} />
        Rechercher un client, un projet…
      </Link>

      <UserProfile />
    </header>
  );
}
