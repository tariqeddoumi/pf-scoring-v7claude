import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, errorResponse, validationError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

/**
 * POST /api/admin/scoring/options
 * Ajoute une option à un critère (table BP_PF_v7pp_scoring_options)
 */
export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const body = await req.json();
      // Accepte nodeId ou criterionId (compatibilité)
      const nodeId = body.nodeId || body.criterionId;
      const { label, score } = body;

      if (!nodeId || !label || score === undefined) {
        return validationError([
          { field: "nodeId", message: "Requis" },
          { field: "label", message: "Requis" },
          { field: "score", message: "Requis" },
        ]);
      }

      // Vérifier que le nœud existe
      const criterion = await prisma.scoringNode.findUnique({ where: { id: nodeId } });

      if (!criterion) {
        return errorResponse("Critère introuvable", { status: 404, errorCode: "NOT_FOUND" });
      }

      if (criterion.nodeType !== "CRITERION") {
        return errorResponse("Les options ne peuvent être ajoutées qu'aux critères", { status: 400 });
      }

      // Calculer le prochain orderIndex
      const lastOption = await prisma.scoringNodeOption.findFirst({
        where: { nodeId },
        orderBy: { orderIndex: "desc" },
      });
      const orderIndex = (lastOption?.orderIndex ?? -1) + 1;

      const option = await prisma.scoringNodeOption.create({
        data: { nodeId, label, score, orderIndex },
      });

      return successResponse(option, { status: 201 });
    } catch (error: any) {
      console.error("[ADMIN/SCORING/OPTIONS] POST error:", error);
      return serverError("Erreur lors de la création de l'option");
    }
  });
}

/**
 * PUT /api/admin/scoring/options?optionId=xxx
 * Modifie une option existante
 */
export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const optionId = searchParams.get("optionId");
      const body = await req.json();

      if (!optionId) {
        return validationError([{ field: "optionId", message: "Requis" }]);
      }

      const option = await prisma.scoringNodeOption.update({
        where: { id: optionId },
        data: {
          ...(body.label !== undefined && { label: body.label }),
          ...(body.score !== undefined && { score: body.score }),
        },
      });

      return successResponse(option);
    } catch (error: any) {
      console.error("[ADMIN/SCORING/OPTIONS] PUT error:", error);
      return serverError("Erreur lors de la mise à jour de l'option");
    }
  });
}

/**
 * DELETE /api/admin/scoring/options?optionId=xxx
 * Supprime une option
 */
export async function DELETE(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const optionId = searchParams.get("optionId");

      if (!optionId) {
        return validationError([{ field: "optionId", message: "Requis" }]);
      }

      await prisma.scoringNodeOption.delete({ where: { id: optionId } });

      return successResponse({ success: true });
    } catch (error: any) {
      console.error("[ADMIN/SCORING/OPTIONS] DELETE error:", error);
      return serverError("Erreur lors de la suppression de l'option");
    }
  });
}
