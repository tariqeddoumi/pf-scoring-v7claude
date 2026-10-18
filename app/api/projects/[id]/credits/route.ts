import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { creditSchema, peutModifierProjet, messageConflitCredit } from "@/lib/modele-pf/credits";
import { messagePublic } from "@/lib/erreur-publique";

interface RouteParams { params: Promise<{ id: string }> }

/** GET /api/projects/[id]/credits — dossiers de crédit rattachés au projet. */
async function lister(_req: NextRequest, _user: AuthPayload, id: string) {
  const projet = await prisma.project.findUnique({ where: { id }, select: { id: true } });
  if (!projet) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  const credits = await prisma.projectCredit.findMany({ where: { projectId: id }, orderBy: [{ ordre: "asc" }, { createdAt: "asc" }] });
  const total = credits.reduce((s, c) => s + (c.montant ?? 0), 0);
  return NextResponse.json({ credits, total });
}

/** POST /api/projects/[id]/credits — rattache un dossier de crédit saisi à la main. */
async function creer(req: NextRequest, user: AuthPayload, id: string) {
  try {
    const projet = await prisma.project.findUnique({ where: { id }, select: { id: true, creePar: true } });
    if (!projet) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    if (!peutModifierProjet(user.role, user.userId, projet.creePar)) {
      return NextResponse.json({ error: "Vos droits ne permettent pas de modifier ce projet" }, { status: 403 });
    }
    const v = creditSchema.safeParse(await req.json());
    if (!v.success) return NextResponse.json({ error: v.error.issues[0]?.message ?? "Saisie invalide", erreurs: v.error.issues }, { status: 400 });
    const nb = await prisma.projectCredit.count({ where: { projectId: id } });
    const credit = await prisma.projectCredit.create({ data: { ...v.data, ordre: v.data.ordre ?? nb, projectId: id, source: "MANUELLE" } });
    await prisma.auditLog.create({
      data: { projectId: id, utilisateurId: user.userId, action: "CREDIT_RATTACHE", details: JSON.stringify({ numero: credit.numero, montant: credit.montant, devise: credit.devise }) },
    });
    return NextResponse.json(credit, { status: 201 });
  } catch (e) {
    const conflit = messageConflitCredit(e);
    if (conflit) return NextResponse.json({ error: conflit }, { status: 409 });
    return NextResponse.json({ error: messagePublic(e, "Rattachement du crédit impossible") }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return withAuth(req, (r, u) => lister(r, u, id));
}
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return withAuth(req, (r, u) => creer(r, u, id));
}
