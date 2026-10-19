import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { EvaluationService } from "@/lib/services/evaluation-service";
import { lirePagination } from "@/lib/validation-schemas";
import { messagePublic } from "@/lib/erreur-publique";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";

/**
 * GET /api/evaluations - List all evaluations (paginated)
 */
async function handleGET(request: NextRequest, user: AuthPayload) {
  try {
    // Tout rôle qui lit les évaluations : le comité (décideur), l'auditeur et la lecture
    // seule recevaient 403 alors que le détail d'une évaluation leur est ouvert. Les
    // notes restent masquées selon le rôle (withAuth).
    if (!hasPermission(user.role as UserRole, "evaluation", "read")) {
      return NextResponse.json(
        { error: "Vos droits ne permettent pas de consulter les évaluations" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    // Une limite hors bornes se borne au lieu de faire échouer la requête : la
    // liste répondait 400 et l'écran affichait « Chargement impossible ».
    const { page, limit } = lirePagination(searchParams, 50);
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");

    const filters = {
      ...(status && { status }),
      ...(projectId && { projectId }),
    };

    const result = await EvaluationService.getAllEvaluations(
      page,
      limit,
      filters
    );

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
 * POST /api/evaluations - Create new evaluation (analyst+)
 */
async function handlePOST(request: NextRequest, user: AuthPayload) {
  try {
    // Tout rôle qui lit les évaluations : le comité (décideur), l'auditeur et la lecture
    // seule recevaient 403 alors que le détail d'une évaluation leur est ouvert. Les
    // notes restent masquées selon le rôle (withAuth).
    if (!hasPermission(user.role as UserRole, "evaluation", "read")) {
      return NextResponse.json(
        { error: "Vos droits ne permettent pas de consulter les évaluations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const evaluation = await EvaluationService.createEvaluation(
      body,
      user.userId
    );

    return NextResponse.json(evaluation, { status: 201 });
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
