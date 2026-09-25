/**
 * GET /api/analytics
 *
 * Analyses du portefeuille dérivées des évaluations réellement calculées : score
 * moyen, tendance mensuelle, distribution des notes attribuées et moyenne par domaine.
 * Rien n'est produit lorsqu'aucune évaluation n'a été calculée.
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma-client";
import { withAuth } from "@/lib/auth-middleware";
import { successResponse, serverError } from "@/lib/api-response";
import {
  deriverAnalyses,
  type ResultatDomaine,
} from "@/lib/services/analytics-derivation";

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const evaluations = await prisma.scoringEvaluation.findMany({
        where: { isArchived: false },
        select: {
          id: true,
          status: true,
          finalScore: true,
          rating: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      });

      // Seuls les nœuds de profondeur 0 portent les domaines : les niveaux inférieurs
      // y sont déjà agrégés, et les moyenner reviendrait à compter deux fois.
      const resultats = await prisma.scoringEvaluationNodeResult.findMany({
        where: { node: { depth: 0 } },
        select: {
          evaluationId: true,
          rawScore: true,
          node: { select: { code: true, label: true, weight: true } },
        },
      });

      // Un score absent est écarté plutôt que compté pour zéro : il tirerait la
      // moyenne du domaine vers le bas sans qu'aucune évaluation ne l'ait mérité.
      const domaines: ResultatDomaine[] = resultats
        .filter((r) => r.rawScore !== null)
        .map((r) => ({
          evaluationId: r.evaluationId,
          domainCode: r.node.code,
          domainLabel: r.node.label,
          rawScore: r.rawScore as number,
          weight: r.node.weight,
        }));

      return successResponse(deriverAnalyses(evaluations, domaines));
    } catch (error) {
      console.error("[ANALYTICS] GET error:", error);
      return serverError("Erreur lors du calcul des analyses");
    }
  });
}
