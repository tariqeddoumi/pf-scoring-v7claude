import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { ScoringAnswerType } from "@prisma/client";
import { normalizeAnswers } from "@/lib/services/scoring/answer-payload";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";

/**
 * Contrôle d'autorisation du parcours de saisie.
 *
 * Ces routes n'exigeaient qu'une session valide : un compte en lecture seule ou un
 * auditeur pouvait créer une évaluation, saisir des réponses, lancer le calcul et
 * soumettre le dossier à validation. La matrice de permissions fait foi.
 */
function refusPermission(action: "create" | "update") {
  return NextResponse.json(
    {
      success: false,
      error:
        action === "create"
          ? "Vos droits ne permettent pas de créer une évaluation"
          : "Vos droits ne permettent pas de modifier cette évaluation",
      errorCode: "ERR_FORBIDDEN",
    },
    { status: 403 }
  );
}

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

async function handlePATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  user: AuthPayload
) {
  try {
    if (!hasPermission(user.role as UserRole, "evaluation", "update")) {
      return refusPermission("update");
    }

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
      select: { id: true, status: true, modelVersionId: true },
    });
    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: "Évaluation introuvable", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Les réponses d'une évaluation soumise ou validée ne se modifient plus : la note
    // conservée ne correspondrait plus aux données. Pour corriger un dossier soumis,
    // on le remet d'abord en saisie (route reopen, tracée) ; un dossier validé se
    // réévalue.
    if (String(evaluation.status) !== "brouillon") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Les réponses ne sont modifiables qu'au brouillon. Remettez d'abord l'évaluation en saisie, ou créez une réévaluation si elle est validée.",
          errorCode: "INVALID_STATE",
        },
        { status: 409 }
      );
    }

    const nodeIds = answers
      .map((a: { nodeId?: string }) => a?.nodeId)
      .filter((v: unknown): v is string => typeof v === "string");

    // Seuls les nœuds de la version du modèle de l'évaluation sont acceptés : un nœud
    // d'une autre grille est retourné dans `ignored` comme nœud inconnu.
    const nodes = await prisma.scoringNode.findMany({
      where: { id: { in: nodeIds }, versionId: evaluation.modelVersionId },
      select: { id: true, answerType: true },
    });
    const answerTypeByNode = new Map<string, string>(
      nodes.map((n) => [n.id, n.answerType as unknown as string])
    );

    const { writes, ignored } = normalizeAnswers(answers, answerTypeByNode);

    // Toute modification des réponses invalide le calcul courant : la soumission
    // exige alors un nouveau calcul sur les données à jour.
    const invalidation = prisma.scoringEvaluation.update({
      where: { id: evaluationId },
      data: {
        finalScore: null,
        rating: null,
        recommendation: null,
        probabilityOfDefault: null,
        malusTotal: 0,
        triggeredRulesJson: null,
        summaryJson: null,
      },
    });

    const resultats = await prisma.$transaction([
      ...writes.map((w) =>
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
      ),
      ...(writes.length > 0 ? [invalidation] : []),
    ]);
    const results = resultats.slice(0, writes.length);

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: results.length,
        receivedCount: answers.length,
        ignored,
        // le client sait qu'il doit relancer le calcul avant de soumettre
        calculationInvalidated: writes.length > 0,
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

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return withAuth(req, (r, user) => handlePATCH(r, ctx, user));
}
