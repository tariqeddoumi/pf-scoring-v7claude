import { NextRequest, NextResponse } from "next/server";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { EvaluationService } from "@/lib/services/evaluation-service";
import { lirePagination } from "@/lib/validation-schemas";

/**
 * GET /api/evaluations - List all evaluations (paginated)
 */
async function handleGET(request: NextRequest, user: any) {
  try {
    // Allow: admin, manager, analyst (not viewer)
    const allowedRoles = ["system_admin", "scoring_admin", "risk_manager", "risk_analyst"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    const message = error instanceof Error ? error.message : String(error);
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
async function handlePOST(request: NextRequest, user: any) {
  try {
    // Allow: admin, manager, analyst (not viewer)
    const allowedRoles = ["system_admin", "scoring_admin", "risk_manager", "risk_analyst"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const evaluation = await EvaluationService.createEvaluation(
      body,
      user.userId
    );

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handleGET(req, user));
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
