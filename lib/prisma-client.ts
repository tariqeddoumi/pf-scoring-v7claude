/**
 * Instance globale du client Prisma (ORM pour PostgreSQL/Supabase).
 *
 * POURQUOI UN SINGLETON ? (pour débutants)
 * -------------------------------------------
 * Next.js recompile les modules à chaque modification en développement.
 * Sans cette précaution, chaque rechargement créerait une NOUVELLE connexion
 * à la base de données, ce qui finirait par épuiser le pool de connexions Supabase.
 *
 * La solution : stocker l'instance dans `globalThis` (variable globale de Node.js)
 * pour la réutiliser entre les recompilations.
 *
 * En PRODUCTION, ce problème n'existe pas (le serveur ne se rechargee pas),
 * donc on crée simplement une instance standard.
 *
 * UTILISATION :
 *   import prisma from "@/lib/prisma-client";
 *   const user = await prisma.user.findUnique({ where: { id } });
 */

import { PrismaClient, Prisma } from "@prisma/client";

// Déclaration pour TypeScript : on ajoute "prisma" à l'espace global de Node.js
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaConfig: Prisma.PrismaClientOptions = {
  // En développement : afficher toutes les requêtes SQL dans la console (utile pour déboguer)
  // En production : n'afficher que les erreurs (moins de bruit dans les logs)
  log: process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"],
  // Format lisible pour les messages d'erreur Prisma
  errorFormat: "pretty",
};

// Réutiliser l'instance existante en développement, sinon en créer une nouvelle
const prisma = global.prisma ?? new PrismaClient(prismaConfig);

// Sauvegarder dans global uniquement en développement (voir explication ci-dessus)
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
