import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;

      const criteria = await prisma.scoreCriterion.findMany({
        where: { domainId: id },
        orderBy: { orderIndex: "asc" },
        include: {
          options: { orderBy: { orderIndex: "asc" } },
          ranges: { orderBy: { orderIndex: "asc" } },
        },
      });

      return successResponse(criteria, { count: criteria.length });
    } catch (error: any) {
      console.error("[ADMIN/DOMAINS/[ID]/CRITERIA] GET error:", error);
      return serverError("Erreur lors de la récupération des critères");
    }
  });
}
