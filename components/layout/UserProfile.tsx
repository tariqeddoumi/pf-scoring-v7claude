"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings, Users, BarChart3 } from "lucide-react";
import Link from "next/link";
import { hasMinimumRole } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/ui-constants";

interface Utilisateur {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
}

/**
 * Identité de l'utilisateur connecté, dans la barre supérieure.
 *
 * Deux défauts corrigés ici, tous deux invisibles à la lecture du code seul :
 *
 * — La réponse de /api/auth/me est un objet À PLAT ({ id, email, nom, … }), alors
 *   que ce composant lisait `data.data`. L'utilisateur valait donc toujours
 *   undefined : « Se connecter » s'affichait sur tous les écrans malgré une session
 *   ouverte, et le menu d'administration était inaccessible à tout le monde.
 *
 * — La déconnexion effaçait le cookie mais pas le jeton de localStorage. Or c'est ce
 *   jeton que les routes d'API lisent en en-tête Bearer : on restait authentifié
 *   après s'être déconnecté.
 */
export function UserProfile() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const corps = await res.json();
        // La route répond à plat ; `data` reste toléré au cas où l'enveloppe
        // standard lui serait appliquée un jour.
        const u = corps?.data ?? corps;
        if (!annule && u?.id) setUtilisateur(u as Utilisateur);
      } catch {
        /* session absente : l'invite de connexion s'affiche */
      } finally {
        if (!annule) setChargement(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, []);

  // Fermeture au clic extérieur et à la touche Échap.
  useEffect(() => {
    if (!ouvert) return;
    const clic = (e: MouseEvent) => {
      if (conteneur.current && !conteneur.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    };
    const touche = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    document.addEventListener("mousedown", clic);
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("mousedown", clic);
      document.removeEventListener("keydown", touche);
    };
  }, [ouvert]);

  const deconnexion = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // Le jeton local ouvre l'accès aux API indépendamment du cookie : sans cette
      // ligne, la déconnexion ne déconnecte rien.
      try {
        localStorage.removeItem("auth_token");
      } catch {
        /* stockage indisponible */
      }
      window.location.href = "/login";
    }
  }, []);

  if (chargement) {
    return <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />;
  }

  if (!utilisateur) {
    return (
      <Link
        href="/login"
        className="px-3 py-2 text-sm font-medium text-primary hover:underline"
      >
        Se connecter
      </Link>
    );
  }

  const initiales =
    `${utilisateur.prenom?.[0] ?? ""}${utilisateur.nom?.[0] ?? ""}`.toUpperCase() || "?";
  const estAdmin = hasMinimumRole(utilisateur.role, "scoring_admin");

  return (
    <div className="relative" ref={conteneur}>
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {initiales}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-foreground">
            {utilisateur.prenom} {utilisateur.nom}
          </span>
          <span className="block text-xs leading-tight text-muted-foreground">
            {ROLE_LABELS[utilisateur.role] ?? utilisateur.role}
          </span>
        </span>
        <ChevronDown
          size={15}
          className={`text-muted-foreground transition-transform ${ouvert ? "rotate-180" : ""}`}
        />
      </button>

      {ouvert && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-60 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">Connecté en tant que</p>
            <p className="truncate text-sm font-medium text-foreground">
              {utilisateur.email}
            </p>
          </div>

          {estAdmin && (
            <div className="border-b border-border py-1">
              {[
                { href: "/admin", icone: Settings, texte: "Paramétrage" },
                { href: "/admin/users", icone: Users, texte: "Utilisateurs" },
                { href: "/admin/scoring-grid-v7pp", icone: BarChart3, texte: "Grille de scoring" },
              ].map(({ href, icone: Icone, texte }) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  onClick={() => setOuvert(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <Icone size={15} className="text-muted-foreground" />
                  {texte}
                </Link>
              ))}
            </div>
          )}

          <button
            role="menuitem"
            onClick={deconnexion}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-accent"
          >
            <LogOut size={15} />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
