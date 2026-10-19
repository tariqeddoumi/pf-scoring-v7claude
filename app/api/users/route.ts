import { NextRequest, NextResponse } from "next/server";
import {
  withAuth,
  hasMinimumRole,
  type AuthPayload,
} from "@/lib/auth-middleware";
import { UserService } from "@/lib/services/user-service";
import { lirePagination } from "@/lib/validation-schemas";
import { PERIMETRE_VIDE } from "@/lib/entites/perimetre";
import { filtreComptes } from "@/lib/entites/utilisateurs";
import { messagePublic } from "@/lib/erreur-publique";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";

/**
 * GET /api/users - List all users (paginated)
 */
async function handleGET(request: NextRequest, user: AuthPayload) {
  try {
    // Les rôles qui saisissent des clients reçoivent seulement les noms (choix du
    // gestionnaire dans la fiche client) : la liste leur était refusée et le champ
    // restait vide.
    const complet = hasMinimumRole(user.role, "risk_manager");
    if (!complet && !hasPermission(user.role as UserRole, "client", "create")) {
      return NextResponse.json(
        { error: "Vos droits ne permettent pas de consulter les utilisateurs" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    // Une limite hors bornes se borne au lieu de faire échouer la requête : la
    // liste répondait 400 et l'écran affichait « Chargement impossible ».
    const { page, limit } = lirePagination(searchParams, 50);

    // Comptes de la branche de l'utilisateur seulement (gestionnaires proposés à la saisie).
    const result = await UserService.getAllUsers(page, limit, {
      ...filtreComptes(user.perimetre ?? PERIMETRE_VIDE),
      isActive: true,
      deletedAt: null,
    });
    if (!complet) {
      return NextResponse.json(
        {
          ...result,
          data: result.data.map((u) => ({
            id: u.id,
            nom: u.nom,
            prenom: u.prenom,
          })),
        },
        { status: 200 }
      );
    }
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    // La route répondait 400 à toute erreur, y compris une panne de base : l'écran
    // lisait « requête invalide » là où le serveur était en défaut, et le message
    // brut ne disait rien d'exploitable.
    const message = messagePublic(error, "Requête refusée");
    console.error("[LISTE] GET error:", message);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération de la liste" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users - Create new user (admin only)
 */
async function handlePOST(request: NextRequest, user: AuthPayload) {
  try {
    if (user.role !== "system_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    // Le nouveau compte est rattaché à l'entité de l'administrateur : un administrateur
    // de filiale ne peut pas créer un compte qui verrait tout le groupe.
    const perimetre = user.perimetre ?? PERIMETRE_VIDE;
    const newUser = await UserService.createUser(
      body,
      user.userId,
      perimetre.tout ? null : perimetre.entiteId
    );

    return NextResponse.json(
      {
        id: newUser.id,
        email: newUser.email,
        nom: newUser.nom,
        prenom: newUser.prenom,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: messagePublic(error, "Requête refusée") },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handleGET(req, user));
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
