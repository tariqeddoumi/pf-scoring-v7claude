import { Prisma } from "@prisma/client";

/**
 * Message d'erreur montrable à l'utilisateur.
 *
 * Les routes renvoyaient `error.message` tel quel : une erreur de base de données
 * exposait alors le détail de la requête Prisma (tables, colonnes, valeurs), ce qui
 * renseigne un attaquant et n'aide pas l'utilisateur. Les erreurs métier levées
 * volontairement (« Client non trouvé », « Ce dossier n'appartient pas à votre
 * périmètre »…) gardent leur texte ; les erreurs techniques sont remplacées par le
 * message par défaut et restent dans les journaux du serveur.
 */
export function messagePublic(e: unknown, defaut: string): string {
  if (
    e instanceof Prisma.PrismaClientKnownRequestError ||
    e instanceof Prisma.PrismaClientUnknownRequestError ||
    e instanceof Prisma.PrismaClientValidationError ||
    e instanceof Prisma.PrismaClientInitializationError ||
    e instanceof Prisma.PrismaClientRustPanicError
  ) {
    return defaut;
  }
  if (!(e instanceof Error) || !e.message) return defaut;
  const m = e.message.trim();
  if (
    m.length > 300 ||
    m.includes("\n") ||
    /prisma|invocation|ECONN|ENOTFOUND|SQL|stack/i.test(m)
  ) {
    return defaut;
  }
  return m;
}
