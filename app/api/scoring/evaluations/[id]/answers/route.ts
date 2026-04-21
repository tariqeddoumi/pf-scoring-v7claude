import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * PATCH /api/scoring/evaluations/[id]/answers
 * Mise à jour en lot des réponses d'une évaluation.
 *
 * CORPS DE LA REQUÊTE :
 *   { answers: [{ nodeId: string, value: any, overrideReason?: string }] }
 *
 * Les valeurs sont stockées dans des colonnes typées séparées :
 *   - valueString  : texte / code d'option (ex: "FORT", "MOYEN")
 *   - valueNumber  : nombre décimal (ex: 1.45 pour le DSCR)
 *   - valueBoolean : oui/non
 *   - valueDate    : date ISO (ex: "2025-01-15")
 *
 * La base utilise un upsert : crée la réponse si elle n'existe pas, sinon la met à jour.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evaluationId = id;
    const { answers } = await req.json();

    if (!Array.isArray(answers)) {
      return NextResponse.json(
        {
          success: false,
          error: "Le champ 'answers' doit être un tableau",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Vérifier que l'évaluation existe avant de modifier ses réponses
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: "Évaluation introuvable", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Mettre à jour chaque réponse individuellement
    const updated = [];
    for (const { nodeId, value, overrideReason } of answers) {
      if (!nodeId || value === undefined) continue;

      // Détecter le type JavaScript de la valeur et mapper vers la bonne colonne DB.
      // Note : les valeurs venant du JSON ne peuvent jamais être instanceof Date —
      //        on traite les chaînes de date comme des strings pour préserver leur format.
      let valueString: string | null = null;
      let valueNumber: number | null = null;
      let valueBoolean: boolean | null = null;
      let valueDate: Date | null = null;

      if (typeof value === "boolean") {
        valueBoolean = value;
      } else if (typeof value === "number") {
        valueNumber = value;
      } else if (typeof value === "string") {
        // Détecter si la chaîne ressemble à une date ISO (ex: "2025-01-15T00:00:00Z")
        const dateCandidate = new Date(value);
        const isIsoDate = /^\d{4}-\d{2}-\d{2}/.test(value) && !isNaN(dateCandidate.getTime());
        if (isIsoDate) {
          valueDate = dateCandidate;
        } else {
          valueString = value;
        }
      }

      const result = await prisma.scoringEvaluationAnswer.upsert({
        where: { evaluationId_nodeId: { evaluationId, nodeId } },
        create: {
          evaluationId,
          nodeId,
          answerType: "TEXT",
          valueString,
          valueNumber,
          valueBoolean,
          valueDate,
          isOverridden: !!overrideReason,
          overrideReason,
        },
        update: {
          valueString,
          valueNumber,
          valueBoolean,
          valueDate,
          isOverridden: !!overrideReason,
          overrideReason,
          updatedAt: new Date(),
        },
      });

      updated.push(result);
    }

    return NextResponse.json({
      success: true,
      data: { updatedCount: updated.length },
    });
  } catch (error) {
    console.error("PATCH /api/scoring/evaluations/[id]/answers error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
