import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * POST /api/admin/scoring/options
 * Add a new option to a criterion
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { criterionId, label, score, description } = body;

    if (!criterionId || !label || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: criterionId, label, score", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Verify criterion exists
    const criterion = await prisma.scoringNode.findUnique({
      where: { id: criterionId },
    });

    if (!criterion) {
      return NextResponse.json(
        { error: "Criterion not found", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (criterion.nodeType !== "CRITERION") {
      return NextResponse.json(
        { error: "Can only add options to criteria", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const option = await prisma.scoringOption.create({
      data: {
        criterionId,
        label,
        score,
        description: description || null,
        orderIndex: 0,
      },
    });

    return NextResponse.json({ data: option }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/scoring/options:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/scoring/options/:optionId
 * Update an existing option
 */
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const optionId = searchParams.get("optionId");
    const body = await req.json();

    if (!optionId) {
      return NextResponse.json(
        { error: "optionId required", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const option = await prisma.scoringOption.update({
      where: { id: optionId },
      data: {
        label: body.label || undefined,
        score: body.score !== undefined ? body.score : undefined,
        description: body.description !== undefined ? body.description : undefined,
      },
    });

    return NextResponse.json({ data: option });
  } catch (error) {
    console.error("PUT /api/admin/scoring/options:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/scoring/options/:optionId
 * Delete an option
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const optionId = searchParams.get("optionId");

    if (!optionId) {
      return NextResponse.json(
        { error: "optionId required", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    await prisma.scoringOption.delete({
      where: { id: optionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/scoring/options:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
