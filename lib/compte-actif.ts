/**
 * Compte encore autorisé ? Un jeton reste valide 24 h : sans ce contrôle, un compte
 * désactivé ou supprimé gardait l'accès jusqu'à expiration, avec l'ancien rôle. Le
 * rôle retenu est celui de la base, pas celui figé dans le jeton. Le résultat est
 * gardé 30 secondes pour ne pas interroger la base à chaque appel.
 *
 * Utilisé par la vérification Bearer (auth-middleware) et par celle du cookie (auth).
 */
const DUREE_CACHE_COMPTE_MS = 30_000;
const cacheComptes = new Map<string, { role: string | null; expire: number }>();

export async function roleDuCompteActif(userId: string): Promise<string | null> {
  const enCache = cacheComptes.get(userId);
  if (enCache && enCache.expire > Date.now()) return enCache.role;
  const { default: prisma } = await import("./prisma-client");
  const compte = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true, deletedAt: true },
  });
  const role = compte && compte.isActive && !compte.deletedAt ? String(compte.role) : null;
  cacheComptes.set(userId, { role, expire: Date.now() + DUREE_CACHE_COMPTE_MS });
  return role;
}
