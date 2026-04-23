import { NextResponse, NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

const VALID_ROLES = ["admin", "manager", "analyst", "viewer"] as const;
const USER_SELECT = {
  id: true,
  email: true,
  nom: true,
  prenom: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;
      const user = await prisma.user.findUnique({
        where: { id },
        select: USER_SELECT,
      });

      if (!user) {
        return errorResponse("Utilisateur non trouvé", { status: 404, errorCode: "NOT_FOUND" });
      }

      return successResponse(user);
    } catch (error: any) {
      console.error("[ADMIN/USERS/[ID]] GET error:", error);
      return serverError("Erreur lors de la récupération");
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { email, nom, prenom, role, isActive } = body;

      const errors: { field: string; message: string }[] = [];

      if (email !== undefined && !email) {
        errors.push({ field: "email", message: "L'email est requis" });
      }
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push({ field: "email", message: "Format email invalide" });
        }
        // Check uniqueness
        const existing = await prisma.user.findFirst({
          where: { email, NOT: { id } },
        });
        if (existing) {
          errors.push({ field: "email", message: "Cet email est déjà utilisé" });
        }
      }
      if (role !== undefined && !VALID_ROLES.includes(role)) {
        errors.push({ field: "role", message: "Rôle invalide" });
      }

      if (errors.length > 0) return validationError(errors);

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(email !== undefined && { email }),
          ...(nom !== undefined && { nom }),
          ...(prenom !== undefined && { prenom }),
          ...(role !== undefined && { role }),
          ...(isActive !== undefined && { isActive }),
        },
        select: USER_SELECT,
      });

      return successResponse(user);
    } catch (error: any) {
      console.error("[ADMIN/USERS/[ID]] PUT error:", error);
      if (error.code === "P2025") {
        return errorResponse("Utilisateur non trouvé", { status: 404, errorCode: "NOT_FOUND" });
      }
      return serverError("Erreur lors de la mise à jour");
    }
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;
      const { role } = await request.json();

      if (!VALID_ROLES.includes(role)) {
        return validationError([{ field: "role", message: "Rôle invalide" }]);
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: USER_SELECT,
      });

      return successResponse(user);
    } catch (error: any) {
      console.error("[ADMIN/USERS/[ID]] PATCH error:", error);
      return serverError("Erreur lors de la mise à jour");
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

      const user = await prisma.user.delete({
        where: { id },
        select: { id: true, email: true, nom: true, prenom: true },
      });

      return successResponse(user, { message: "Utilisateur supprimé avec succès" });
    } catch (error: any) {
      console.error("[ADMIN/USERS/[ID]] DELETE error:", error);
      if (error.code === "P2025") {
        return errorResponse("Utilisateur non trouvé", { status: 404, errorCode: "NOT_FOUND" });
      }
      return serverError("Erreur lors de la suppression");
    }
  });
}
