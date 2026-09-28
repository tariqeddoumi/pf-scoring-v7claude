"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

/**
 * Cadre de l'application : menu latéral pleine hauteur, barre supérieure, contenu.
 *
 * Le cadre était auparavant empilé — barre supérieure en travers de toute la largeur,
 * puis menu latéral en dessous — et comportait deux boutons de menu distincts sur
 * mobile, qui ouvraient deux panneaux différents. Il n'en reste qu'un, dont l'état
 * est tenu ici et partagé entre la barre et le menu.
 *
 * L'écran de connexion n'a pas de cadre : l'afficher reviendrait à proposer une
 * navigation à quelqu'un qui n'est pas encore authentifié.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [menuOuvert, setMenuOuvert] = useState(false);

  const fermer = useCallback(() => setMenuOuvert(false), []);

  // Le panneau mobile se referme dès qu'on change d'écran.
  useEffect(() => {
    setMenuOuvert(false);
  }, [pathname]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar ouvertMobile={menuOuvert} onFermer={fermer} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onOuvrirMenu={() => setMenuOuvert(true)} />
        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
