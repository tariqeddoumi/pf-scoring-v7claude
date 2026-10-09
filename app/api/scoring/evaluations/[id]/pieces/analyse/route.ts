import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";
import { convertirPiece, type PieceConvertie } from "@/lib/services/ia-documents/conversion";
import { lirePiece } from "@/lib/services/ia-documents/stockage";
import { analyserPieces } from "@/lib/services/ia-documents/analyse";
import { construirePropositions } from "@/lib/services/ia-documents/resultat";
import {
  ACTION_ANALYSE,
  contexteProjet,
  criteresDuDossier,
  type AnalyseEnregistree,
} from "@/lib/services/ia-documents/dossier";

// L'analyse de plusieurs pièces peut prendre quelques minutes.
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/scoring/evaluations/[id]/pieces/analyse
 *
 * Lit les pièces du dossier, les fait analyser par l'IA (contrôle + extraction),
 * vérifie les propositions contre la grille et journalise le résultat. Aucune réponse
 * n'est écrite : l'analyste valide les propositions dans l'écran de saisie.
 */
async function handlePOST(_req: NextRequest, { params }: Ctx, user: AuthPayload) {
  if (!hasPermission(user.role as UserRole, "evaluation", "update")) {
    return NextResponse.json({ success: false, error: "Droits insuffisants", errorCode: "ERR_FORBIDDEN" }, { status: 403 });
  }
  const { id } = await params;
  const evaluation = await prisma.scoringEvaluation.findUnique({
    where: { id },
    include: { project: true, documents: { orderBy: { uploadedAt: "asc" } } },
  });
  if (!evaluation) return NextResponse.json({ success: false, error: "Évaluation introuvable" }, { status: 404 });
  if (String(evaluation.status) !== "brouillon") {
    return NextResponse.json(
      { success: false, error: "L'analyse se lance pendant la saisie (évaluation au brouillon).", errorCode: "INVALID_STATE" },
      { status: 409 }
    );
  }
  if (evaluation.documents.length === 0) {
    return NextResponse.json({ success: false, error: "Ajoutez d'abord les pièces du dossier." }, { status: 400 });
  }

  const avertissements: string[] = [];
  const pieces: PieceConvertie[] = [];
  const lues: Array<{ id: string; nom: string }> = [];
  for (const d of evaluation.documents) {
    try {
      const contenu = await lirePiece(d.storagePath);
      const convertie = await convertirPiece(d.fileName, contenu);
      if (convertie.avertissement) avertissements.push(convertie.avertissement);
      pieces.push(convertie);
      lues.push({ id: d.id, nom: d.fileName });
    } catch (e) {
      avertissements.push(`« ${d.fileName} » non analysée : ${e instanceof Error ? e.message : "lecture impossible"}`);
    }
  }
  if (pieces.length === 0) {
    return NextResponse.json({ success: false, error: "Aucune pièce lisible.", details: avertissements }, { status: 400 });
  }

  try {
    const criteres = await criteresDuDossier(evaluation.modelVersionId);
    const appel = await analyserPieces({
      pieces,
      // les critères alimentés par une source verrouillée ne se saisissent pas
      criteres: criteres.filter((c) => !c.verrouille),
      contexte: contexteProjet(evaluation.project as unknown as Record<string, unknown>),
    });
    const { propositions, manquants } = construirePropositions(appel.resultat, criteres);

    const enregistree: AnalyseEnregistree = {
      date: new Date().toISOString(),
      auteur: user.userId,
      modele: appel.modele,
      usage: appel.usage,
      pieces: lues,
      avertissements: [...avertissements, ...appel.avertissements],
      resultat: appel.resultat,
      propositions,
      manquants,
    };

    // Le contrôle de chaque pièce est reporté sur sa fiche ; l'analyse complète est
    // journalisée (chaque analyse s'ajoute, aucune n'est écrasée).
    const parNom = new Map(appel.resultat.documents.map((d) => [d.nom, d]));
    await prisma.$transaction([
      ...lues.map((p) => {
        const r = parNom.get(p.nom);
        return prisma.scoringDocument.update({
          where: { id: p.id },
          data: r
            ? {
                documentType: r.typeIdentifie.slice(0, 120),
                description: r.role.slice(0, 1000),
                notes: JSON.stringify({ complet: r.complet, elementsManquants: r.elementsManquants, incoherences: r.incoherences }),
              }
            : { notes: JSON.stringify({ complet: null, elementsManquants: [], incoherences: ["Pièce non commentée par l'analyse."] }) },
        });
      }),
      prisma.scoringChangeLog.create({
        data: {
          entityType: "ScoringEvaluation",
          entityId: id,
          evaluationId: id,
          action: ACTION_ANALYSE,
          newValueJson: JSON.stringify(enregistree),
          changedBy: user.userId,
          comment: `Analyse IA de ${lues.length} pièce(s) : ${propositions.length} proposition(s), ${manquants.length} information(s) manquante(s)`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: enregistree });
  } catch (e) {
    console.error("[ANALYSE IA]", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Analyse impossible", details: avertissements },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  return withAuth(req, (r, user) => handlePOST(r, ctx, user));
}
