import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/admin/scoring-models/versions/[id]/nodes
 * Get all nodes for a version with tree structure.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async () => {
    try {
      const { id } = await params;
      const nodes = await prisma.scoringNode.findMany({
        where: { versionId: id, isActive: true },
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
      const byId = new Map<string, any>(
        nodesWithCounts.map((n) => [n.id, { ...n, children: [] }])
      );

      for (const node of nodesWithCounts) {
        const nodeEntry = byId.get(node.id);
        if (!node.parentNodeId) {
          if (nodeEntry) tree.push(nodeEntry);
        } else {
          const parent = byId.get(node.parentNodeId);
          if (parent && nodeEntry) {
            (parent.children as any[]).push(nodeEntry);
          }
        }
      }

      return successResponse(tree, { count: tree.length });
    } catch (error: any) {
      console.error("[ADMIN/SCORING-MODELS/VERSIONS/[ID]/NODES] GET error:", error);
      return serverError("Erreur lors de la récupération des nœuds");
    }
  });
}

/**
 * POST /api/admin/scoring-models/versions/[id]/nodes
 * Create a new node in a version.
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
        return validationError([
          { field: "nodeType", message: "Requis" },
          { field: "code", message: "Requis" },
          { field: "label", message: "Requis" },
        ]);
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
          versionId: id,
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

      return successResponse(node, { status: 201 });
    } catch (error: any) {
      console.error("[ADMIN/SCORING-MODELS/VERSIONS/[ID]/NODES] POST error:", error);
      return serverError("Erreur lors de la création du nœud");
    }
  });
}
