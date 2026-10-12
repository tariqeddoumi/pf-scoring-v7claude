import { AsyncLocalStorage } from "async_hooks";
import type { Perimetre } from "./perimetre";

/**
 * Périmètre de la requête en cours, posé par withAuth et lu par le client Prisma
 * (lib/prisma-client.ts) qui filtre alors toutes les requêtes sur les dossiers.
 * Hors requête authentifiée (scripts, tâches système, connexion), aucun filtre.
 */
export const contexteAcces = new AsyncLocalStorage<Perimetre>();

export function perimetreCourant(): Perimetre | undefined {
  return contexteAcces.getStore();
}

/** Exécute une fonction hors de tout périmètre (vérifications internes). */
export function sansPerimetre<T>(f: () => T): T {
  return contexteAcces.exit(f);
}
