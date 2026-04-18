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

import { NextRequest, NextResponse } from "next/server";
import {
  getAnswerTypes,
  getAggregationMethods,
  getWeightModes,
  getScoreScales,
  getRatingScales,
} from "@/lib/services/scoring-configuration-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json({
        success: false,
        error: "Missing 'type' parameter",
        errorCode: "MISSING_PARAMETER",
      }, { status: 400 });
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
        return NextResponse.json({
          success: false,
          error: `Unknown configuration type: ${type}`,
          errorCode: "INVALID_TYPE",
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Configuration API error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch configuration",
      errorCode: "INTERNAL_ERROR",
    }, { status: 500 });
  }
}
