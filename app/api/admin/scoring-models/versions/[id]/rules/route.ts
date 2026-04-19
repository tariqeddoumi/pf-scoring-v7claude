import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/admin/scoring-models/versions/[id]/rules
 * Get all rules for a version.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async () => {
    try {
      const { id } = await params;
      const rules = await prisma.scoringNodeRule.findMany({
        where: { versionId: id, isActive: true },
        include: {
          node: { select: { id: true, code: true, label: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return successResponse(rules, { count: rules.length });
    } catch (error: any) {
      console.error("[ADMIN/SCORING-MODELS/VERSIONS/[ID]/RULES] GET error:", error);
      return serverError("Erreur lors de la récupération des règles");
    }
  });
}

/**
 * POST /api/admin/scoring-models/versions/[id]/rules
 * Create a new rule for a node in the version.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async () => {
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
        return validationError([
          { field: "nodeId", message: "Requis" },
          { field: "ruleType", message: "Requis" },
          { field: "code", message: "Requis" },
        ]);
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

      return successResponse(rule, { status: 201 });
    } catch (error: any) {
      console.error("[ADMIN/SCORING-MODELS/VERSIONS/[ID]/RULES] POST error:", error);
      return serverError("Erreur lors de la création de la règle");
    }
  });
}
