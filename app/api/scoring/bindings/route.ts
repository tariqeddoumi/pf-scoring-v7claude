import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * POST /api/scoring/bindings
 * Create a new node data binding.
 * Links a scoring node to a source (CLIENT/PROJECT/etc) field with transform & mode.
 */
export async function POST(req: NextRequest) {
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
      fallbackMessage,
      isRequired,
      isReadOnly,
      allowOverride,
      overrideRequiresReason,
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

    // Verify node exists
    const node = await prisma.scoringNode.findUnique({ where: { id: nodeId } });
    if (!node) {
      return NextResponse.json(
        { success: false, error: "Node not found", errorCode: "NOT_FOUND" },
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
        fallbackMessage: fallbackMessage || null,
        isRequired: isRequired ?? false,
        isReadOnly: isReadOnly ?? false,
        allowOverride: allowOverride ?? true,
        overrideRequiresReason: overrideRequiresReason ?? false,
        priority: priority ?? 100,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: binding,
    });
  } catch (error) {
    console.error("POST /api/scoring/bindings error:", error);
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
 * GET /api/scoring/bindings?nodeId=...
 * List bindings for a node, optionally filtered by source.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nodeId = searchParams.get("nodeId");
    const sourceEntity = searchParams.get("sourceEntity");

    if (!nodeId) {
      return NextResponse.json(
        { success: false, error: "nodeId required", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const bindings = await prisma.scoringNodeDataBinding.findMany({
      where: {
        nodeId,
        ...(sourceEntity && { sourceEntity }),
        isActive: true,
      },
      orderBy: { priority: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: bindings,
    });
  } catch (error) {
    console.error("GET /api/scoring/bindings error:", error);
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
