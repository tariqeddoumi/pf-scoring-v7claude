/**
 * Clé unique de signature et de vérification des jetons de session.
 *
 * La connexion signait avec JWT_SECRET (ou, à défaut, une clé constante écrite dans
 * le code), alors que le contrôle des appels API vérifiait d'abord avec
 * SUPABASE_JWT_SECRET. Les deux côtés lisent désormais la même clé, dans le même
 * ordre, et aucune clé de repli n'existe en production : sans clé configurée, la
 * signature et la vérification échouent au lieu d'utiliser une valeur publique.
 *
 * La lecture est paresseuse : la compilation (next build) ne doit pas exiger la clé.
 */
const CLE_DEVELOPPEMENT = "dev-secret-key-change-in-production";

export function lireSecretJwt(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.JWT_SECRET || env.SUPABASE_JWT_SECRET;
  if (secret) return secret;
  if (env.NODE_ENV === "production") {
    throw new Error("FATAL : JWT_SECRET doit être défini en production.");
  }
  return CLE_DEVELOPPEMENT;
}

let cache: { brut: string; octets: Uint8Array } | null = null;

export function secretJwt(): Uint8Array {
  const brut = lireSecretJwt();
  if (!cache || cache.brut !== brut) {
    cache = { brut, octets: new TextEncoder().encode(brut) };
  }
  return cache.octets;
}
