import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { ScoringQuestionnaireService } from "@/lib/services/scoring-questionnaire-service";

/**
 * GET /api/scoring/questionnaire - Get questionnaire nodes for default model
 */
async function handleGET(request: NextRequest, user: any) {
  try {
    // Get default scoring model version
    const modelVersion = await ScoringQuestionnaireService.getDefaultScoringModel();

    if (!modelVersion) {
      return NextResponse.json(
        { error: "No published scoring model found" },
        { status: 404 }
      );
    }

    // Get questionnaire nodes
    const questionnaire = await ScoringQuestionnaireService.getQuestionnaire(
      modelVersion.id
    );

    return NextResponse.json(
      {
        data: questionnaire,
        modelVersionId: modelVersion.id,
        modelVersion: {
          id: modelVersion.id,
          versionNumber: modelVersion.versionNumber,
          label: modelVersion.label,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching questionnaire:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handleGET(req, user));
}
