import { NextResponse, NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";
import { oublierCompte } from "@/lib/compte-actif";
import { PERIMETRE_VIDE, type Perimetre } from "@/lib/entites/perimetre";
import { compteGerable, entiteAttribuable, PORTEES, roleAttribuable } from "@/lib/entites/utilisateurs";

/** Compte cible s'il est dans le périmètre de l'administrateur, sinon null (404). */
async function compteDuPerimetre(id: string, p: Perimetre) {
  const compte = await prisma.user.findUnique({ where: { id }, select: { id: true, entiteId: true, role: true } });
  return compte && compteGerable(p, compte.entiteId) ? compte : null;
}
const introuvable = () => errorResponse("Utilisateur non trouvé", { status: 404, errorCode: "NOT_FOUND" });

const VALID_ROLES = ["system_admin", "scoring_admin", "risk_manager", "committee_member", "risk_analyst", "auditor", "read_only"] as const;
const USER_SELECT = {
  id: true,
  email: true,
  nom: true,
  prenom: true,
  role: true,
  entiteId: true,
  porteeEcriture: true,
  entite: { select: { id: true, code: true, nom: true } },
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (_req, admin) => {
    try {
      const { id } = await params;
      if (!(await compteDuPerimetre(id, admin.perimetre ?? PERIMETRE_VIDE))) return introuvable();
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
  return withAdminAuth(request, async (_req, admin) => {
    try {
      const { id } = await params;
      const perimetre = admin.perimetre ?? PERIMETRE_VIDE;
      const cible = await compteDuPerimetre(id, perimetre);
      if (!cible) return introuvable();
      const body = await request.json();
      const { email, nom, prenom, role, isActive, entiteId, porteeEcriture } = body;

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
      if (!roleAttribuable(admin.role, role, String(cible.role))) {
        errors.push({ field: "role", message: "Seul un administrateur système modifie ce compte ou attribue ce rôle" });
      }
      const entite = entiteId === undefined ? null : entiteAttribuable(perimetre, entiteId, role ?? String(cible.role));
      if (entite && !entite.ok) errors.push({ field: "entiteId", message: entite.motif });
      if (porteeEcriture !== undefined && !PORTEES.includes(porteeEcriture)) {
        errors.push({ field: "porteeEcriture", message: "Portée invalide" });
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
          ...(entite?.ok && { entiteId: entite.entiteId }),
          ...(porteeEcriture !== undefined && { porteeEcriture }),
        },
        select: USER_SELECT,
      });
      // Rôle, entité ou portée changés : effet immédiat, sans attendre le cache.
      oublierCompte(id);

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
  return withAdminAuth(request, async (_req, admin) => {
    try {
      const { id } = await params;
      const cible = await compteDuPerimetre(id, admin.perimetre ?? PERIMETRE_VIDE);
      if (!cible) return introuvable();
      const { role } = await request.json();

      if (!VALID_ROLES.includes(role)) {
        return validationError([{ field: "role", message: "Rôle invalide" }]);
      }
      if (!roleAttribuable(admin.role, role, String(cible.role))) {
        return validationError([{ field: "role", message: "Seul un administrateur système attribue ce rôle" }]);
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: USER_SELECT,
      });
      oublierCompte(id);

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
  return withAdminAuth(request, async (_req, admin) => {
    try {
      const { id } = await params;
      const cible = await compteDuPerimetre(id, admin.perimetre ?? PERIMETRE_VIDE);
      if (!cible) return introuvable();
      if (!roleAttribuable(admin.role, undefined, String(cible.role))) {
        return errorResponse("Seul un administrateur système supprime ce compte", { status: 403, errorCode: "FORBIDDEN" });
      }

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
