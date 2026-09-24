import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";
import { duplicateVersion } from "@/lib/services/scoring/version-duplication";

export async function GET(req: NextRequest, context: { params: Promise<{ modelId: string }> }) {
  return withAdminAuth(req, async () => {
    try {
      const { modelId } = await context.params;
      const versions = await prisma.scoringModelVersion.findMany({
        where: { modelId },
        orderBy: { versionNumber: "desc" },
      });
      return successResponse(versions, { count: versions.length });
    } catch (error) {
      console.error("[SCORING/VERSIONS] GET error:", error);
      return serverError("Erreur lors de la récupération des versions");
    }
  });
}

/**
 * POST /api/admin/scoring/models/{modelId}/versions
 * Corps : { sourceVersionId?, label?, changeReason? }
 *
 * Crée une version par duplication. À défaut de version source explicite, la version
 * publiée fait foi ; à défaut de version publiée, la plus récente.
 *
 * La duplication qui vivait ici recopiait les nœuds, les options et les plages, mais
 * ni les règles, ni les liaisons de données, et laissait de côté treize colonnes de
 * nœud — dont « isScored », « scoringMethod » et « scoreMax », qui déterminent
 * respectivement si un nœud se saisit ou s'agrège, comment il est noté et sur quelle
 * échelle il est normalisé. Une version ainsi clonée ne notait pas comme son origine.
 * Elle procédait en outre par créations successives hors transaction : une
 * interruption laissait un modèle à moitié bâti.
 */
export async function POST(req: NextRequest, context: { params: Promise<{ modelId: string }> }) {
  return withAdminAuth(req, async (_, user) => {
    try {
      const { modelId } = await context.params;
      const body = await req.json().catch(() => ({}));

      const source = body.sourceVersionId
        ? await prisma.scoringModelVersion.findFirst({
            where: { id: body.sourceVersionId, modelId },
          })
        : ((await prisma.scoringModelVersion.findFirst({
            where: { modelId, isPublished: true },
          })) ??
          (await prisma.scoringModelVersion.findFirst({
            where: { modelId },
            orderBy: { versionNumber: "desc" },
          })));

      if (!source) {
        return validationError([
          {
            field: "sourceVersionId",
            message: "Aucune version à dupliquer pour ce modèle",
          },
        ]);
      }

      const adminUser = await prisma.user.findFirst({
        where: { role: "system_admin", isActive: true, deletedAt: null },
        orderBy: { createdAt: "asc" },
      });

      const resultat = await duplicateVersion({
        sourceVersionId: source.id,
        label: body.label,
        changeReason:
          body.changeReason ?? `Copie de la version ${source.versionNumber}`,
        createdBy: adminUser?.id ?? user.userId,
      });

      return successResponse(resultat, { status: 201 });
    } catch (error) {
      console.error("[SCORING/VERSIONS] POST error:", error);
      return serverError("Erreur lors de la création de la version");
    }
  });
}
