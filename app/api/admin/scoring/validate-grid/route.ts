import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";
import type { GridValidationError } from "@/lib/types/scoring-grid";

export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { versionId } = await req.json();
      if (!versionId) return validationError([{ field: "versionId", message: "Requis" }]);

      const nodes = await prisma.scoringNode.findMany({
        where: { versionId, isActive: true },
        include: {
          options: { where: { isActive: true } },
          ranges: { where: { isActive: true }, orderBy: { minValue: "asc" } },
        },
        orderBy: [{ depth: "asc" }, { orderIndex: "asc" }],
      });

      const errors: GridValidationError[] = [];

      // Build path map
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const getPath = (nodeId: string): string => {
        const parts: string[] = [];
        let current: any = nodeMap.get(nodeId);
        while (current) {
          parts.unshift(current.label);
          current = current.parentNodeId ? nodeMap.get(current.parentNodeId) : null;
        }
        return parts.join(" › ");
      };

      // Group nodes by parent
      const byParent = new Map<string | null, typeof nodes>();
      for (const node of nodes) {
        const key = node.parentNodeId ?? null;
        if (!byParent.has(key)) byParent.set(key, []);
        byParent.get(key)!.push(node);
      }

      // Validate weights per sibling group
      // Weights are stored as fractions (0.0-1.0), tolerance ±1.5% = ±0.015
      for (const [parentId, siblings] of byParent.entries()) {
        const withWeight = siblings.filter((n) => n.weight !== null && n.weight !== undefined);
        if (withWeight.length === 0) continue;
        const total = withWeight.reduce((s, n) => s + (n.weight ?? 0), 0);
        const isPercentageFormat = total > 1.5; // heuristic: if sum > 1.5 assume % format
        const expected = isPercentageFormat ? 100 : 1;
        const tolerance = isPercentageFormat ? 1.5 : 0.015;
        if (Math.abs(total - expected) > tolerance) {
          for (const n of withWeight) {
            const displayTotal = isPercentageFormat ? total.toFixed(1) + "%" : (total * 100).toFixed(1) + "%";
            errors.push({
              nodeId: n.id,
              nodePath: getPath(n.id),
              field: "weight",
              message: `Poids: total ${displayTotal} (attendu 100%) dans ce groupe`,
              severity: "error",
            });
          }
        }
      }

      // Validate leaves: must have options or ranges
      for (const node of nodes) {
        if (!node.isScoringLeaf) continue;
        if (node.answerType === "OPTION_SINGLE" && node.options.length === 0) {
          errors.push({
            nodeId: node.id,
            nodePath: getPath(node.id),
            field: "options",
            message: `Aucune option définie pour ce critère OPTION_SINGLE`,
            severity: "error",
          });
        }
        if (node.answerType === "NUMERIC_RANGE" && node.ranges.length === 0) {
          errors.push({
            nodeId: node.id,
            nodePath: getPath(node.id),
            field: "range",
            message: `Aucune plage définie pour ce critère NUMERIC_RANGE`,
            severity: "error",
          });
        }

        // Validate range overlaps
        if (node.answerType === "NUMERIC_RANGE" && node.ranges.length > 1) {
          const sorted = [...node.ranges].sort((a, b) => a.minValue - b.minValue);
          for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].maxValue > sorted[i + 1].minValue) {
              errors.push({
                nodeId: node.id,
                nodePath: getPath(node.id),
                field: "range",
                message: `Chevauchement: [${sorted[i].minValue}-${sorted[i].maxValue}] et [${sorted[i + 1].minValue}-${sorted[i + 1].maxValue}]`,
                severity: "error",
              });
            }
          }
        }
      }

      return successResponse({
        valid: errors.filter((e) => e.severity === "error").length === 0,
        errorCount: errors.filter((e) => e.severity === "error").length,
        warningCount: errors.filter((e) => e.severity === "warning").length,
        errors,
      });
    } catch (error) {
      console.error("[SCORING/VALIDATE-GRID] POST error:", error);
      return serverError("Erreur lors de la validation");
    }
  });
}
