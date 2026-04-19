import { NextResponse, NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          createdAt: true,
        },
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

      if (!email) {
        return validationError([{ field: "email", message: "Email requis" }]);
      }

      const user = await prisma.user.create({
        data: {
          email,
          nom: nom || email.split("@")[0],
          prenom: prenom || "",
          role: role || "analyst",
        },
      });

      return successResponse(user, { status: 201 });
    } catch (error: any) {
      console.error("[ADMIN/USERS] POST error:", error);
      return serverError("Erreur lors de la création de l'utilisateur");
    }
  });
}
