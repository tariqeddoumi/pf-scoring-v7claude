import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ nodeId: string; rangeId: string }> }
) {
  return withAdminAuth(req, async () => {
    try {
      const { nodeId, rangeId } = await context.params;

      const deleted = await prisma.scoringNodeRange.delete({
        where: {
          id: rangeId,
          nodeId: nodeId,
        },
      });

      return successResponse({ id: deleted.id });
    } catch (error) {
      console.error("[SCORING/NODES/RANGES] DELETE error:", error);
      return serverError("Erreur lors de la suppression de la plage");
    }
  });
}
