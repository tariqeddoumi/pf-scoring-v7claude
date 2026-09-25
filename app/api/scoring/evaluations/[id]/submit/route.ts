import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";

/**
 * POST /api/scoring/evaluations/[id]/submit
 * Submit an evaluation for validation.
 * Requires: finalScore != null (i.e., calculation completed)
 * Transition: brouillon → soumise
 */
async function handlePOST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  user: AuthPayload
) {
  try {
    const { id } = await params;
    const evaluationId = id;
    const { notes } = await req.json();

    // Fetch evaluation
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: "Evaluation not found", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check preconditions
    if (evaluation.status !== "brouillon") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot submit evaluation in status "${evaluation.status}"`,
          errorCode: "INVALID_STATE",
        },
        { status: 400 }
      );
    }

    // FIX 5: allow finalScore=0, only block on null/undefined
    if (evaluation.finalScore === null || evaluation.finalScore === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot submit: calculation not completed (finalScore is null)",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Update status & record submission
    const updated = await prisma.scoringEvaluation.update({
      where: { id: evaluationId },
      data: {
        status: "soumis",
        submittedAt: new Date(),
        notes: notes || evaluation.notes,
      },
    });

    // Le journal porte l'identité de l'auteur de la transition : une trace
    // anonyme ne permet aucune reconstitution en revue.
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringEvaluation",
        entityId: evaluationId,
        evaluationId,
        action: "SUBMIT",
        newValueJson: JSON.stringify({ status: "soumis" }),
        changedBy: user.userId,
        comment: "Évaluation soumise pour validation",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        evaluationId,
        status: updated.status,
        submittedAt: updated.submittedAt,
      },
    });
  } catch (error) {
    console.error("POST /api/scoring/evaluations/[id]/submit error:", error);
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

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return withAuth(req, (r, user) => handlePOST(r, ctx, user));
}
