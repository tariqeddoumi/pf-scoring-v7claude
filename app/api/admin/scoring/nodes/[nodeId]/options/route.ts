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

      if (!body.label || body.value === undefined || body.score === undefined) {
        return validationError([
          { field: "label", message: "Label requis" },
          { field: "value", message: "Value requise" },
          { field: "score", message: "Score requis" },
        ]);
      }

      const node = await prisma.scoringNode.findUnique({
        where: { id: nodeId },
        include: { options: true },
      });

      if (!node) {
        return validationError([{ field: "nodeId", message: "Nœud non trouvé" }]);
      }

      const maxOrder = node.options?.length ?? 0;

      const option = await prisma.scoringNodeOption.create({
        data: {
          nodeId,
          label: body.label,
          code: body.code || body.label.toUpperCase().replace(/\s+/g, "_"),
          value: body.value,
          score: body.score,
          orderIndex: maxOrder,
          isActive: true,
        },
      });

      return successResponse(option, { status: 201 });
    } catch (error) {
      console.error("[SCORING/NODES/OPTIONS] POST error:", error);
      return serverError("Erreur lors de la création de l'option");
    }
  });
}
