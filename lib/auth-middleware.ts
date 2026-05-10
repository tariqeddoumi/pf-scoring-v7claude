import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  hasPermission,
  hasMinimumRole,
  type UserRole,
} from "./permissions";

/**
 * Middleware d'authentification et d'autorisation pour les routes API.
 *
 * FONCTIONNEMENT (pour débutants) :
 * -------------------------------------------
 * Chaque requête API doit fournir un token JWT dans le header :
 *   Authorization: Bearer <token>
 *
 * Le middleware vérifie :
 *   1. Que le token est présent et valide (non expiré, bonne signature)
 *   2. Que l'utilisateur a le rôle ou la permission nécessaire
 *
 * UTILISATION dans les routes API :
 *   export async function GET(req) {
 *     return withAuth(req, async (req, user) => {
 *       // Ici, user est authentifié et disponible
 *     });
 *   }
 */

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number; // Issued At (timestamp de création du token)
  exp?: number; // Expiration (timestamp d'expiration)
}

function getJwtSecret(): string {
  const _rawSecret =
    process.env.SUPABASE_JWT_SECRET ||
    process.env.JWT_SECRET;

  if (!_rawSecret && process.env.NODE_ENV === "production") {
    throw new Error("FATAL: JWT_SECRET ou SUPABASE_JWT_SECRET doit être défini en production");
  }

  return _rawSecret || "dev-secret-key-change-in-production";
}

let JWT_SECRET_BYTES: Uint8Array | null = null;

function getJwtSecretBytes(): Uint8Array {
  if (!JWT_SECRET_BYTES) {
    const secret = getJwtSecret();
    JWT_SECRET_BYTES = new TextEncoder().encode(secret);
  }
  return JWT_SECRET_BYTES;
}

/**
 * Vérifie le token JWT dans le header Authorization.
 * Retourne le payload décodé si valide, null sinon.
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthPayload | null> {
  try {
    const authHeader = request.headers.get("authorization");
    // Le header doit être au format "Bearer <token>"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Extraire le token après "Bearer "
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    return payload as unknown as AuthPayload;
  } catch {
    // Token invalide, expiré, ou signature incorrecte
    return null;
  }
}

/**
 * Wrapper de base : vérifie l'authentification avant d'appeler le handler.
 * Retourne 401 si l'utilisateur n'est pas connecté.
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Non authentifié", errorCode: "ERR_AUTH_401" },
      { status: 401 }
    );
  }
  return handler(request, user);
}

/**
 * Wrapper admin : requiert au minimum le rôle "scoring_admin".
 * Retourne 403 si l'utilisateur n'a pas les droits suffisants.
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req, user) => {
    if (!hasMinimumRole(user.role, "scoring_admin")) {
      return NextResponse.json(
        { success: false, error: "Accès interdit", errorCode: "ERR_AUTH_403" },
        { status: 403 }
      );
    }
    return handler(req, user);
  });
}

/**
 * Wrapper permission : vérifie qu'un utilisateur possède une permission précise.
 * Ex : withPermission("scoring:delete", req, handler)
 */
export async function withPermission(
  permission: string,
  request: NextRequest,
  handler: (request: NextRequest, user: AuthPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req, user) => {
    if (!hasPermission(user.role, permission)) {
      return NextResponse.json(
        { success: false, error: "Accès interdit", errorCode: "ERR_AUTH_403" },
        { status: 403 }
      );
    }
    return handler(req, user);
  });
}

/**
 * Wrapper rôle minimum : vérifie que l'utilisateur a au moins un certain niveau de rôle.
 * Ex : withMinimumRole("risk_manager", req, handler)
 */
export async function withMinimumRole(
  minimumRole: UserRole,
  request: NextRequest,
  handler: (request: NextRequest, user: AuthPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req, user) => {
    if (!hasMinimumRole(user.role, minimumRole)) {
      return NextResponse.json(
        { success: false, error: "Accès interdit", errorCode: "ERR_AUTH_403" },
        { status: 403 }
      );
    }
    return handler(req, user);
  });
}

// Re-export des fonctions de permissions pour la commodité des routes API
// (évite d'avoir à importer depuis deux fichiers différents)
export { hasMinimumRole, hasPermission } from "./permissions";
