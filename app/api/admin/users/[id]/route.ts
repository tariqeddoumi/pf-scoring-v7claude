import { NextResponse, NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;
      const { role } = await request.json();

      if (!["admin", "manager", "analyst", "viewer"].includes(role)) {
        return NextResponse.json(
          { error: "Rôle invalide", errorCode: "VAL_001" },
          { status: 400 }
        );
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      console.error("[ADMIN/USERS/[ID]] PATCH error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour", errorCode: "SRV_001" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;

      // Prevent deleting yourself
      const authHeader = request.headers.get("authorization");
      if (authHeader) {
        // Optional: Add check to prevent self-deletion
      }

      const user = await prisma.user.delete({
        where: { id },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
        },
      });

      console.log(`[ADMIN/USERS] User deleted: ${user.email}`);

      return NextResponse.json({
        success: true,
        data: user,
        message: "Utilisateur supprimé avec succès",
      });
    } catch (error: any) {
      console.error("[ADMIN/USERS/[ID]] DELETE error:", error);

      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Utilisateur non trouvé", errorCode: "BIZ_002" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Erreur lors de la suppression", errorCode: "SRV_001" },
        { status: 500 }
      );
    }
  });
}
