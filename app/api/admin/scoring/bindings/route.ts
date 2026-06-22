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

      let nodeIds: string[] = [];
      if (nodeId) {
        nodeIds = [nodeId];
      } else {
        nodeIds = (
          await prisma.scoringNode.findMany({
            where: { versionId, isActive: true },
            select: { id: true },
          })
        ).map((n) => n.id);
      }

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
      console.error("[ADMIN/SCORING/BINDINGS] GET error:", error);
      return serverError("Erreur lors de la récupération des liaisons");
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

      if (!versionId || !nodeId || !sourceEntity) {
        return validationError([
          { field: "versionId", message: "Requis" },
          { field: "nodeId", message: "Requis" },
          { field: "sourceEntity", message: "Requis" },
        ]);
      }

      const node = await prisma.scoringNode.findUnique({
        where: { id: nodeId },
      });

      if (!node || node.versionId !== versionId) {
        return validationError([{ field: "nodeId", message: "Nœud non trouvé dans cette version" }]);
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
          isActive: true,
          description,
        },
        include: {
          node: { select: { id: true, code: true, label: true } },
        },
      });

      return successResponse(binding, { status: 201 });
    } catch (error: any) {
      console.error("[ADMIN/SCORING/BINDINGS] POST error:", error);
      return serverError("Erreur lors de la création de la liaison");
    }
  });
}

export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const bindingId = searchParams.get("id");

      if (!bindingId) {
        return validationError([{ field: "id", message: "Required query param" }]);
      }

      const body = await req.json();
      const {
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

      const updated = await prisma.scoringNodeDataBinding.update({
        where: { id: bindingId },
        data: {
          sourceEntity,
          sourceField,
          sourcePath,
          bindingMode,
          dataType,
          transformType,
          transformConfigJson: transformConfigJson ? JSON.stringify(transformConfigJson) : null,
          defaultValue,
          fallbackValue,
          priority,
          description,
        },
        include: {
          node: { select: { id: true, code: true, label: true } },
        },
      });

      return successResponse(updated);
    } catch (error: any) {
      console.error("[ADMIN/SCORING/BINDINGS] PUT error:", error);
      return serverError("Erreur lors de la mise à jour de la liaison");
    }
  });
}

export async function DELETE(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const bindingId = searchParams.get("id");

      if (!bindingId) {
        return validationError([{ field: "id", message: "Required query param" }]);
      }

      await prisma.scoringNodeDataBinding.delete({
        where: { id: bindingId },
      });

      return successResponse({ message: "Liaison supprimée" });
    } catch (error: any) {
      console.error("[ADMIN/SCORING/BINDINGS] DELETE error:", error);
      return serverError("Erreur lors de la suppression de la liaison");
    }
  });
}
