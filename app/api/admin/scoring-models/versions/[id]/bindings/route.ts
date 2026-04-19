import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/admin/scoring-models/versions/[id]/bindings
 * Get all bindings for nodes in a version.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async () => {
    try {
      const { id } = await params;

      // Get all node IDs in this version
      const nodeIds = (
        await prisma.scoringNode.findMany({
          where: { versionId: id, isActive: true },
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

      return successResponse(bindings, { count: bindings.length });
    } catch (error: any) {
      console.error("[ADMIN/SCORING-MODELS/VERSIONS/[ID]/BINDINGS] GET error:", error);
      return serverError("Erreur lors de la récupération des liaisons");
    }
  });
}

/**
 * POST /api/admin/scoring-models/versions/[id]/bindings
 * Create a new binding for a node in this version.
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
        return validationError([
          { field: "nodeId", message: "Requis" },
          { field: "sourceEntity", message: "Requis" },
        ]);
      }

      // Verify node belongs to this version
      const node = await prisma.scoringNode.findUnique({
        where: { id: nodeId },
      });

      if (!node || node.versionId !== id) {
        return errorResponse("Nœud non trouvé dans cette version", { status: 404, errorCode: "NOT_FOUND" });
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

      return successResponse(binding, { status: 201 });
    } catch (error: any) {
      console.error("[ADMIN/SCORING-MODELS/VERSIONS/[ID]/BINDINGS] POST error:", error);
      return serverError("Erreur lors de la création de la liaison");
    }
  });
}
