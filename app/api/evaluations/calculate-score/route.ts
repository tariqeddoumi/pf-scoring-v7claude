import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { EvaluationService } from "@/lib/services/evaluation-service";
import { ScoringQuestionnaireService } from "@/lib/services/scoring-questionnaire-service";
import { ScoringEngine } from "@/lib/services/scoring-engine";
import { scoreToRating } from "@/lib/utils/rating-converter";

/**
 * POST /api/evaluations/calculate-score  — LEGACY / DEPRECATED
 *
 * This is NOT the route used by the evaluation UI. The live scoring path is
 * `POST /api/scoring/evaluations/[id]/calculate` → `ScoringEngineV8`, which now
 * handles BOTH per-domain granularity and sectorial calibration natively
 * (see lib/services/scoring/scoring-engine-v8.ts + sectorial.ts).
 *
 * Sectorial re-integration was removed from this route: it previously relied on
 * a server-side relative-URL fetch (broken in Node) and a V9→V8 shape bridge
 * that produced degenerate adjustments. Use the live route for sectorial scoring.
 *
 * Kept only for backward compatibility of any external caller doing a one-shot
 * "save answers + base score" against the legacy Evaluation table.
 */
async function handlePOST(request: NextRequest, user: { userId: string }) {
  try {
    const { evaluationId, modelVersionId, answers } = await request.json();

    if (!evaluationId || !answers) {
      return NextResponse.json(
        { error: "Missing evaluationId or answers" },
        { status: 400 }
      );
    }

    // Save answers
    await ScoringQuestionnaireService.saveAnswers(evaluationId, answers);

    // Run scoring engine (granularity-aware via ScoringEngine)
    const scoreResults = await ScoringEngine.scoreEvaluation(
      evaluationId,
      modelVersionId
    );

    // Get final scores
    const { globalScore, scores } = await ScoringEngine.getFinalScores(
      evaluationId,
      scoreResults
    );

    const rating = scoreToRating(globalScore);

    await EvaluationService.updateEvaluation(
      evaluationId,
      { finalScore: globalScore, rating },
      user.userId
    );

    return NextResponse.json(
      {
        data: {
          finalScore: globalScore,
          rating,
          scores: Object.fromEntries(scores),
          deprecated: true,
          liveRoute: "/api/scoring/evaluations/[id]/calculate",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error calculating score:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
