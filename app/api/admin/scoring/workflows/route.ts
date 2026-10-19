import { NextRequest } from "next/server";
import { withMinimumRole } from "@/lib/auth-middleware";
import { successResponse, serverError } from "@/lib/api-response";
// Client cloisonné par banque : un client Prisma créé ici contournait le filtre
// d'entité et exposait les dossiers des autres banques.
import prisma from "@/lib/prisma-client";
import type { Prisma } from "@prisma/client";

/**
 * La lecture des circuits était réservée aux administrateurs du modèle : un analyste
 * recevait 403 et l'écran affichait « Erreur lors du chargement des workflows », alors
 * que c'est lui qui soumet les dossiers et attend leur passage en comité. La lecture
 * est ouverte à partir du rôle d'analyste ; les décisions restent réservées.
 */
export async function GET(request: NextRequest) {
  return withMinimumRole("risk_analyst", request, async () => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status");
      const limit = parseInt(searchParams.get("limit") || "50");
      const offset = parseInt(searchParams.get("offset") || "0");

      const whereClause: Prisma.ScoringWorkflowWhereInput = {};
      if (status) whereClause.status = status;

      const workflows = await prisma.scoringWorkflow.findMany({
        where: whereClause,
        include: {
          evaluation: {
            include: {
              project: true,
              analyst: {
                select: { id: true, email: true, nom: true, prenom: true },
              },
            },
          },
          steps: {
            orderBy: { stepNumber: "asc" },
          },
          decisions: {
            orderBy: { decidedAt: "desc" },
            take: 1,
          },
          approvals: {
            where: { status: "PENDING" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });

      return successResponse(workflows, {
        count: workflows.length,
        status: 200,
      });
    } catch (error: unknown) {
      console.error("[Workflows GET]", error);
      return serverError("Erreur lors de la récupération des workflows");
    }
  });
}
