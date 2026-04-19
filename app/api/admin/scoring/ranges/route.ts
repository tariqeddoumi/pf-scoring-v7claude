import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

/**
 * POST /api/admin/scoring/ranges
 * Ajoute une plage numérique à un critère (table BP_PF_v7pp_scoring_ranges)
 */
export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const body = await req.json();
      // Accepte nodeId ou criterionId (compatibilité)
      const nodeId = body.nodeId || body.criterionId;
      const { minValue, maxValue, score, label } = body;

      if (!nodeId || minValue === undefined || maxValue === undefined || score === undefined) {
        return validationError([
          { field: "nodeId", message: "Requis" },
          { field: "minValue", message: "Requis" },
          { field: "maxValue", message: "Requis" },
          { field: "score", message: "Requis" },
        ]);
      }

      if (minValue > maxValue) {
        return validationError([
          { field: "minValue", message: "Doit être inférieur ou égal à maxValue" },
        ]);
      }

      // Vérifier que le nœud existe
      const criterion = await prisma.scoringNode.findUnique({ where: { id: nodeId } });

      if (!criterion) {
        return errorResponse("Critère introuvable", { status: 404, errorCode: "NOT_FOUND" });
      }

      if (criterion.nodeType !== "CRITERION") {
        return errorResponse("Les plages ne peuvent être ajoutées qu'aux critères", { status: 400 });
      }

      // Calculer le prochain orderIndex
      const lastRange = await prisma.scoringNodeRange.findFirst({
        where: { nodeId },
        orderBy: { orderIndex: "desc" },
      });
      const orderIndex = (lastRange?.orderIndex ?? -1) + 1;

      const range = await prisma.scoringNodeRange.create({
        data: { nodeId, minValue, maxValue, score, label: label || null, orderIndex },
      });

      return successResponse(range, { status: 201 });
    } catch (error: any) {
      console.error("[ADMIN/SCORING/RANGES] POST error:", error);
      return serverError("Erreur lors de la création de la plage");
    }
  });
}

/**
 * PUT /api/admin/scoring/ranges?rangeId=xxx
 * Modifie une plage existante
 */
export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const rangeId = searchParams.get("rangeId");
      const body = await req.json();

      if (!rangeId) {
        return validationError([{ field: "rangeId", message: "Requis" }]);
      }

      if (body.minValue !== undefined && body.maxValue !== undefined && body.minValue > body.maxValue) {
        return validationError([
          { field: "minValue", message: "Doit être inférieur ou égal à maxValue" },
        ]);
      }

      const range = await prisma.scoringNodeRange.update({
        where: { id: rangeId },
        data: {
          ...(body.minValue !== undefined && { minValue: body.minValue }),
          ...(body.maxValue !== undefined && { maxValue: body.maxValue }),
          ...(body.score !== undefined && { score: body.score }),
          ...(body.label !== undefined && { label: body.label }),
        },
      });

      return successResponse(range);
    } catch (error: any) {
      console.error("[ADMIN/SCORING/RANGES] PUT error:", error);
      return serverError("Erreur lors de la mise à jour de la plage");
    }
  });
}

/**
 * DELETE /api/admin/scoring/ranges?rangeId=xxx
 * Supprime une plage
 */
export async function DELETE(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const rangeId = searchParams.get("rangeId");

      if (!rangeId) {
        return validationError([{ field: "rangeId", message: "Requis" }]);
      }

      await prisma.scoringNodeRange.delete({ where: { id: rangeId } });

      return successResponse({ success: true });
    } catch (error: any) {
      console.error("[ADMIN/SCORING/RANGES] DELETE error:", error);
      return serverError("Erreur lors de la suppression de la plage");
    }
  });
}
