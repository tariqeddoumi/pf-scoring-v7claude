import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/admin/scoring-models
 * List all scoring models for admin interface.
 */
export async function GET(req: NextRequest) {
  try {
    const models = await prisma.scoringModel.findMany({
      select: {
        id: true,
        code: true,
        label: true,
        businessSegment: true,
        projectType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: models,
    });
  } catch (error) {
    console.error("GET /api/admin/scoring-models error:", error);
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
 * POST /api/admin/scoring-models
 * Create a new scoring model.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, label, businessSegment, projectType, description } = body;

    if (!code || !label) {
      return NextResponse.json(
        {
          success: false,
          error: "code and label required",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.scoringModel.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Model with code "${code}" already exists`,
          errorCode: "DUPLICATE",
        },
        { status: 400 }
      );
    }

    const model = await prisma.scoringModel.create({
      data: {
        code,
        label,
        businessSegment: businessSegment || null,
        projectType: projectType || null,
        description: description || null,
        status: "DRAFT",
      },
    });

    return NextResponse.json({
      success: true,
      data: model,
    });
  } catch (error) {
    console.error("POST /api/admin/scoring-models error:", error);
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
