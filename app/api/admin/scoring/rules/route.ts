import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const versionId = searchParams.get("versionId");
      const nodeId = searchParams.get("nodeId");

      if (!versionId) {
        return validationError([{ field: "versionId", message: "Required query param" }]);
      }

      const where: any = { versionId, isActive: true };
      if (nodeId) where.nodeId = nodeId;

      const rules = await prisma.scoringNodeRule.findMany({
        where,
        include: {
          node: { select: { id: true, code: true, label: true } },
        },
        orderBy: { orderIndex: "asc" },
      });

      return successResponse(rules, { count: rules.length });
    } catch (error: any) {
      console.error("[ADMIN/SCORING/RULES] GET error:", error);
      return serverError("Erreur lors de la récupération des règles");
    }
  });
}

export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const body = await req.json();
      const {
        versionId,
        nodeId,
        ruleType,
        code,
        label,
        conditionExpression,
        severity,
        actionType,
        penaltyValue,
        messageUser,
        messageCommittee,
      } = body;

      if (!versionId || !nodeId || !ruleType || !code) {
        return validationError([
          { field: "versionId", message: "Requis" },
          { field: "nodeId", message: "Requis" },
          { field: "ruleType", message: "Requis" },
          { field: "code", message: "Requis" },
        ]);
      }

      const node = await prisma.scoringNode.findUnique({
        where: { id: nodeId },
      });

      if (!node || node.versionId !== versionId) {
        return validationError([{ field: "nodeId", message: "Nœud non trouvé dans cette version" }]);
      }

      const maxOrderIndex = await prisma.scoringNodeRule.findFirst({
        where: { nodeId },
        orderBy: { orderIndex: "desc" },
        select: { orderIndex: true },
      });

      const orderIndex = (maxOrderIndex?.orderIndex ?? 0) + 1;

      const rule = await prisma.scoringNodeRule.create({
        data: {
          versionId,
          nodeId,
          ruleType,
          code,
          label: label || code,
          conditionExpression: conditionExpression || "true",
          severity: severity || "MEDIUM",
          actionType: actionType || "SHOW_WARNING",
          penaltyValue: penaltyValue || 0,
          messageUser,
          messageCommittee,
          orderIndex,
          isActive: true,
        },
        include: {
          node: { select: { id: true, code: true, label: true } },
        },
      });

      return successResponse(rule, { status: 201 });
    } catch (error: any) {
      console.error("[ADMIN/SCORING/RULES] POST error:", error);
      return serverError("Erreur lors de la création de la règle");
    }
  });
}

export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const ruleId = searchParams.get("id");

      if (!ruleId) {
        return validationError([{ field: "id", message: "Required query param" }]);
      }

      const body = await req.json();
      const { label, conditionExpression, severity, actionType, penaltyValue, messageUser, messageCommittee } = body;

      const updated = await prisma.scoringNodeRule.update({
        where: { id: ruleId },
        data: {
          label,
          conditionExpression,
          severity,
          actionType,
          penaltyValue,
          messageUser,
          messageCommittee,
        },
        include: {
          node: { select: { id: true, code: true, label: true } },
        },
      });

      return successResponse(updated);
    } catch (error: any) {
      console.error("[ADMIN/SCORING/RULES] PUT error:", error);
      return serverError("Erreur lors de la mise à jour de la règle");
    }
  });
}

export async function DELETE(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const ruleId = searchParams.get("id");

      if (!ruleId) {
        return validationError([{ field: "id", message: "Required query param" }]);
      }

      await prisma.scoringNodeRule.delete({
        where: { id: ruleId },
      });

      return successResponse({ message: "Règle supprimée" });
    } catch (error: any) {
      console.error("[ADMIN/SCORING/RULES] DELETE error:", error);
      return serverError("Erreur lors de la suppression de la règle");
    }
  });
}
