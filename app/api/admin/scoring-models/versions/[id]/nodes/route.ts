import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/admin/scoring-models/versions/[id]/nodes
 * Get all nodes for a version with tree structure.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const nodes = await prisma.scoringNode.findMany({
      where: { versionId: params.id, isActive: true },
      select: {
        id: true,
        versionId: true,
        parentNodeId: true,
        nodeType: true,
        code: true,
        label: true,
        depth: true,
        isScored: true,
        isMandatory: true,
        weight: true,
        weightMode: true,
        aggregationMethod: true,
        answerType: true,
        scoringMethod: true,
      },
      orderBy: [{ depth: "asc" }, { orderIndex: "asc" }],
    });

    // Count children for each node
    const nodesWithCounts = await Promise.all(
      nodes.map(async (n) => {
        const childCount = await prisma.scoringNode.count({
          where: { parentNodeId: n.id, isActive: true },
        });
        return { ...n, childrenCount: childCount };
      })
    );

    // Build tree structure
    const tree: any[] = [];
    const byId = new Map(nodesWithCounts.map((n) => [n.id, { ...n, children: [] }]));

    for (const node of nodesWithCounts) {
      if (!node.parentNodeId) {
        tree.push(byId.get(node.id));
      } else {
        const parent = byId.get(node.parentNodeId);
        if (parent) {
          parent.children.push(byId.get(node.id));
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: tree,
    });
  } catch (error) {
    console.error("GET /api/admin/scoring-models/versions/[id]/nodes error:", error);
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
 * POST /api/admin/scoring-models/versions/[id]/nodes
 * Create a new node in a version.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      parentNodeId,
      nodeType,
      code,
      label,
      description,
      isScored,
      weight,
      aggregationMethod,
    } = body;

    if (!nodeType || !code || !label) {
      return NextResponse.json(
        {
          success: false,
          error: "nodeType, code, and label required",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Determine depth based on parent
    let depth = 0;
    if (parentNodeId) {
      const parent = await prisma.scoringNode.findUnique({
        where: { id: parentNodeId },
      });
      if (parent) depth = parent.depth + 1;
    }

    // Create node
    const node = await prisma.scoringNode.create({
      data: {
        versionId: params.id,
        parentNodeId: parentNodeId || null,
        nodeType,
        code,
        label,
        description: description || null,
        depth,
        orderIndex: 0,
        isActive: true,
        isTerminal: false,
        isScored: isScored ?? false,
        isMandatory: false,
        weight: weight || null,
        weightMode: weight ? "FIXED" : null,
        aggregationMethod: aggregationMethod || "SUM",
      },
    });

    return NextResponse.json({
      success: true,
      data: node,
    });
  } catch (error) {
    console.error("POST /api/admin/scoring-models/versions/[id]/nodes error:", error);
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
