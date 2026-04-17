import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/admin/scoring-models/versions/[id]/bindings
 * Get all bindings for nodes in a version.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get all node IDs in this version
    const nodeIds = (
      await prisma.scoringNode.findMany({
        where: { versionId: params.id, isActive: true },
        select: { id: true },
      })
    ).map((n) => n.id);

    const bindings = await prisma.scoringNodeDataBinding.findMany({
      where: {
        nodeId: { in: nodeIds },
        isActive: true,
      },
      include: {
        node: { select: { id: true, code: true, label: true } },
      },
      orderBy: { priority: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: bindings,
    });
  } catch (error) {
    console.error("GET /api/admin/scoring-models/versions/[id]/bindings error:", error);
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
 * POST /api/admin/scoring-models/versions/[id]/bindings
 * Create a new binding for a node in this version.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      nodeId,
      sourceEntity,
      sourceField,
      sourcePath,
      bindingMode,
      dataType,
      transformType,
      transformConfigJson,
      defaultValue,
      fallbackValue,
      priority,
      description,
    } = body;

    if (!nodeId || !sourceEntity) {
      return NextResponse.json(
        {
          success: false,
          error: "nodeId and sourceEntity required",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Verify node belongs to this version
    const node = await prisma.scoringNode.findUnique({
      where: { id: nodeId },
    });

    if (!node || node.versionId !== params.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Node not found in this version",
          errorCode: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const binding = await prisma.scoringNodeDataBinding.create({
      data: {
        nodeId,
        sourceEntity,
        sourceField: sourceField || null,
        sourcePath: sourcePath || null,
        bindingMode: bindingMode || "AUTO_EDITABLE",
        dataType: dataType || null,
        transformType: transformType || "NONE",
        transformConfigJson: transformConfigJson ? JSON.stringify(transformConfigJson) : null,
        defaultValue: defaultValue || null,
        fallbackValue: fallbackValue || null,
        fallbackMessage: null,
        isRequired: false,
        isReadOnly: false,
        allowOverride: true,
        overrideRequiresReason: false,
        priority: priority || 100,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: binding,
    });
  } catch (error) {
    console.error("POST /api/admin/scoring-models/versions/[id]/bindings error:", error);
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
