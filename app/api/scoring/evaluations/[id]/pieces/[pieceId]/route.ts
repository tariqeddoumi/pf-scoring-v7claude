import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";
import { supprimerPiece } from "@/lib/services/ia-documents/stockage";

type Ctx = { params: Promise<{ id: string; pieceId: string }> };

/** DELETE — retire une pièce d'un dossier en saisie (fichier et fiche). */
async function handleDELETE(_req: NextRequest, { params }: Ctx, user: AuthPayload) {
  if (!hasPermission(user.role as UserRole, "evaluation", "update")) {
    return NextResponse.json({ success: false, error: "Droits insuffisants" }, { status: 403 });
  }
  const { id, pieceId } = await params;
  const piece = await prisma.scoringDocument.findFirst({
    where: { id: pieceId, evaluationId: id },
    include: { evaluation: { select: { status: true } } },
  });
  if (!piece) return NextResponse.json({ success: false, error: "Pièce introuvable" }, { status: 404 });
  if (String(piece.evaluation.status) !== "brouillon") {
    return NextResponse.json(
      { success: false, error: "Une pièce d'un dossier soumis ne se retire pas : elle fait partie de la piste d'audit." },
      { status: 409 }
    );
  }
  if (piece.storagePath) await supprimerPiece(piece.storagePath).catch(() => undefined);
  await prisma.scoringDocument.delete({ where: { id: pieceId } });
  return NextResponse.json({ success: true, data: { id: pieceId } });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  return withAuth(req, (r, user) => handleDELETE(r, ctx, user));
}
