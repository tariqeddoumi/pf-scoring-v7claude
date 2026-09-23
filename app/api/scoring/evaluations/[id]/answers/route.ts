import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { ScoringAnswerType } from "@prisma/client";
import { normalizeAnswers } from "@/lib/services/scoring/answer-payload";

/**
 * PATCH /api/scoring/evaluations/[id]/answers
 * Mise à jour en lot des réponses d'une évaluation.
 *
 * Le corps accepte deux formes par réponse — colonnes typées (préférée) ou valeur
 * unique héritée. La normalisation et ses règles sont dans
 * lib/services/scoring/answer-payload.ts, où elles sont testées.
 *
 * Le type de réponse vient du nœud du référentiel, jamais deviné. Toute entrée non
 * enregistrable est retournée dans `ignored` : une sauvegarde partielle ne doit
 * jamais se présenter comme un succès complet.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: evaluationId } = await params;
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

    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
      select: { id: true },
    });
    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: "Évaluation introuvable", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const nodeIds = answers
      .map((a: { nodeId?: string }) => a?.nodeId)
      .filter((v: unknown): v is string => typeof v === "string");

    const nodes = await prisma.scoringNode.findMany({
      where: { id: { in: nodeIds } },
      select: { id: true, answerType: true },
    });
    const answerTypeByNode = new Map<string, string>(
      nodes.map((n) => [n.id, n.answerType as unknown as string])
    );

    const { writes, ignored } = normalizeAnswers(answers, answerTypeByNode);

    const results = await prisma.$transaction(
      writes.map((w) =>
        prisma.scoringEvaluationAnswer.upsert({
          where: { evaluationId_nodeId: { evaluationId, nodeId: w.nodeId } },
          create: {
            evaluationId,
            nodeId: w.nodeId,
            answerType: w.answerType as ScoringAnswerType,
            valueString: w.valueString,
            valueNumber: w.valueNumber,
            valueBoolean: w.valueBoolean,
            valueDate: w.valueDate,
            comment: w.comment,
            manualScore: w.manualScore,
            isOverridden: w.isOverridden,
            overrideReason: w.overrideReason,
          },
          update: {
            answerType: w.answerType as ScoringAnswerType,
            valueString: w.valueString,
            valueNumber: w.valueNumber,
            valueBoolean: w.valueBoolean,
            valueDate: w.valueDate,
            ...(w.touched.comment ? { comment: w.comment } : {}),
            ...(w.touched.manualScore ? { manualScore: w.manualScore } : {}),
            isOverridden: w.isOverridden,
            overrideReason: w.overrideReason,
            updatedAt: new Date(),
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: results.length,
        receivedCount: answers.length,
        ignored,
      },
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
