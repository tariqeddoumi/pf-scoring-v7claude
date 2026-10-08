import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { withAdminAuth } from "@/lib/auth-middleware";
import { hashPassword } from "@/lib/auth";
import { genererMotDePasseProvisoire } from "@/lib/mot-de-passe";
import { oublierCompte } from "@/lib/compte-actif";

/**
 * POST /api/admin/users/[id]/reinitialiser-mot-de-passe
 *
 * Attribue un nouveau mot de passe provisoire, renvoyé UNE seule fois à
 * l'administrateur ; l'utilisateur devra le remplacer à sa prochaine connexion.
 * Sert aussi aux comptes créés avant que la création n'en génère un (ils n'avaient
 * aucun mot de passe et ne pouvaient pas se connecter).
 * Seul un administrateur système peut réinitialiser le compte d'un autre
 * administrateur système. Personne ne réinitialise son propre compte ici : il le
 * change depuis son profil, avec son mot de passe actuel.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (_req, admin) => {
    const { id } = await params;
    const cible = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isActive: true, deletedAt: true },
    });
    if (!cible) return NextResponse.json({ success: false, error: "Utilisateur introuvable" }, { status: 404 });
    if (cible.id === admin.userId) {
      return NextResponse.json(
        { success: false, error: "Changez votre propre mot de passe depuis votre profil." },
        { status: 409 }
      );
    }
    if (cible.role === "system_admin" && admin.role !== "system_admin") {
      return NextResponse.json(
        { success: false, error: "Seul un administrateur système peut réinitialiser ce compte." },
        { status: 403 }
      );
    }
    if (!cible.isActive || cible.deletedAt) {
      return NextResponse.json(
        { success: false, error: "Ce compte est désactivé : réactivez-le avant de réinitialiser son mot de passe." },
        { status: 409 }
      );
    }

    const motDePasseProvisoire = genererMotDePasseProvisoire();
    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { password: await hashPassword(motDePasseProvisoire), mustChangePassword: true },
      }),
      prisma.userAuditLog.create({
        data: { userId: id, performedById: admin.userId, action: "PASSWORD_RESET", reason: "Mot de passe provisoire attribué" },
      }),
    ]);
    oublierCompte(id);

    return NextResponse.json({ success: true, data: { email: cible.email, motDePasseProvisoire } });
  });
}
