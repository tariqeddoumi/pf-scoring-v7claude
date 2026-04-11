/**
 * POST /api/evaluations/[id]/score/calculate
 * Calculate PF Scoring V7++ for a project
 */

import { NextRequest, NextResponse } from "next/server";
import { ScoringEngine } from "@/lib/scoring-engine-v7plus";
import { RulesEngine } from "@/lib/scoring-rules-v7plus";
import {
  DataValidator,
  ComplexIndicatorsCalculator,
} from "@/lib/scoring-validators-v7plus";
import {
  ScoringRequestBody,
  ScoringResponseBody,
} from "@/types/scoring-v7plus";
import { saveEvaluation, logScoringAction } from "@/lib/db-scoring";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ScoringResponseBody>> {
  try {
    const { id: evaluationId } = await context.params;

    // Parse request body
    let body: ScoringRequestBody;
    try {
      body = (await request.json()) as ScoringRequestBody;
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON body",
        },
        { status: 400 }
      );
    }

    const { projectData, includeStressTests, analystName } = body;

    // Validate input data
    const validator = new DataValidator();
    const completenessCheck = validator.validateCompleteness(projectData);
    const fieldErrors = validator.validateFields(projectData);
    const logicErrors = validator.validateBusinessLogic(projectData);

    // Check for critical missing data
    if (completenessCheck.overall === "MISSING") {
      return NextResponse.json(
        {
          success: false,
          error: `Critical data missing: ${completenessCheck.missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check for validation errors
    const criticalErrors = fieldErrors.filter((e) => e.severity === "ERROR");
    if (criticalErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation errors: ${criticalErrors.map((e) => e.message).join("; ")}`,
        },
        { status: 400 }
      );
    }

    // Create scoring engine and calculate
    const engine = new ScoringEngine(projectData);
    const rulesEngine = new RulesEngine();
    const indicatorsCalc = new ComplexIndicatorsCalculator();

    // Main calculation
    const result = engine.calculateGlobalScore(rulesEngine, validator);

    // Add analyst info if provided
    if (analystName) {
      result.analystName = analystName;
    }

    // Save evaluation to database
    try {
      const savedEvaluation = await saveEvaluation(
        projectData.projectId,
        analystName || "unknown",
        result
      );

      // Log scoring action
      await logScoringAction(
        analystName || "unknown",
        "CALCULATE",
        `Evaluation ${evaluationId} calculated: ${result.rating} (${result.finalScore.toFixed(2)})`,
        undefined,
        evaluationId
      );
    } catch (dbError) {
      console.error("[DB ERROR] Failed to save evaluation:", dbError);
      // Continue anyway - return the calculated result
    }

    // Prepare response
    const response: ScoringResponseBody = {
      success: true,
      result,
    };

    // Log calculation (for audit trail)
    console.log(
      `[SCORING] Evaluation ${evaluationId} calculated by ${analystName || "unknown"}`
    );
    console.log(
      `[SCORING] Result: ${result.rating} (Score: ${result.finalScore.toFixed(2)})`
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[SCORING ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/evaluations/[id]/score/calculate
 * Retrieve a previously calculated score
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: evaluationId } = await context.params;

    // In a real app, fetch from database
    // For now, return not implemented
    return NextResponse.json(
      {
        success: false,
        error:
          "Use POST to calculate scores. Use GET /api/evaluations/[id]/report to retrieve saved results.",
      },
      { status: 405 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error retrieving evaluation",
      },
      { status: 500 }
    );
  }
}
