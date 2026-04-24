import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ nodeId: string }> }
) {
  return withAdminAuth(req, async () => {
    try {
      const { nodeId } = await context.params;
      const body = await req.json();

      const updated = await prisma.scoringNode.update({
        where: { id: nodeId },
        data: {
          code: body.code || undefined,
          label: body.label || undefined,
          shortLabel: body.shortLabel || undefined,
          description: body.description || undefined,
          weight: body.weight ?? undefined,
          aggregationMethod: body.aggregationMethod || undefined,
          answerType: body.answerType || undefined,
        },
      });

      return successResponse(updated);
    } catch (error) {
      console.error("[SCORING/NODES] PUT error:", error);
      return serverError("Erreur lors de la mise à jour du nœud");
    }
  });
}
