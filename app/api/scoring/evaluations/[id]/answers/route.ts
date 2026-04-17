import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * PATCH /api/scoring/evaluations/[id]/answers
 * Batch update answers for an evaluation.
 * Accepts array of { nodeId, value, overrideReason? }.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const evaluationId = params.id;
    const { answers } = await req.json();

    if (!Array.isArray(answers)) {
      return NextResponse.json(
        {
          success: false,
          error: "answers must be an array",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

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

    // Update each answer
    const updated = [];
    for (const { nodeId, value, overrideReason } of answers) {
      if (!nodeId || value === undefined) continue;

      // Determine value type & storage column
      let valueString: string | null = null;
      let valueNumber: number | null = null;
      let valueBoolean: boolean | null = null;
      let valueDate: Date | null = null;

      if (typeof value === "string") {
        valueString = value;
      } else if (typeof value === "number") {
        valueNumber = value;
      } else if (typeof value === "boolean") {
        valueBoolean = value;
      } else if (value instanceof Date || typeof value === "string") {
        valueDate = new Date(value);
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
