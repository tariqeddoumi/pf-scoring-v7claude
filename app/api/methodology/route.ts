import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { getRatingScales } from "@/lib/services/scoring-configuration-service";
import { BAREME_REPLI } from "@/lib/services/scoring/rating-scale";
import { SCORE_THRESHOLDS } from "@/lib/score-colors";

/**
 * GET /api/methodology
 *
 * Description du modèle réellement appliqué : version publiée, domaines et leurs
 * poids, volumétrie du questionnaire, barème de conversion du score en note et
 * conditions rédhibitoires.
 *
 * L'écran de méthodologie décrivait jusqu'ici des constantes du code — huit familles
 * de risque pondérées 25/15/15/10/10/10/8/7 % et un barème « AA 85-94 » — quand le
 * moteur applique neuf domaines pondérés 10/10/15/10/10/10/15/10/10 % et le barème
 * de la base. La page annonçait donc une autre méthode que celle qui note les
 * dossiers. Tout vient désormais de la version publiée.
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const version = await prisma.scoringModelVersion.findFirst({
        where: { isPublished: true, status: "PUBLISHED" },
        orderBy: { versionNumber: "desc" },
        select: {
          id: true,
          versionNumber: true,
          label: true,
          publishedAt: true,
          model: { select: { label: true, code: true } },
        },
      });

      if (!version) {
        return NextResponse.json(
          {
            success: false,
            error: "Aucune version de modèle publiée",
          },
          { status: 404 }
        );
      }

      const [noeuds, regles, scales] = await Promise.all([
        prisma.scoringNode.findMany({
          where: { versionId: version.id, isActive: true },
          orderBy: [{ depth: "asc" }, { orderIndex: "asc" }],
          select: {
            id: true,
            code: true,
            label: true,
            description: true,
            depth: true,
            weight: true,
            nodeType: true,
            isScored: true,
            parentNodeId: true,
          },
        }),
        prisma.scoringNodeRule.findMany({
          where: { versionId: version.id, isActive: true },
          orderBy: { orderIndex: "asc" },
          select: {
            code: true,
            label: true,
            description: true,
            ruleType: true,
            severity: true,
            actionType: true,
            blocking: true,
            penaltyValue: true,
            conditionExpression: true,
            messageUser: true,
          },
        }),
        getRatingScales().catch(() => []),
      ]);

      const domaines = noeuds
        .filter((n) => n.depth === 0)
        .map((n) => ({
          code: n.code,
          label: n.label,
          description: n.description,
          weight: n.weight,
          // Nombre de critères du domaine, tel que l'arbre les porte.
          criteres: noeuds.filter((x) => x.parentNodeId === n.id).length,
        }));

      const bareme =
        scales.length > 0
          ? {
              source: "referentiel" as const,
              paliers: scales.map((s) => ({
                note: s.label,
                min: Number(s.minScore),
                max: Number(s.maxScore),
                description: s.description ?? null,
              })),
            }
          : {
              source: "repli" as const,
              paliers: BAREME_REPLI.map((b) => ({
                note: b.rating,
                min: b.minScore,
                max: b.maxScore,
                description: null,
              })),
            };

      const nbOptions = await prisma.scoringNodeOption.count({
        where: { node: { versionId: version.id, isActive: true } },
      });

      return NextResponse.json({
        success: true,
        data: {
          version: {
            id: version.id,
            numero: version.versionNumber,
            label: version.label,
            publieLe: version.publishedAt,
            modele: version.model?.label ?? null,
          },
          domaines,
          volumetrie: {
            domaines: domaines.length,
            criteres: noeuds.filter((n) => n.depth === 1).length,
            sousCriteres: noeuds.filter((n) => n.depth === 2).length,
            pointsNotes: noeuds.filter((n) => n.isScored).length,
            options: nbOptions,
          },
          bareme,
          seuilsLecture: SCORE_THRESHOLDS,
          regles: regles.map((r) => ({
            code: r.code,
            label: r.label,
            description: r.description ?? r.messageUser ?? null,
            type: r.ruleType,
            gravite: r.severity,
            action: r.actionType,
            bloquante: r.blocking || r.actionType === "REJECT" || r.actionType === "BLOCK",
            malus: r.penaltyValue,
            condition: r.conditionExpression,
          })),
        },
      });
    } catch (error) {
      console.error("[METHODOLOGY GET]", error);
      return NextResponse.json(
        { success: false, error: "Erreur lors de la lecture du modèle" },
        { status: 500 }
      );
    }
  });
}
