import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { EvaluationService } from "@/lib/services/evaluation-service";
import { ScoringQuestionnaireService } from "@/lib/services/scoring-questionnaire-service";
import { ScoringEngine } from "@/lib/services/scoring-engine";
import { V8ScoringEngine } from "@/lib/scoring-engine-v8";
import prisma from "@/lib/prisma";

/**
 * POST /api/evaluations/calculate-score - Calculate score from answers
 * Includes V8 sectoral adjustments if sector is available
 */
async function handlePOST(request: NextRequest, user: any) {
  try {
    const { evaluationId, modelVersionId, answers, sectorCode } = await request.json();

    if (!evaluationId || !answers) {
      return NextResponse.json(
        { error: "Missing evaluationId or answers" },
        { status: 400 }
      );
    }

    // Save answers
    await ScoringQuestionnaireService.saveAnswers(evaluationId, answers);

    // Run scoring engine
    const scoreResults = await ScoringEngine.scoreEvaluation(
      evaluationId,
      modelVersionId
    );

    // Get final scores
    let { globalScore, scores } = await ScoringEngine.getFinalScores(
      evaluationId,
      scoreResults
    );

    // Determine rating based on score
    let rating = getRatingFromScore(globalScore);
    let v8Adjustment = null;

    // Apply V8 sectoral adjustments if sector is specified
    if (sectorCode) {
      try {
        const sectorData = await prisma.v8Sector.findFirst({
          where: { code: sectorCode },
          include: {
            domainWeights: true,
            stressTests: true,
            redFlags: true,
            domainImpacts: true,
          },
        });

        if (sectorData) {
          // Fetch evaluation data for stress test assessment
          const evaluation = await prisma.evaluation.findUnique({
            where: { id: evaluationId },
            include: { project: true },
          });

          // Apply V8 adjustments
          const adjustedResult = V8ScoringEngine.applyV8Adjustments(
            {
              evaluationId,
              projectId: evaluation?.projectId || "",
              projectName: (evaluation?.project?.nom || evaluation?.project?.description) as string,
              domains: Object.fromEntries(scores),
              globalScore,
              normalizedScore: globalScore,
              rating: rating as unknown as import("@/types/scoring-v7plus").RatingScale,
              probabilityOfDefault: 0.05,
              triggeredNOGOs: [],
              appliedMALUS: [],
              malusTotal: 0,
              finalScore: globalScore,
              recommendation: "APPROVE",
              calculatedAt: new Date(),
              version: "7.0",
            },
            sectorData as any,
            evaluation?.project || {}
          );

          globalScore = adjustedResult.normalizedScore;
          rating = adjustedResult.rating;
          v8Adjustment = adjustedResult.v8Adjustment;
        }
      } catch (v8Error) {
        console.warn("V8 adjustment failed, continuing with base score:", v8Error);
      }
    }

    // Update evaluation with calculated scores
    await EvaluationService.updateEvaluation(
      evaluationId,
      {
        finalScore: globalScore,
        rating,
      },
      user.userId
    );

    return NextResponse.json(
      {
        data: {
          finalScore: globalScore,
          rating,
          scores: Object.fromEntries(scores),
          v8Adjustment,
          sectorCode,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error calculating score:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * Determine rating from score
 */
function getRatingFromScore(score: number): string {
  const thresholds: Record<string, { min: number; max: number }> = {
    AAA: { min: 95, max: 100 },
    AA: { min: 85, max: 94 },
    A: { min: 75, max: 84 },
    BBB: { min: 65, max: 74 },
    BB: { min: 55, max: 64 },
    B: { min: 45, max: 54 },
    CCC: { min: 35, max: 44 },
    CC: { min: 25, max: 34 },
    C: { min: 15, max: 24 },
    D: { min: 0, max: 14 },
  };

  for (const [rating, { min, max }] of Object.entries(thresholds)) {
    if (score >= min && score <= max) {
      return rating;
    }
  }

  return "D"; // Default to lowest rating
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
