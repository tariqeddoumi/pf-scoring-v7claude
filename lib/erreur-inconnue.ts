/**
 * Lecture des propriétés d'une erreur interceptée (`catch (e: unknown)`), sans
 * supposer son type. Aucun import : utilisable côté serveur comme côté navigateur.
 */

/** Code d'une erreur levée (Prisma « P2002 », « P2025 »…), ou `undefined`. */
export function codeErreur(e: unknown): unknown {
  return typeof e === "object" && e !== null && "code" in e
    ? e.code
    : undefined;
}

/** Texte d'une erreur levée, ou `undefined` si elle n'en porte pas. */
export function messageErreur(e: unknown): string | undefined {
  return typeof e === "object" &&
    e !== null &&
    "message" in e &&
    typeof e.message === "string"
    ? e.message
    : undefined;
}
