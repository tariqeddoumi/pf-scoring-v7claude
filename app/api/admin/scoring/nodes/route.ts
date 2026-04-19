import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/admin/scoring/nodes
 * List all nodes for a model version
 */
export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const versionId = searchParams.get("versionId");

      if (!versionId) {
        return validationError([{ field: "versionId", message: "Requis" }]);
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

      return successResponse(nodes, { count: nodes.length });
    } catch (error: any) {
      console.error("[ADMIN/SCORING/NODES] GET error:", error);
      return serverError("Erreur lors de la récupération des nœuds");
    }
  });
}

/**
 * POST /api/admin/scoring/nodes
 * Create a new domain or criterion
 */
export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
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
        return validationError([
          { field: "versionId", message: "Requis" },
          { field: "nodeType", message: "Requis" },
          { field: "code", message: "Requis" },
          { field: "label", message: "Requis" },
          { field: "depth", message: "Requis" },
        ]);
      }

      // Check code uniqueness per version
      const existing = await prisma.scoringNode.findFirst({
        where: { versionId, code },
      });

      if (existing) {
        return validationError([
          { field: "code", message: `Le code "${code}" existe déjà dans cette version` },
        ]);
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

      return successResponse(node, { status: 201 });
    } catch (error: any) {
      console.error("[ADMIN/SCORING/NODES] POST error:", error);
      return serverError("Erreur lors de la création du nœud");
    }
  });
}

/**
 * PUT /api/admin/scoring/nodes/:nodeId
 * Update an existing node
 */
export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const nodeId = searchParams.get("nodeId");
      const body = await req.json();

      if (!nodeId) {
        return validationError([{ field: "nodeId", message: "Requis" }]);
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

      return successResponse(node);
    } catch (error: any) {
      console.error("[ADMIN/SCORING/NODES] PUT error:", error);
      return serverError("Erreur lors de la mise à jour du nœud");
    }
  });
}

/**
 * DELETE /api/admin/scoring/nodes/:nodeId
 * Delete a node and all its children
 */
export async function DELETE(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const nodeId = searchParams.get("nodeId");

      if (!nodeId) {
        return validationError([{ field: "nodeId", message: "Requis" }]);
      }

      // Delete node (cascades to children via Prisma relations)
      await prisma.scoringNode.delete({
        where: { id: nodeId },
      });

      return successResponse({ success: true });
    } catch (error: any) {
      console.error("[ADMIN/SCORING/NODES] DELETE error:", error);
      return serverError("Erreur lors de la suppression du nœud");
    }
  });
}
