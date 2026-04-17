import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/admin/scoring-models/versions/[id]/rules
 * Get all rules for a version.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rules = await prisma.scoringNodeRule.findMany({
      where: { versionId: id, isActive: true },
      include: {
        node: { select: { id: true, code: true, label: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    console.error("GET /api/admin/scoring-models/versions/[id]/rules error:", error);
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
 * POST /api/admin/scoring-models/versions/[id]/rules
 * Create a new rule for a node in the version.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      nodeId,
      ruleType,
      code,
      label,
      conditionExpression,
      severity,
      penaltyValue,
      messageUser,
      messageCommittee,
    } = body;

    if (!nodeId || !ruleType || !code) {
      return NextResponse.json(
        {
          success: false,
          error: "nodeId, ruleType, and code required",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const maxOrderIndex = await prisma.scoringNodeRule.findFirst({
      where: { nodeId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });

    const orderIndex = (maxOrderIndex?.orderIndex ?? 0) + 1;

    const rule = await prisma.scoringNodeRule.create({
      data: {
        versionId: id,
        nodeId,
        ruleType,
        code,
        label: label || code,
        conditionExpression: conditionExpression || "true",
        severity: severity || "MEDIUM",
        actionType: ruleType === "MALUS" ? "APPLY_MALUS" : "BLOCK",
        penaltyValue: penaltyValue || null,
        messageUser: messageUser || null,
        messageCommittee: messageCommittee || null,
        blocking: ruleType === "NO_GO" || ruleType === "HARD_STOP",
        isActive: true,
        orderIndex,
      },
    });

    return NextResponse.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error("POST /api/admin/scoring-models/versions/[id]/rules error:", error);
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
