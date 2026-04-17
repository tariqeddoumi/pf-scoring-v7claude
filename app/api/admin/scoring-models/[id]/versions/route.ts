import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/admin/scoring-models/[id]/versions
 * List all versions of a scoring model.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const versions = await prisma.scoringModelVersion.findMany({
      where: { modelId: id },
      select: {
        id: true,
        modelId: true,
        versionNumber: true,
        label: true,
        status: true,
        isPublished: true,
        createdAt: true,
        createdBy: true,
      },
      orderBy: { versionNumber: "desc" },
    });

    // Count nodes for each version
    const versionsWithCounts = await Promise.all(
      versions.map(async (v) => {
        const nodeCount = await prisma.scoringNode.count({
          where: { versionId: v.id },
        });
        return { ...v, nodeCount };
      })
    );

    return NextResponse.json({
      success: true,
      data: versionsWithCounts,
    });
  } catch (error) {
    console.error("GET /api/admin/scoring-models/[id]/versions error:", error);
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
 * POST /api/admin/scoring-models/[id]/versions
 * Create a new version of a model.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { label, fromVersionId } = body;

    if (!label) {
      return NextResponse.json(
        {
          success: false,
          error: "label required",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Get latest version number
    const latestVersion = await prisma.scoringModelVersion.findFirst({
      where: { modelId: id },
      orderBy: { versionNumber: "desc" },
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Create new version
    const version = await prisma.scoringModelVersion.create({
      data: {
        modelId: id,
        versionNumber: nextVersionNumber,
        label,
        status: "DRAFT",
        isPublished: false,
        createdBy: "system",
      },
    });

    // Copy nodes from previous version if specified
    if (fromVersionId) {
      const sourceNodes = await prisma.scoringNode.findMany({
        where: { versionId: fromVersionId },
      });

      // Map old IDs to new IDs
      const idMap = new Map<string, string>();
      const newNodes = sourceNodes.map((n) => {
        const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        idMap.set(n.id, newId);
        return {
          ...n,
          id: newId,
          versionId: version.id,
          parentNodeId: n.parentNodeId ? idMap.get(n.parentNodeId) || null : null,
        };
      });

      await prisma.scoringNode.createMany({
        data: newNodes.map(({ createdAt, updatedAt, ...n }) => n) as any,
      });
    }

    return NextResponse.json({
      success: true,
      data: version,
    });
  } catch (error) {
    console.error("POST /api/admin/scoring-models/[id]/versions error:", error);
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
