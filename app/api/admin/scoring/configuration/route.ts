/**
 * Configuration API Route
 *
 * Endpoints:
 * GET /api/admin/scoring/configuration?type=answerTypes
 * GET /api/admin/scoring/configuration?type=aggregationMethods
 * GET /api/admin/scoring/configuration?type=weightModes
 * GET /api/admin/scoring/configuration?type=scoreScales
 * GET /api/admin/scoring/configuration?type=ratingScales
 */

import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, errorResponse } from "@/lib/api-response";
import {
  getAnswerTypes,
  getAggregationMethods,
  getWeightModes,
  getScoreScales,
  getRatingScales,
} from "@/lib/services/scoring-configuration-service";

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get("type");

      if (!type) {
        return errorResponse("Paramètre 'type' manquant", { status: 400, errorCode: "MISSING_PARAMETER" });
      }

      let data;

      switch (type) {
        case "answerTypes":
          data = await getAnswerTypes();
          break;
        case "aggregationMethods":
          data = await getAggregationMethods();
          break;
        case "weightModes":
          data = await getWeightModes();
          break;
        case "scoreScales":
          data = await getScoreScales();
          break;
        case "ratingScales":
          data = await getRatingScales();
          break;
        default:
          return errorResponse(`Type de configuration inconnu: ${type}`, { status: 400, errorCode: "INVALID_TYPE" });
      }

      return successResponse(data);
    } catch (error: any) {
      console.error("[ADMIN/SCORING/CONFIGURATION] GET error:", error);
      return serverError("Erreur lors de la récupération de la configuration");
    }
  });
}
