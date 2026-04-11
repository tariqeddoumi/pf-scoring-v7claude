import { NextRequest, NextResponse } from "next/server";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { ProjectService } from "@/lib/services/project-service";
import { paginationSchema } from "@/lib/validation-schemas";

/**
 * GET /api/projects - List all projects (paginated)
 */
async function handleGET(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const secteur = searchParams.get("secteur");

    const validated = paginationSchema.parse({ page, limit });

    const filters = {
      ...(status && { status }),
      ...(secteur && { secteur }),
    };

    const result = await ProjectService.getAllProjects(
      validated.page,
      validated.limit,
      filters
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * POST /api/projects - Create new project (analyst+)
 */
async function handlePOST(request: NextRequest, user: any) {
  try {
    if (!hasMinimumRole(user.role, "analyst")) {
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
    console.log("[PROJECTS] POST request body:", JSON.stringify(body));

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
