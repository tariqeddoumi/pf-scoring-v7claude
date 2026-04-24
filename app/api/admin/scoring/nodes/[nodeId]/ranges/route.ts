import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ nodeId: string }> }
) {
  return withAdminAuth(req, async () => {
    try {
      const { nodeId } = await context.params;
      const body = await req.json();

      if (body.minValue === undefined || body.maxValue === undefined || body.score === undefined) {
        return validationError([
          { field: "minValue", message: "Min requis" },
          { field: "maxValue", message: "Max requis" },
          { field: "score", message: "Score requis" },
        ]);
      }

      const node = await prisma.scoringNode.findUnique({
        where: { id: nodeId },
        include: { ranges: true },
      });

      if (!node) {
        return validationError([{ field: "nodeId", message: "Nœud non trouvé" }]);
      }

      const maxOrder = node.ranges?.length ?? 0;

      const range = await prisma.scoringNodeRange.create({
        data: {
          nodeId,
          label: body.label || `[${body.minValue}-${body.maxValue}]`,
          minValue: body.minValue,
          maxValue: body.maxValue,
          minIncluded: body.minIncluded ?? true,
          maxIncluded: body.maxIncluded ?? true,
          score: body.score,
          orderIndex: maxOrder,
          isActive: true,
        },
      });

      return successResponse(range, { status: 201 });
    } catch (error) {
      console.error("[SCORING/NODES/RANGES] POST error:", error);
      return serverError("Erreur lors de la création de la plage");
    }
  });
}
