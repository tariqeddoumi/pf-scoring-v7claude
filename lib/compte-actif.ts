/**
 * Compte encore autorisé ? Un jeton reste valide 24 h : sans ce contrôle, un compte
 * désactivé ou supprimé gardait l'accès jusqu'à expiration, avec l'ancien rôle. Le
 * rôle retenu est celui de la base, pas celui figé dans le jeton. Le résultat est
 * gardé 30 secondes pour ne pas interroger la base à chaque appel.
 *
 * Utilisé par la vérification Bearer (auth-middleware) et par celle du cookie (auth).
 */
const DUREE_CACHE_COMPTE_MS = 30_000;

export interface EtatCompte {
  /** Rôle en base ; null si le compte est inactif, supprimé ou inconnu. */
  role: string | null;
  /** Mot de passe provisoire à remplacer avant tout autre accès. */
  mustChangePassword: boolean;
}

const cacheComptes = new Map<string, { etat: EtatCompte; expire: number }>();

export async function etatDuCompte(userId: string): Promise<EtatCompte> {
  const enCache = cacheComptes.get(userId);
  if (enCache && enCache.expire > Date.now()) return enCache.etat;
  const { default: prisma } = await import("./prisma-client");
  const compte = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true, deletedAt: true, mustChangePassword: true },
  });
  const etat: EtatCompte = {
    role: compte && compte.isActive && !compte.deletedAt ? String(compte.role) : null,
    mustChangePassword: Boolean(compte?.mustChangePassword),
  };
  cacheComptes.set(userId, { etat, expire: Date.now() + DUREE_CACHE_COMPTE_MS });
  return etat;
}

export async function roleDuCompteActif(userId: string): Promise<string | null> {
  return (await etatDuCompte(userId)).role;
}

/** À appeler après un changement du compte (mot de passe, rôle) pour ne pas attendre le cache. */
export function oublierCompte(userId: string): void {
  cacheComptes.delete(userId);
}
