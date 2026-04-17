import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { ScoringEngineV8 } from "@/lib/services/scoring";

/**
 * POST /api/scoring/evaluations/[id]/calculate
 * Trigger full evaluation calculation:
 * 1. Load all answers
 * 2. Run scoring engine
 * 3. Apply rules & malus
 * 4. Persist results (node scores, final score, rating)
 * 5. Return trace with explanations
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const evaluationId = params.id;

    // Verify evaluation exists
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: "Evaluation not found", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (evaluation.status === "soumis" || evaluation.status === "valide") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot recalculate a submitted or approved evaluation",
          errorCode: "INVALID_STATE",
        },
        { status: 400 }
      );
    }

    // Run the scoring engine
    const trace = await ScoringEngineV8.scoreEvaluation(evaluationId);

    // Persist the results
    await ScoringEngineV8.persistTrace(trace);

    return NextResponse.json({
      success: true,
      data: {
        evaluationId,
        finalScore: trace.finalScore,
        rating: trace.rating,
        recommendation: trace.recommendation,
        malusTotal: trace.malusTotal,
        triggeredRuleCount: trace.triggeredRuleIds.length,
        traceUrl: `/api/scoring/evaluations/${evaluationId}/trace`,
      },
    });
  } catch (error) {
    console.error("POST /api/scoring/evaluations/[id]/calculate error:", error);
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
