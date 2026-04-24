import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const versionId = searchParams.get("versionId");
      if (!versionId) return validationError([{ field: "versionId", message: "Requis" }]);

      const nodes = await prisma.scoringNode.findMany({
        where: { versionId, isActive: true },
        include: {
          options: { where: { isActive: true } },
          ranges: { where: { isActive: true } },
        },
      });

      const leaves = nodes.filter((n) => n.isScoringLeaf);
      const configuredLeaves = leaves.filter(
        (n) =>
          (n.answerType === "OPTION_SINGLE" && n.options.length > 0) ||
          (n.answerType === "NUMERIC_RANGE" && n.ranges.length > 0)
      );

      return successResponse({
        totalDomains: nodes.filter((n) => n.nodeType === "DOMAIN").length,
        totalCriteria: nodes.filter((n) => ["GROUP", "CRITERION"].includes(n.nodeType)).length,
        totalSubCriteria: nodes.filter((n) => n.nodeType === "SUB_CRITERION").length,
        totalSubSubCriteria: nodes.filter((n) => n.nodeType === "SUB_SUB_CRITERION").length,
        totalScoringLeaves: leaves.length,
        totalOptions: nodes.reduce((s, n) => s + n.options.length, 0),
        totalRanges: nodes.reduce((s, n) => s + n.ranges.length, 0),
        completionRate: leaves.length > 0 ? Math.round((configuredLeaves.length / leaves.length) * 100) : 0,
      });
    } catch (error) {
      console.error("[SCORING/GRID-STATS] GET error:", error);
      return serverError("Erreur lors du calcul des statistiques");
    }
  });
}
