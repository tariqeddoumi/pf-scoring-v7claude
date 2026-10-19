import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";
import { refusSiVersionFigee, verifierNoeudModifiable } from "@/lib/services/scoring/version-guard";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ nodeId: string; rangeId: string }> }
) {
  return withAdminAuth(req, async () => {
    try {
      const { nodeId, rangeId } = await context.params;
      const figee = await refusSiVersionFigee(verifierNoeudModifiable(nodeId));
      if (figee) return figee;

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
