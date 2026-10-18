import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { creditSchema, peutModifierProjet, messageConflitCredit } from "@/lib/modele-pf/credits";
import { messagePublic } from "@/lib/erreur-publique";

interface RouteParams { params: Promise<{ id: string; creditId: string }> }

async function chargerCredit(id: string, creditId: string) {
  return prisma.projectCredit.findFirst({ where: { id: creditId, projectId: id }, include: { project: { select: { creePar: true } } } });
}

/** PUT — complète ou corrige un crédit du projet. */
async function modifier(req: NextRequest, user: AuthPayload, id: string, creditId: string) {
  try {
    const credit = await chargerCredit(id, creditId);
    if (!credit) return NextResponse.json({ error: "Crédit introuvable" }, { status: 404 });
    if (!peutModifierProjet(user.role, user.userId, credit.project.creePar)) {
      return NextResponse.json({ error: "Vos droits ne permettent pas de modifier ce projet" }, { status: 403 });
    }
    const v = creditSchema.partial().safeParse(await req.json());
    if (!v.success) return NextResponse.json({ error: v.error.issues[0]?.message ?? "Saisie invalide" }, { status: 400 });
    const maj = await prisma.projectCredit.update({ where: { id: creditId }, data: v.data });
    return NextResponse.json(maj);
  } catch (e) {
    const conflit = messageConflitCredit(e);
    if (conflit) return NextResponse.json({ error: conflit }, { status: 409 });
    return NextResponse.json({ error: messagePublic(e, "Modification du crédit impossible") }, { status: 500 });
  }
}

/** DELETE — détache le crédit du projet (aucune écriture dans les systèmes de la banque), tracé. */
async function retirer(_req: NextRequest, user: AuthPayload, id: string, creditId: string) {
  const credit = await chargerCredit(id, creditId);
  if (!credit) return NextResponse.json({ error: "Crédit introuvable" }, { status: 404 });
  if (!peutModifierProjet(user.role, user.userId, credit.project.creePar)) {
    return NextResponse.json({ error: "Vos droits ne permettent pas de modifier ce projet" }, { status: 403 });
  }
  await prisma.projectCredit.delete({ where: { id: creditId } });
  await prisma.auditLog.create({
    data: { projectId: id, utilisateurId: user.userId, action: "CREDIT_RETIRE", details: JSON.stringify({ numero: credit.numero }) },
  });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id, creditId } = await params;
  return withAuth(req, (r, u) => modifier(r, u, id, creditId));
}
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id, creditId } = await params;
  return withAuth(req, (r, u) => retirer(r, u, id, creditId));
}
