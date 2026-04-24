import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ nodeId: string; optionId: string }> }
) {
  return withAdminAuth(req, async () => {
    try {
      const { nodeId, optionId } = await context.params;

      const deleted = await prisma.scoringNodeOption.delete({
        where: {
          id: optionId,
          nodeId: nodeId,
        },
      });

      return successResponse({ id: deleted.id });
    } catch (error) {
      console.error("[SCORING/NODES/OPTIONS] DELETE error:", error);
      return serverError("Erreur lors de la suppression de l'option");
    }
  });
}
