import { NextResponse, NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const domains = await prisma.scoreDomain.findMany({
        orderBy: { orderIndex: "asc" },
      });

      return successResponse(domains, { count: domains.length });
    } catch (error: any) {
      console.error("[ADMIN/DOMAINS] GET error:", error);
      return serverError("Erreur lors de la récupération des domaines");
    }
  });
}
