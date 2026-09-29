import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { ScoringQuestionnaireService } from "@/lib/services/scoring-questionnaire-service";
import { hasMinimumRole } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/scoring/questionnaire - Get questionnaire nodes for default model
 */
async function handleGET(request: NextRequest, user: any) {
  try {
    // Une version explicite sert à l'éditeur de modèle, qui travaille sur un
    // brouillon et non sur la version publiée. Elle reste réservée aux
    // administrateurs du modèle : eux seuls ont à voir une version non publiée.
    const { searchParams } = new URL(request.url);
    const versionDemandee = searchParams.get("versionId");

    let modelVersion = null;
    if (versionDemandee) {
      if (!hasMinimumRole(user.role, "scoring_admin")) {
        return NextResponse.json(
          { error: "Accès interdit à une version non publiée" },
          { status: 403 }
        );
      }
      modelVersion = await prisma.scoringModelVersion.findUnique({
        where: { id: versionDemandee },
        select: { id: true, versionNumber: true, label: true, status: true, isPublished: true },
      });
    } else {
      modelVersion = await ScoringQuestionnaireService.getDefaultScoringModel();
    }

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
          status: (modelVersion as { status?: string }).status ?? "PUBLISHED",
          isPublished: (modelVersion as { isPublished?: boolean }).isPublished ?? true,
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
