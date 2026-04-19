import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: "COUNTRY_RISK_MODE" },
      });

      const mode = config?.value ?? "AUTO_ASSIGN";

      return successResponse({ mode });
    } catch (error: any) {
      console.error("[ADMIN/CONFIG/COUNTRY_RISK_MODE] GET error:", error);
      return serverError("Erreur lors de la récupération de la configuration");
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { mode } = await request.json();

      if (!["AUTO_ASSIGN", "MANUAL"].includes(mode)) {
        return errorResponse("Mode invalide", { status: 400 });
      }

      await prisma.systemConfig.upsert({
        where: { key: "COUNTRY_RISK_MODE" },
        update: { value: mode },
        create: {
          key: "COUNTRY_RISK_MODE",
          value: mode,
          description: "Country risk assignment mode",
        },
      });

      return successResponse({ mode });
    } catch (error: any) {
      console.error("[ADMIN/CONFIG/COUNTRY_RISK_MODE] PATCH error:", error);
      return serverError("Erreur lors de la mise à jour");
    }
  });
}
