import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * POST /api/admin/scoring/ranges
 * Add a new range to a criterion
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nodeId, minValue, maxValue, score, label, orderIndex } = body;

    if (!nodeId || minValue === undefined || maxValue === undefined || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: nodeId, minValue, maxValue, score", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Verify node exists and is a criterion
    const node = await prisma.scoringNode.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      return NextResponse.json(
        { error: "Criterion not found", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (node.nodeType !== "CRITERION") {
      return NextResponse.json(
        { error: "Can only add ranges to criteria", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Validate range logic
    if (minValue > maxValue) {
      return NextResponse.json(
        { error: "minValue must be less than or equal to maxValue", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const range = await prisma.scoringRange.create({
      data: {
        nodeId,
        minValue,
        maxValue,
        score,
        label: label || null,
        orderIndex: orderIndex ?? 0,
      },
    });

    return NextResponse.json({ data: range }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/scoring/ranges:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/scoring/ranges/:rangeId
 * Update an existing range
 */
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rangeId = searchParams.get("rangeId");
    const body = await req.json();

    if (!rangeId) {
      return NextResponse.json(
        { error: "rangeId required", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Validate range logic if provided
    if (body.minValue !== undefined && body.maxValue !== undefined) {
      if (body.minValue > body.maxValue) {
        return NextResponse.json(
          { error: "minValue must be less than or equal to maxValue", errorCode: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }
    }

    const range = await prisma.scoringRange.update({
      where: { id: rangeId },
      data: {
        minValue: body.minValue !== undefined ? body.minValue : undefined,
        maxValue: body.maxValue !== undefined ? body.maxValue : undefined,
        score: body.score !== undefined ? body.score : undefined,
        label: body.label !== undefined ? body.label : undefined,
        orderIndex: body.orderIndex ?? undefined,
      },
    });

    return NextResponse.json({ data: range });
  } catch (error) {
    console.error("PUT /api/admin/scoring/ranges:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/scoring/ranges/:rangeId
 * Delete a range
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rangeId = searchParams.get("rangeId");

    if (!rangeId) {
      return NextResponse.json(
        { error: "rangeId required", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    await prisma.scoringRange.delete({
      where: { id: rangeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/scoring/ranges:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
