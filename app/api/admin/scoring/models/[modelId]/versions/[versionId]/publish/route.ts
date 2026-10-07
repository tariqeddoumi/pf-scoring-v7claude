import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";
import { ScoringValidationService } from "@/lib/services/scoring-validation-service";

/**
 * PUT /api/admin/scoring/models/[modelId]/versions/[versionId]/publish
 *
 * La publication archivait les versions en cours puis publiait la version demandée
 * sans contrôler la grille ni son appartenance au modèle de l'URL, en deux écritures
 * séparées, et attribuait la publication au premier administrateur système trouvé en
 * base. Désormais :
 * - la version doit appartenir au modèle et ne pas être archivée ou retirée ;
 * - la grille doit passer la validation de publication (aucune erreur) ;
 * - le concepteur de la version ne peut pas la publier lui-même ;
 * - archivage et publication forment une seule transaction ;
 * - l'auteur enregistré est l'utilisateur connecté, et la publication est journalisée.
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ modelId: string; versionId: string }> }
) {
  return withAdminAuth(req, async (_, user) => {
    const refus = (status: number, error: string, details?: unknown) =>
      NextResponse.json({ success: false, error, errorCode: "PUBLICATION_REFUSEE", details }, { status });
    try {
      const { modelId, versionId } = await context.params;

      const version = await prisma.scoringModelVersion.findUnique({
        where: { id: versionId },
        select: { id: true, modelId: true, status: true, isPublished: true, createdBy: true, versionNumber: true },
      });
      if (!version || version.modelId !== modelId) {
        return refus(404, "Cette version n'appartient pas au modèle indiqué.");
      }
      if (version.isPublished) {
        return refus(409, "Cette version est déjà la version publiée.");
      }
      if (["ARCHIVED", "RETIRED"].includes(String(version.status))) {
        return refus(409, "Une version archivée ou retirée ne peut pas être republiée : créez une nouvelle version.");
      }

      const auteur = await prisma.user.findFirst({
        where: { id: user.userId, isActive: true, deletedAt: null },
        select: { id: true },
      });
      if (!auteur) {
        return refus(403, "Votre compte n'est pas reconnu comme utilisateur actif : publication impossible.");
      }
      if (version.createdBy === user.userId) {
        return refus(
          409,
          "Le concepteur d'une version ne peut pas la publier : la publication doit être faite par un autre administrateur."
        );
      }

      const controle = await ScoringValidationService.validateVersionForPublication(versionId);
      if (!controle.valid) {
        const premiers = controle.errors.slice(0, 5).map((e) => e.message);
        return refus(
          422,
          `La grille ne peut pas être publiée : ${controle.errors.length} anomalie(s). ${premiers.join(" ; ")}`,
          controle.errors
        );
      }

      const maintenant = new Date();
      const [, published] = await prisma.$transaction([
        prisma.scoringModelVersion.updateMany({
          where: { modelId, isPublished: true },
          data: { status: "ARCHIVED", isPublished: false },
        }),
        prisma.scoringModelVersion.update({
          where: { id: versionId },
          data: {
            isPublished: true,
            status: "PUBLISHED",
            publishedBy: user.userId,
            publishedAt: maintenant,
          },
        }),
        prisma.scoringChangeLog.create({
          data: {
            entityType: "ScoringModelVersion",
            entityId: versionId,
            modelId,
            versionId,
            action: "VERSION_PUBLISHED",
            changedBy: user.userId,
            changedAt: maintenant,
            oldValueJson: JSON.stringify({ status: version.status }),
            newValueJson: JSON.stringify({ status: "PUBLISHED", avertissements: controle.warnings.length }),
            comment: `Version ${version.versionNumber} publiée`,
          },
        }),
      ]);

      return successResponse(published);
    } catch (error) {
      console.error("[SCORING/VERSIONS/PUBLISH] PUT error:", error);
      return serverError("Erreur lors de la publication");
    }
  });
}
