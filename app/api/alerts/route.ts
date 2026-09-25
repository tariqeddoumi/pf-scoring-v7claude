/**
 * GET /api/alerts
 *
 * Alertes dérivées des évaluations réellement calculées : seuils rédhibitoires
 * déclenchés, scores sous le seuil de vigilance, règles que le moteur n'a pas pu
 * évaluer. Rien n'est stocké — une alerte est une lecture de l'état du moment, et non
 * un enregistrement susceptible de survivre au fait qui l'a provoquée.
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma-client";
import { withAuth } from "@/lib/auth-middleware";
import { successResponse, serverError } from "@/lib/api-response";
import { deriverAlertes } from "@/lib/services/alert-derivation";

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const evaluations = await prisma.scoringEvaluation.findMany({
        where: { isArchived: false },
        select: {
          id: true,
          projectId: true,
          status: true,
          finalScore: true,
          rating: true,
          updatedAt: true,
          summaryJson: true,
          project: { select: { nom: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 200,
      });

      const alertes = deriverAlertes(
        evaluations.map((ev) => ({
          id: ev.id,
          projectId: ev.projectId,
          projectName: ev.project?.nom ?? "Projet sans nom",
          status: String(ev.status),
          finalScore: ev.finalScore,
          rating: ev.rating,
          updatedAt: ev.updatedAt,
          summaryJson: ev.summaryJson,
        }))
      );

      return successResponse(alertes, { count: alertes.length });
    } catch (error) {
      console.error("[ALERTS] GET error:", error);
      return serverError("Erreur lors de la récupération des alertes");
    }
  });
}
