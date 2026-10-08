import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { withAuth } from "@/lib/auth-middleware";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { motifsRefusMotDePasse } from "@/lib/mot-de-passe";
import { oublierCompte } from "@/lib/compte-actif";

/**
 * POST /api/auth/changer-mot-de-passe — { actuel, nouveau }
 *
 * Seule route ouverte à un compte dont le mot de passe est provisoire : tant qu'il
 * n'est pas remplacé, toutes les autres routes répondent 403 MUST_CHANGE_PASSWORD.
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (_req, user) => {
    const corps = await request.json().catch(() => ({}));
    const actuel = typeof corps.actuel === "string" ? corps.actuel : "";
    const nouveau = typeof corps.nouveau === "string" ? corps.nouveau : "";

    const compte = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, password: true },
    });
    if (!compte?.password || !(await verifyPassword(actuel, compte.password))) {
      return NextResponse.json(
        { success: false, error: "Mot de passe actuel incorrect.", errorCode: "ERR_AUTH_001" },
        { status: 400 }
      );
    }
    const motifs = motifsRefusMotDePasse(nouveau, { email: compte.email, ancien: actuel });
    if (motifs.length > 0) {
      return NextResponse.json(
        { success: false, error: `Le nouveau mot de passe doit comporter : ${motifs.join(", ")}.`, errors: motifs },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: compte.id },
        data: { password: await hashPassword(nouveau), mustChangePassword: false },
      }),
      prisma.userAuditLog.create({
        data: { userId: compte.id, performedById: compte.id, action: "PASSWORD_CHANGE" },
      }),
    ]);
    oublierCompte(compte.id);
    return NextResponse.json({ success: true });
  });
}
