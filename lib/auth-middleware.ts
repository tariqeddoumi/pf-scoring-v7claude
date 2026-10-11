import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { secretJwt } from "./jwt-secret";
import { etatDuCompte } from "./compte-actif";
import { contexteAcces } from "./entites/contexte";
import { HorsPerimetreError } from "./entites/filtre-prisma";
import { calculerPerimetre, chargerArbre, PERIMETRE_VIDE, type Perimetre } from "./entites/perimetre";
import { masquerScores, peutVoirScores } from "./score-visibility";
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
  /** Mot de passe provisoire non encore remplacé (lu en base à chaque appel). */
  mustChangePassword?: boolean;
  /** Périmètre multi-banques du compte (entités visibles et modifiables). */
  perimetre?: Perimetre;
  iat?: number; // Issued At (timestamp de création du token)
  exp?: number; // Expiration (timestamp d'expiration)
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
    const { payload } = await jwtVerify(token, secretJwt());
    const jeton = payload as unknown as AuthPayload;
    if (!jeton?.userId) return null;
    const etat = await etatDuCompte(jeton.userId);
    if (!etat.role) return null;
    const perimetre = calculerPerimetre(await chargerArbre(), etat);
    return { ...jeton, role: etat.role, mustChangePassword: etat.mustChangePassword, perimetre };
  } catch {
    // Token invalide, expiré, ou signature incorrecte
    return null;
  }
}

/**
 * Wrapper de base : vérifie l'authentification avant d'appeler le handler.
 * Retourne 401 si l'utilisateur n'est pas connecté.
 */
/** Routes accessibles avec un mot de passe provisoire. */
const ROUTES_SANS_CHANGEMENT = ["/api/auth/changer-mot-de-passe", "/api/auth/me", "/api/auth/logout"];

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
  // Mot de passe provisoire : seul son remplacement est accessible.
  if (user.mustChangePassword && !ROUTES_SANS_CHANGEMENT.some((r) => request.nextUrl.pathname.startsWith(r))) {
    return NextResponse.json(
      {
        success: false,
        error: "Vous devez remplacer votre mot de passe provisoire avant de continuer.",
        errorCode: "MUST_CHANGE_PASSWORD",
      },
      { status: 403 }
    );
  }
  // Toutes les requêtes Prisma de la route sont filtrées sur ce périmètre.
  let reponse: NextResponse;
  try {
    reponse = await contexteAcces.run(user.perimetre ?? PERIMETRE_VIDE, () => handler(request, user));
  } catch (e) {
    if (e instanceof HorsPerimetreError) {
      return NextResponse.json({ success: false, error: e.message, errorCode: e.code }, { status: 403 });
    }
    throw e;
  }
  return filtrerScores(await refusDePerimetre(reponse), user.role);
}

/**
 * Les routes interceptent souvent leurs erreurs en « 500 ». Un refus de périmètre
 * (création hors périmètre, ou modification d'un dossier visible en consultation
 * seulement, que Prisma ne trouve alors pas) est rendu en 403 avec un message clair.
 */
async function refusDePerimetre(reponse: NextResponse): Promise<NextResponse> {
  if (reponse.status !== 500) return reponse;
  let corps: { error?: unknown } | null = null;
  try {
    corps = await reponse.clone().json();
  } catch {
    return reponse;
  }
  const message = typeof corps?.error === "string" ? corps.error : "";
  const horsPerimetre = message.includes(new HorsPerimetreError().message);
  const introuvable = /Record to (update|delete) (does not exist|not found)|No record was found for an? (update|delete)|required but not found/i.test(message);
  if (!horsPerimetre && !introuvable) return reponse;
  return NextResponse.json(
    {
      success: false,
      error: horsPerimetre
        ? new HorsPerimetreError().message
        : "Dossier introuvable ou en consultation seule dans votre périmètre.",
      errorCode: "HORS_PERIMETRE",
    },
    { status: 403 }
  );
}

/**
 * Retire les scores des réponses JSON pour les rôles qui ne doivent pas les voir
 * (lib/score-visibility.ts). Point de passage unique de toutes les routes protégées :
 * une route ajoutée plus tard est couverte sans y penser.
 */
async function filtrerScores(reponse: NextResponse, role: string): Promise<NextResponse> {
  if (peutVoirScores(role)) return reponse;
  const type = reponse.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) return reponse;
  let corps: unknown;
  try {
    corps = await reponse.clone().json();
  } catch {
    return reponse;
  }
  const entetes = new Headers(reponse.headers);
  entetes.delete("content-length");
  return NextResponse.json(masquerScores(corps), { status: reponse.status, headers: entetes });
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
