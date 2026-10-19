import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma-client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { supprimerPiece } from "@/lib/services/ia-documents/stockage";
import { evaluationModifiable, piecesDe, refus } from "@/lib/modele-pf/acces";

type Ctx = { params: Promise<{ id: string; pieceId: string }> };

/** DELETE — retire une pièce du scoring et la supprime du stockage. */
async function retirer(_req: NextRequest, user: AuthPayload, id: string, pieceId: string) {
  const a = await evaluationModifiable(id, user);
  if (!a.ok) return a.refus;
  const pieces = piecesDe(a.e.pieces);
  const p = pieces.find((x) => x.id === pieceId);
  if (!p) return refus(404, "Pièce introuvable");
  const n = await prisma.evaluationPF.updateMany({ where: { id, statut: "brouillon", updatedAt: a.e.updatedAt }, data: { pieces: pieces.filter((x) => x.id !== pieceId) as unknown as Prisma.InputJsonValue } });
  if (n.count !== 1) return refus(409, "Le scoring a changé entre-temps : réessayez.");
  await supprimerPiece(p.chemin).catch(() => undefined);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id, pieceId } = await params;
  return withAuth(req, (r, u) => retirer(r, u, id, pieceId));
}
