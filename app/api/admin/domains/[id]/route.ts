import { NextResponse, NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, notFoundError, serverError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;
      const { isActive, weight } = await request.json();

      const domain = await prisma.scoreDomain.update({
        where: { id },
        data: {
          ...(isActive !== undefined && { isActive }),
          ...(weight !== undefined && { weight }),
        },
      });

      return successResponse(domain);
    } catch (error: any) {
      if (error.code === "P2025") {
        return notFoundError("Domaine");
      }
      console.error("[ADMIN/DOMAINS/[ID]] PATCH error:", error);
      return serverError("Erreur lors de la mise à jour du domaine");
    }
  });
}
