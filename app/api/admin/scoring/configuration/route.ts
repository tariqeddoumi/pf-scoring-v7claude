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
  updateRatingScales,
  type RatingScaleInput,
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

/**
 * PUT /api/admin/scoring/configuration?type=ratingScales
 *
 * Remplace le barème de notation. Seul ce type est modifiable : les autres
 * référentiels (types de réponse, méthodes d'agrégation) décrivent ce que le moteur
 * sait faire, et les ouvrir à l'écriture permettrait d'y inscrire des valeurs qu'aucun
 * code n'implémente.
 */
export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get("type");

      if (type !== "ratingScales") {
        return errorResponse(
          `Ce référentiel n'est pas modifiable : ${type ?? "(type manquant)"}`,
          { status: 400, errorCode: "READ_ONLY_CONFIGURATION" }
        );
      }

      const body = await req.json().catch(() => null);
      const scales = body?.scales;
      if (!Array.isArray(scales)) {
        return errorResponse("Corps attendu : { scales: [...] }", {
          status: 400,
          errorCode: "INVALID_PAYLOAD",
        });
      }

      const normalisees: RatingScaleInput[] = scales.map((s: any, i: number) => ({
        id: String(s.id ?? "").trim(),
        label: String(s.label ?? "").trim(),
        description: s.description ?? null,
        minScore: Number(s.minScore),
        maxScore: Number(s.maxScore),
        color: s.color ?? null,
        displayOrder: Number.isFinite(Number(s.displayOrder))
          ? Number(s.displayOrder)
          : i + 1,
      }));

      const validation = await updateRatingScales(normalisees);
      if (validation.errors.length > 0) {
        return errorResponse("Barème invalide", {
          status: 400,
          errorCode: "INVALID_RATING_SCALE",
          errors: validation.errors.map((message) => ({ field: "scales", message })),
        });
      }

      return successResponse({
        scales: await getRatingScales(),
        warnings: validation.warnings,
      });
    } catch (error: any) {
      console.error("[ADMIN/SCORING/CONFIGURATION] PUT error:", error);
      return serverError("Erreur lors de l'enregistrement du barème");
    }
  });
}
