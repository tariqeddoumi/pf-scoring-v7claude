import { NextRequest, NextResponse } from "next/server";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { ProjectService } from "@/lib/services/project-service";
import { lirePagination } from "@/lib/validation-schemas";

/**
 * GET /api/projects - List all projects (paginated)
 */
async function handleGET(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    // Une limite hors bornes se borne au lieu de faire échouer la requête : la
    // liste répondait 400 et l'écran affichait « Chargement impossible ».
    const { page, limit } = lirePagination(searchParams, 50);
    const status = searchParams.get("status");
    const secteur = searchParams.get("secteur");


    const filters = {
      ...(status && { status }),
      ...(secteur && { secteur }),
    };

    const result = await ProjectService.getAllProjects(
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
 * POST /api/projects - Create new project (analyst+)
 */
async function handlePOST(request: NextRequest, user: any) {
  try {
    // Hiérarchie complète : read_only < auditor < risk_analyst < committee_member
    //                       < risk_manager < scoring_admin < system_admin
    if (!["system_admin","scoring_admin","risk_manager","risk_analyst"].includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Accès refusé",
          errorCode: "ERR_FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const project = await ProjectService.createProject(body, user.userId);

    console.log("[PROJECTS] POST success:", project.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: project.id,
          nom: project.nom,
          status: project.status,
          createdAt: project.dateCreation,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[PROJECTS] POST error:", error);
    console.error("[PROJECTS] Error stack:", error.stack);

    // Handle Zod validation errors
    if (error.name === "ZodError") {
      const errors = error.flatten().fieldErrors;
      const formattedErrors = Object.entries(errors).map(
        ([field, messages]: [string, any]) => ({
          field,
          message: Array.isArray(messages) ? messages[0] : messages,
        })
      );

      console.error("[PROJECTS] Validation errors:", formattedErrors);

      return NextResponse.json(
        {
          success: false,
          error: "Validation échouée",
          errorCode: "ERR_VALID_001",
          errors: formattedErrors,
        },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "Un projet avec ce nom existe déjà",
          errorCode: "ERR_DUPLICATE",
          details: error.message,
        },
        { status: 400 }
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "Client non trouvé",
          errorCode: "ERR_NOT_FOUND",
          details: error.message,
        },
        { status: 400 }
      );
    }

    if (error.code === "P1001") {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de se connecter à la base de données",
          errorCode: "ERR_DB_CONNECTION",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors de la création du projet",
        errorCode: "ERR_API_001",
        debugInfo:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handleGET(req, user));
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
