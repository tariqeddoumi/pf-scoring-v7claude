import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/admin/scoring/nodes
 * List all nodes for a model version
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const versionId = searchParams.get("versionId");

    if (!versionId) {
      return NextResponse.json(
        { error: "versionId required", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const nodes = await prisma.scoringNode.findMany({
      where: { versionId },
      include: {
        childNodes: true,
        options: { orderBy: { orderIndex: "asc" } },
        ranges: { orderBy: { orderIndex: "asc" } },
      },
      orderBy: [{ depth: "asc" }, { orderIndex: "asc" }],
    });

    return NextResponse.json({ data: nodes });
  } catch (error) {
    console.error("GET /api/admin/scoring/nodes:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/scoring/nodes
 * Create a new domain or criterion
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      versionId,
      parentNodeId,
      nodeType,
      code,
      label,
      shortLabel,
      description,
      depth,
      orderIndex,
      weight,
      answerType,
    } = body;

    // Validation
    if (!versionId || !nodeType || !code || !label || depth === undefined) {
      return NextResponse.json(
        { error: "Missing required fields", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Check code uniqueness per version
    const existing = await prisma.scoringNode.findFirst({
      where: { versionId, code },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Code "${code}" already exists in this version`, errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const node = await prisma.scoringNode.create({
      data: {
        versionId,
        parentNodeId: parentNodeId || null,
        nodeType,
        code,
        label,
        shortLabel: shortLabel || null,
        description: description || null,
        displayPath: code,
        depth,
        orderIndex: orderIndex ?? 0,
        isActive: true,
        isTerminal: nodeType === "CRITERION",
        isScored: nodeType === "CRITERION",
        isMandatory: depth === 0,
        allowsChildren: nodeType === "DOMAIN" || nodeType === "GROUP",
        weight: weight || null,
        weightMode: weight ? "RELATIVE" : null,
        aggregationMethod: nodeType === "DOMAIN" ? "AVERAGE" : null,
        answerType: answerType || null,
      },
    });

    return NextResponse.json({ data: node }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/scoring/nodes:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/scoring/nodes/:nodeId
 * Update an existing node
 */
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nodeId = searchParams.get("nodeId");
    const body = await req.json();

    if (!nodeId) {
      return NextResponse.json(
        { error: "nodeId required", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const node = await prisma.scoringNode.update({
      where: { id: nodeId },
      data: {
        label: body.label || undefined,
        shortLabel: body.shortLabel || undefined,
        description: body.description || undefined,
        weight: body.weight || undefined,
        orderIndex: body.orderIndex ?? undefined,
      },
    });

    return NextResponse.json({ data: node });
  } catch (error) {
    console.error("PUT /api/admin/scoring/nodes:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/scoring/nodes/:nodeId
 * Delete a node and all its children
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nodeId = searchParams.get("nodeId");

    if (!nodeId) {
      return NextResponse.json(
        { error: "nodeId required", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Delete node (cascades to children via Prisma relations)
    await prisma.scoringNode.delete({
      where: { id: nodeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/scoring/nodes:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
