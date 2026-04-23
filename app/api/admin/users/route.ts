import { NextRequest } from "next/server";
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

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url);
      const role = searchParams.get("role");
      const search = searchParams.get("search");
      const activeOnly = searchParams.get("active") !== "false";

      const users = await prisma.user.findMany({
        where: {
          deletedAt: null,
          ...(activeOnly && { isActive: true }),
          ...(role && { role: role as any }),
          ...(search && {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { nom: { contains: search, mode: "insensitive" } },
              { prenom: { contains: search, mode: "insensitive" } },
            ],
          }),
        },
        select: USER_SELECT,
        orderBy: { createdAt: "desc" },
      });

      return successResponse(users, { count: users.length });
    } catch (error: any) {
      console.error("[ADMIN/USERS] GET error:", error);
      return serverError("Erreur lors de la récupération des utilisateurs");
    }
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { email, nom, prenom, role } = await request.json();

      const errors: { field: string; message: string }[] = [];
      if (!email) errors.push({ field: "email", message: "Email requis" });
      if (!nom) errors.push({ field: "nom", message: "Nom requis" });
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push({ field: "email", message: "Format email invalide" });
        }
        const existing = await prisma.user.findFirst({ where: { email } });
        if (existing) errors.push({ field: "email", message: "Cet email est déjà utilisé" });
      }
      if (role && !VALID_ROLES.includes(role)) {
        errors.push({ field: "role", message: "Rôle invalide" });
      }
      if (errors.length > 0) return validationError(errors);

      const user = await prisma.user.create({
        data: {
          email,
          nom,
          prenom: prenom || "",
          role: role || "analyst",
          isActive: true,
        },
        select: USER_SELECT,
      });

      return successResponse(user, { status: 201 });
    } catch (error: any) {
      console.error("[ADMIN/USERS] POST error:", error);
      return serverError("Erreur lors de la création de l'utilisateur");
    }
  });
}
