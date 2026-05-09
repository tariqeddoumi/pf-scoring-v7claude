import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ modelId: string; versionId: string }> }
) {
  return withAdminAuth(req, async (_, user) => {
    try {
      const { modelId, versionId } = await context.params;

      const adminUser = await prisma.user.findFirst({
        where: { role: "system_admin", isActive: true, deletedAt: null },
        orderBy: { createdAt: "asc" },
      });
      const publishedBy = adminUser?.id ?? user.userId;

      // Archive all currently published versions of this model
      await prisma.scoringModelVersion.updateMany({
        where: { modelId, isPublished: true },
        data: { status: "ARCHIVED", isPublished: false },
      });

      // Publish the selected version
      const version = await prisma.scoringModelVersion.update({
        where: { id: versionId },
        data: {
          isPublished: true,
          status: "PUBLISHED",
          publishedBy,
          publishedAt: new Date(),
        },
      });

      return successResponse(version);
    } catch (error) {
      console.error("[SCORING/VERSIONS/PUBLISH] PUT error:", error);
      return serverError("Erreur lors de la publication");
    }
  });
}
