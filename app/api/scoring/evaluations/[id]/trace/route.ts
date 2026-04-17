import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/scoring/evaluations/[id]/trace
 * Fetch detailed calculation trace & node results for an evaluation.
 * Shows raw scores, weighted scores, rule impacts, explanations.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evaluationId = id;

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

    // Fetch all node results
    const nodeResults = await prisma.scoringEvaluationNodeResult.findMany({
      where: { evaluationId },
      orderBy: { node: { depth: "asc" } },
      include: { node: true },
    });

    // Parse trace JSON if available
    let trace = null;
    if (evaluation.summaryJson) {
      try {
        trace = JSON.parse(evaluation.summaryJson);
      } catch {
        // Fallback to raw results
      }
    }

    const results = nodeResults.map((r) => ({
      nodeId: r.nodeId,
      nodeCode: r.node.code,
      nodeLabel: r.node.label,
      rawScore: r.rawScore,
      weightedScore: r.weightedScore,
      normalizedScore: r.normalizedScore,
      aggregationMethod: r.aggregationMethod,
      explanation: r.explanation,
      ruleImpacts: r.ruleImpactJson ? JSON.parse(r.ruleImpactJson) : [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        evaluationId,
        finalScore: evaluation.finalScore,
        rating: evaluation.rating,
        recommendation: evaluation.recommendation,
        malusTotal: evaluation.malusTotal,
        status: evaluation.status,
        calculatedAt: evaluation.updatedAt,
        submittedAt: evaluation.submittedAt,
        nodeResults: results,
        trace,
      },
    });
  } catch (error) {
    console.error("GET /api/scoring/evaluations/[id]/trace error:", error);
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
