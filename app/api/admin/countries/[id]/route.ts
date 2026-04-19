import { NextResponse, NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError, notFoundError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;
      const { riskScore } = await request.json();

      // Validate risk score
      if (riskScore < 0 || riskScore > 100) {
        return validationError([
          { field: "riskScore", message: "Le score doit être entre 0 et 100" },
        ]);
      }

      const country = await prisma.country.update({
        where: { id },
        data: { riskScore },
      });

      return successResponse(country);
    } catch (error: any) {
      if (error.code === "P2025") {
        return notFoundError("Pays");
      }
      console.error("[ADMIN/COUNTRIES/[ID]] PATCH error:", error);
      return serverError("Erreur lors de la mise à jour du pays");
    }
  });
}
