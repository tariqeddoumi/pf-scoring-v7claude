import { NextResponse, NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const countries = await prisma.country.findMany({
        orderBy: { label: "asc" },
      });

      return successResponse(countries, { count: countries.length });
    } catch (error: any) {
      console.error("[ADMIN/COUNTRIES] GET error:", error);
      return serverError("Erreur lors de la récupération des pays");
    }
  });
}
