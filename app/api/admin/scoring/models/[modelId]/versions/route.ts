import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function GET(req: NextRequest, context: { params: Promise<{ modelId: string }> }) {
  return withAdminAuth(req, async () => {
    try {
      const { modelId } = await context.params;
      const versions = await prisma.scoringModelVersion.findMany({
        where: { modelId },
        orderBy: { versionNumber: "desc" },
      });
      return successResponse(versions, { count: versions.length });
    } catch (error) {
      console.error("[SCORING/VERSIONS] GET error:", error);
      return serverError("Erreur lors de la récupération des versions");
    }
  });
}

export async function POST(req: NextRequest, context: { params: Promise<{ modelId: string }> }) {
  return withAdminAuth(req, async (_, user) => {
    try {
      const { modelId } = await context.params;
      const body = await req.json().catch(() => ({}));

      const lastVersion = await prisma.scoringModelVersion.findFirst({
        where: { modelId },
        orderBy: { versionNumber: "desc" },
        include: {
          nodes: {
            include: {
              options: true,
              ranges: true,
            },
          },
        },
      });

      const newVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

      // Find system/admin user for createdBy
      const adminUser = await prisma.user.findFirst({
        where: { role: "system_admin", isActive: true, deletedAt: null },
        orderBy: { createdAt: "asc" },
      });
      const createdBy = adminUser?.id ?? user.userId;

      const newVersion = await prisma.scoringModelVersion.create({
        data: {
          modelId,
          versionNumber: newVersionNumber,
          label: `v${newVersionNumber}`,
          status: "DRAFT",
          isPublished: false,
          changeReason: body.changeReason ?? `Clone de v${lastVersion?.versionNumber ?? 0}`,
          createdBy,
        },
      });

      // Clone nodes + options + ranges from previous version
      if (lastVersion?.nodes?.length) {
        const oldToNew = new Map<string, string>();

        // First pass: create all nodes (preserve hierarchy order)
        const sortedNodes = [...lastVersion.nodes].sort((a, b) => a.depth - b.depth || a.orderIndex - b.orderIndex);

        for (const node of sortedNodes) {
          const newNode = await prisma.scoringNode.create({
            data: {
              versionId: newVersion.id,
              parentNodeId: node.parentNodeId ? (oldToNew.get(node.parentNodeId) ?? null) : null,
              nodeType: node.nodeType as any,
              code: node.code,
              label: node.label,
              shortLabel: node.shortLabel,
              description: node.description,
              depth: node.depth,
              orderIndex: node.orderIndex,
              weight: node.weight,
              aggregationMethod: node.aggregationMethod as any,
              answerType: node.answerType as any,
              isScoringLeaf: node.isScoringLeaf,
              isTerminal: node.isTerminal,
              isActive: node.isActive,
            },
          });
          oldToNew.set(node.id, newNode.id);

          // Clone options
          for (const opt of node.options) {
            await prisma.scoringNodeOption.create({
              data: {
                nodeId: newNode.id,
                label: opt.label,
                code: opt.code,
                value: opt.value,
                score: opt.score,
                orderIndex: opt.orderIndex,
                isActive: opt.isActive,
                color: opt.color,
              },
            });
          }

          // Clone ranges
          for (const range of node.ranges) {
            await prisma.scoringNodeRange.create({
              data: {
                nodeId: newNode.id,
                label: range.label,
                minValue: range.minValue,
                maxValue: range.maxValue,
                minIncluded: range.minIncluded,
                maxIncluded: range.maxIncluded,
                score: range.score,
                orderIndex: range.orderIndex,
                isActive: range.isActive,
              },
            });
          }
        }
      }

      return successResponse(newVersion, { status: 201 });
    } catch (error) {
      console.error("[SCORING/VERSIONS] POST error:", error);
      return serverError("Erreur lors de la création de la version");
    }
  });
}
