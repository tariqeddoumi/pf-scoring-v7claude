import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * POST /api/scoring/evaluations/[id]/submit
 * Submit an evaluation for validation.
 * Requires: finalScore != null (i.e., calculation completed)
 * Transition: brouillon → soumise
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    if (!evaluation.finalScore) {
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

    // Log the submission event
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringEvaluation",
        entityId: evaluationId,
        evaluationId,
        action: "SUBMIT",
        newValueJson: JSON.stringify({ status: "soumise" }),
        changedBy: "system",
        comment: "Evaluation submitted for validation",
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
