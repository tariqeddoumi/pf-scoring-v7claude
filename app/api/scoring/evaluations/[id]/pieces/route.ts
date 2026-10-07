import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";
import { extensionAcceptee, EXTENSIONS_ACCEPTEES } from "@/lib/services/ia-documents/conversion";
import { cheminPiece, lienDepot, stockageConfigure, TAILLE_MAX_FICHIER } from "@/lib/services/ia-documents/stockage";
import { derniereAnalyse } from "@/lib/services/ia-documents/dossier";

type Ctx = { params: Promise<{ id: string }> };

const refus = (status: number, error: string, errorCode = "ERR") =>
  NextResponse.json({ success: false, error, errorCode }, { status });

/**
 * GET  /api/scoring/evaluations/[id]/pieces — pièces du dossier et dernière analyse IA.
 * POST /api/scoring/evaluations/[id]/pieces — déclare une pièce et renvoie un lien de
 *      dépôt signé : le navigateur envoie le fichier directement au stockage privé.
 */
async function handleGET(_req: NextRequest, { params }: Ctx, user: AuthPayload) {
  if (!hasPermission(user.role as UserRole, "evaluation", "read")) {
    return refus(403, "Vos droits ne permettent pas cette consultation", "ERR_FORBIDDEN");
  }
  const { id } = await params;
  const [pieces, analyse] = await Promise.all([
    prisma.scoringDocument.findMany({
      where: { evaluationId: id },
      orderBy: { uploadedAt: "asc" },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        documentType: true,
        description: true,
        notes: true,
        uploadedAt: true,
        uploadedByUser: { select: { nom: true, prenom: true } },
      },
    }),
    derniereAnalyse(id),
  ]);
  return NextResponse.json({
    success: true,
    data: {
      pieces,
      analyse,
      configuration: {
        stockage: stockageConfigure(),
        ia: Boolean(process.env.ANTHROPIC_API_KEY),
        extensions: EXTENSIONS_ACCEPTEES,
        tailleMax: TAILLE_MAX_FICHIER,
      },
    },
  });
}

async function handlePOST(req: NextRequest, { params }: Ctx, user: AuthPayload) {
  if (!hasPermission(user.role as UserRole, "evaluation", "update")) {
    return refus(403, "Vos droits ne permettent pas de modifier cette évaluation", "ERR_FORBIDDEN");
  }
  const { id } = await params;
  const corps = await req.json().catch(() => ({}));
  const nom = typeof corps.fileName === "string" ? corps.fileName.trim() : "";
  const taille = Number(corps.fileSize);
  if (!nom || !extensionAcceptee(nom)) {
    return refus(400, `Format non accepté. Formats acceptés : ${EXTENSIONS_ACCEPTEES.join(", ")}.`, "VALIDATION_ERROR");
  }
  if (!Number.isFinite(taille) || taille <= 0 || taille > TAILLE_MAX_FICHIER) {
    return refus(400, `Fichier vide ou trop volumineux (50 Mo au plus).`, "VALIDATION_ERROR");
  }
  if (!stockageConfigure()) {
    return refus(503, "Stockage des pièces non configuré sur le serveur.", "NOT_CONFIGURED");
  }

  const evaluation = await prisma.scoringEvaluation.findUnique({ where: { id }, select: { status: true } });
  if (!evaluation) return refus(404, "Évaluation introuvable", "NOT_FOUND");
  if (String(evaluation.status) !== "brouillon") {
    return refus(409, "Les pièces s'ajoutent pendant la saisie (évaluation au brouillon).", "INVALID_STATE");
  }

  const piece = await prisma.scoringDocument.create({
    data: {
      evaluationId: id,
      fileName: nom.slice(0, 250),
      fileSize: Math.round(taille),
      fileType: typeof corps.fileType === "string" ? corps.fileType.slice(0, 120) : "",
      storagePath: "",
      documentType: "A_ANALYSER",
      uploadedBy: user.userId,
    },
  });
  const chemin = cheminPiece(id, piece.id, nom);
  try {
    const lien = await lienDepot(chemin, typeof corps.fileType === "string" && corps.fileType ? corps.fileType : undefined);
    await prisma.scoringDocument.update({ where: { id: piece.id }, data: { storagePath: chemin } });
    return NextResponse.json({
      success: true,
      data: { pieceId: piece.id, chemin, url: lien.url, methode: lien.methode, entetes: lien.entetes },
    });
  } catch (e) {
    await prisma.scoringDocument.delete({ where: { id: piece.id } }).catch(() => undefined);
    return refus(502, e instanceof Error ? e.message : "Lien de dépôt impossible", "STORAGE_ERROR");
  }
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return withAuth(req, (r, user) => handleGET(r, ctx, user));
}

export async function POST(req: NextRequest, ctx: Ctx) {
  return withAuth(req, (r, user) => handlePOST(r, ctx, user));
}
