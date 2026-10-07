import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma-client";
import { withAuth } from "@/lib/auth-middleware";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";

/**
 * GET /api/projects/[id]/scorings — historique des scores d'un projet.
 *
 * Le handler ne vérifiait aucune identité : l'historique était lisible sans session.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, user) => {
    if (!hasPermission(user.role as UserRole, "evaluation", "read")) {
      return NextResponse.json(
        { error: "Vos droits ne permettent pas cette consultation", errorCode: "ERR_FORBIDDEN" },
        { status: 403 }
      );
    }
    try {
      const { id } = await params;

      const scorings = await prisma.scoring.findMany({
        where: { projectId: id },
        orderBy: { dateCalcul: "desc" },
      });

      return NextResponse.json(scorings);
    } catch (error) {
      console.error("Erreur:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des scores" },
        { status: 500 }
      );
    }
  });
}
