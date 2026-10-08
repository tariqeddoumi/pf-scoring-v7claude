import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";
import { hashPassword } from "@/lib/auth";
import { genererMotDePasseProvisoire } from "@/lib/mot-de-passe";

const VALID_ROLES = ["system_admin", "scoring_admin", "risk_manager", "committee_member", "risk_analyst", "auditor", "read_only"] as const;
const USER_SELECT = {
  id: true,
  email: true,
  nom: true,
  prenom: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
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
  return withAdminAuth(request, async (_req, admin) => {
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

      // Le compte était créé sans mot de passe : impossible de s'y connecter. Un mot de
      // passe provisoire est généré, renvoyé UNE fois à l'administrateur, et devra être
      // remplacé à la première connexion. Seule son empreinte est conservée.
      const motDePasseProvisoire = genererMotDePasseProvisoire();
      const user = await prisma.user.create({
        data: {
          email,
          nom,
          prenom: prenom || "",
          role: role || "read_only",
          isActive: true,
          password: await hashPassword(motDePasseProvisoire),
          mustChangePassword: true,
        },
        select: USER_SELECT,
      });
      await prisma.userAuditLog
        .create({ data: { userId: user.id, performedById: admin.userId, action: "CREATE_USER", newValue: user.role } })
        .catch(() => undefined);

      return successResponse({ ...user, motDePasseProvisoire }, { status: 201 });
    } catch (error: any) {
      console.error("[ADMIN/USERS] POST error:", error);
      return serverError("Erreur lors de la création de l'utilisateur");
    }
  });
}
