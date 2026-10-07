"use client";

import { createContext, useContext } from "react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { peutVoirScores } from "@/lib/score-visibility";

/**
 * Visibilité des scores à l'écran (voir lib/score-visibility.ts).
 * Tant que l'utilisateur n'est pas chargé, les scores sont masqués : on ne montre
 * jamais par défaut ce que le serveur retire de toute façon.
 */
const Contexte = createContext<boolean>(false);

export function VisibiliteScoresProvider({ children }: { children: React.ReactNode }) {
  const { user } = useCurrentUser();
  return <Contexte.Provider value={peutVoirScores(user?.role)}>{children}</Contexte.Provider>;
}

export function useVoirScores(): boolean {
  return useContext(Contexte);
}

/** Affiche son contenu seulement pour les rôles qui voient les scores. */
export function SiScores({ children, sinon = null }: { children: React.ReactNode; sinon?: React.ReactNode }) {
  return <>{useVoirScores() ? children : sinon}</>;
}

/** Page entièrement consacrée aux scores : remplacée par un message pour les autres rôles. */
export function PageReserveeScores({ titre, children }: { titre: string; children: React.ReactNode }) {
  if (useVoirScores()) return <>{children}</>;
  return (
    <div className="mx-auto mt-16 max-w-lg rounded-lg border border-border bg-card px-6 py-8 text-center">
      <h1 className="text-lg font-semibold text-foreground">{titre}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Cet écran présente les notes et scores des dossiers. Il est réservé aux administrateurs, aux responsables des
        risques et aux membres du comité.
      </p>
    </div>
  );
}
