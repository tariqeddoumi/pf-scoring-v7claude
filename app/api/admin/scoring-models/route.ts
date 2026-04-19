import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/admin/scoring-models
 * List all scoring models for admin interface.
 */
export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const models = await prisma.scoringModel.findMany({
        select: {
          id: true,
          code: true,
          label: true,
          businessSegment: true,
          projectType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return successResponse(models, { count: models.length });
    } catch (error: any) {
      console.error("[ADMIN/SCORING-MODELS] GET error:", error);
      return serverError("Erreur lors de la récupération des modèles");
    }
  });
}

/**
 * POST /api/admin/scoring-models
 * Create a new scoring model.
 */
export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const body = await req.json();
      const { code, label, businessSegment, projectType, description } = body;

      if (!code || !label) {
        return validationError([
          { field: "code", message: "Requis" },
          { field: "label", message: "Requis" },
        ]);
      }

      // Check if code already exists
      const existing = await prisma.scoringModel.findUnique({
        where: { code },
      });

      if (existing) {
        return errorResponse(`Le modèle avec le code "${code}" existe déjà`, { status: 400, errorCode: "DUPLICATE" });
      }

      const model = await prisma.scoringModel.create({
        data: {
          code,
          label,
          businessSegment: businessSegment || null,
          projectType: projectType || null,
          description: description || null,
          status: "DRAFT",
        },
      });

      return successResponse(model, { status: 201 });
    } catch (error: any) {
      console.error("[ADMIN/SCORING-MODELS] POST error:", error);
      return serverError("Erreur lors de la création du modèle");
    }
  });
}
