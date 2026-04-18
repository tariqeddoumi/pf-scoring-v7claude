import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * POST /api/scoring/evaluations
 * Create a new evaluation for a project using a specific model version.
 * Initializes empty answers based on binding defaults.
 */
export async function POST(req: NextRequest) {
  try {
    const { projectId, modelVersionId } = await req.json();

    if (!projectId || !modelVersionId) {
      return NextResponse.json(
        { success: false, error: "projectId and modelVersionId required", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Verify project & model version exist
    const [project, version] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.scoringModelVersion.findUnique({
        where: { id: modelVersionId },
        include: { model: true },
      }),
    ]);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (!version) {
      return NextResponse.json(
        { success: false, error: "Model version not found", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Create evaluation in draft status
    // Use null for analystId (can be set later when user logs in)
    const evaluation = await prisma.scoringEvaluation.create({
      data: {
        projectId,
        modelId: version.modelId,
        modelVersionId,
        analystId: null, // Optional - set when analyst reviews
        status: "brouillon",
      },
    });

    // Load all leaf nodes and create empty answers
    const nodes = await prisma.scoringNode.findMany({
      where: { versionId: modelVersionId, isActive: true },
      select: { id: true, answerType: true, defaultValue: true },
    });

    const answersToCreate = nodes.map((n) => ({
      evaluationId: evaluation.id,
      nodeId: n.id,
      answerType: (n.answerType || "TEXT") as any,
      valueString: n.defaultValue ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Bulk create answers (or skip if none)
    if (answersToCreate.length > 0) {
      await prisma.scoringEvaluationAnswer.createMany({
        data: answersToCreate,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error("POST /api/scoring/evaluations error:", error);
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

/**
 * GET /api/scoring/evaluations?projectId=...&modelVersionId=...
 * List evaluations for a project, optionally filtered by model version.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const modelVersionId = searchParams.get("modelVersionId");

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "projectId required", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const evaluations = await prisma.scoringEvaluation.findMany({
      where: {
        projectId,
        ...(modelVersionId && { modelVersionId }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: evaluations,
    });
  } catch (error) {
    console.error("GET /api/scoring/evaluations error:", error);
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
