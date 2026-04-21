/**
 * Fonctions d'authentification de bas niveau.
 *
 * CE FICHIER GÈRE (pour débutants) :
 * -------------------------------------------
 * 1. MOTS DE PASSE : hachage sécurisé avec bcrypt avant stockage en base,
 *    et vérification lors du login (on ne stocke JAMAIS le mot de passe en clair).
 *
 * 2. TOKENS JWT : création d'un token signé après login réussi,
 *    et vérification de ce token à chaque appel API.
 *
 *    Un JWT (JSON Web Token) ressemble à ceci :
 *    eyJhbGci... (header) . eyJ1c2VySWQiOi... (payload) . signature
 *
 * 3. COOKIES : extraction du token depuis le cookie "auth_token"
 *    (utilisé côté serveur pour les requêtes SSR).
 *
 * ⚠️ SÉCURITÉ : JWT_SECRET doit être une chaîne longue et aléatoire en production.
 *    Ne jamais committer ce secret dans le code source.
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

// Le secret utilisé pour signer et vérifier tous les tokens JWT.
// IMPORTANT : changer cette valeur en production via la variable d'environnement JWT_SECRET.
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

// ============================================================================
// MOT DE PASSE
// ============================================================================

/**
 * Hache un mot de passe avec bcrypt (facteur de coût : 10 rounds).
 * Le hash est unique même pour le même mot de passe (grâce au "sel" aléatoire).
 * À stocker en base à la place du mot de passe original.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Vérifie qu'un mot de passe en clair correspond à un hash stocké.
 * Retourne true si le mot de passe est correct, false sinon.
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ============================================================================
// TOKEN JWT
// ============================================================================

/**
 * Crée un token JWT signé contenant les informations de base de l'utilisateur.
 * Le token expire après 24 heures.
 *
 * @param payload - userId, email et rôle de l'utilisateur connecté
 * @returns Le token JWT sous forme de chaîne de caractères
 */
export async function createToken(payload: {
  userId: string;
  email: string;
  role: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" }) // Algorithme de signature HMAC SHA-256
    .setIssuedAt()                          // Timestamp de création (iat)
    .setExpirationTime("24h")               // Expiration dans 24 heures (exp)
    .sign(JWT_SECRET);
}

/**
 * Vérifie et décode un token JWT.
 * Retourne le payload (userId, email, role) si le token est valide et non expiré.
 * Retourne null si le token est invalide, expiré, ou si la signature est incorrecte.
 */
export async function verifyToken(token: string): Promise<{
  userId: string;
  email: string;
  role: string;
} | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as { userId: string; email: string; role: string };
  } catch {
    // Token invalide ou expiré : on retourne null plutôt que de lever une exception
    return null;
  }
}

// ============================================================================
// COOKIE
// ============================================================================

/**
 * Extrait le token JWT depuis le header Cookie d'une requête HTTP.
 * Le cookie s'appelle "auth_token" et est mis en place lors du login.
 *
 * @param cookieHeader - Valeur brute du header "Cookie" (ex: "auth_token=eyJ...")
 * @returns Le token extrait, ou null si absent
 */
export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const tokenCookie = cookies.find((c) => c.startsWith("auth_token="));

  return tokenCookie ? tokenCookie.substring("auth_token=".length) : null;
}
