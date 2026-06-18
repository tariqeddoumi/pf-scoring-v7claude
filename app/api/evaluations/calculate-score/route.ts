import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { EvaluationService } from "@/lib/services/evaluation-service";
import { ScoringQuestionnaireService } from "@/lib/services/scoring-questionnaire-service";
import { ScoringEngine } from "@/lib/services/scoring-engine";
import { V8ScoringEngine } from "@/lib/scoring-engine-v8";
import { isSectorialEnabled } from "@/lib/services/scoring-config-service";
import { getSectorByCode } from "@/lib/services/v9-sectors-service";
import prisma from "@/lib/prisma";
import { scoreToRating } from "@/lib/utils/rating-converter";

/**
 * POST /api/evaluations/calculate-score
 * Calculate score from answers with optional Phase 3 sectoral integration.
 *
 * If SCORING_SECTORIAL_ENABLED is true, automatically applies V8 adjustments
 * based on project sector (from Project.secteur field).
 */
async function handlePOST(request: NextRequest, user: any) {
  try {
    const { evaluationId, modelVersionId, answers, sectorCode } = await request.json();

    if (!evaluationId || !answers) {
      return NextResponse.json(
        { error: "Missing evaluationId or answers" },
        { status: 400 }
      );
    }

    // Save answers
    await ScoringQuestionnaireService.saveAnswers(evaluationId, answers);

    // Run scoring engine (Phase 2-compatible: respects domain granularity)
    const scoreResults = await ScoringEngine.scoreEvaluation(
      evaluationId,
      modelVersionId
    );

    // Get final scores
    let { globalScore, scores } = await ScoringEngine.getFinalScores(
      evaluationId,
      scoreResults
    );

    // Determine rating based on score
    let rating = scoreToRating(globalScore);
    let v8Adjustment = null;
    let sectorialDetail = null;
    let appliedSectorialConfig = false;

    // Phase 3: Check if sectorial re-integration is enabled
    const sectorialEnabled = await isSectorialEnabled();

    if (sectorialEnabled) {
      try {
        // Fetch evaluation and project to get sector
        const evaluation = await prisma.evaluation.findUnique({
          where: { id: evaluationId },
          include: { project: true },
        });

        const projectSector = evaluation?.project?.secteur;

        if (projectSector) {
          // Look up sector data (tries V9 first, fallback to V8)
          let sectorData;
          let sectorLabel = projectSector;

          try {
            const v9Sector = await getSectorByCode(projectSector);
            if (v9Sector) {
              // Build V8-compatible sector data from V9
              sectorLabel = v9Sector.label || projectSector;
              sectorData = {
                id: v9Sector.id,
                code: v9Sector.code,
                label: v9Sector.label,
                domainWeights: v9Sector.domainWeights || [],
                stressTests: v9Sector.stressTests || [],
                redFlags: v9Sector.redFlags || [],
                domainImpacts: [],
              };
            }
          } catch (v9Error) {
            console.warn(`V9 sector lookup failed for ${projectSector}, trying V8:`, v9Error);
          }

          // Fallback to V8 sector table if V9 not found
          if (!sectorData) {
            try {
              const v8Sector = await prisma.v8Sector.findFirst({
                where: { code: projectSector },
                include: {
                  domainWeights: true,
                  stressTests: true,
                  redFlags: true,
                  domainImpacts: true,
                },
              });
              if (v8Sector) {
                sectorLabel = v8Sector.label || projectSector;
                sectorData = v8Sector as any;
              }
            } catch (v8Error) {
              console.warn(`V8 sector lookup failed for ${projectSector}:`, v8Error);
            }
          }

          // Apply V8 adjustments if sector found
          if (sectorData) {
            try {
              const baseScore = globalScore;
              const adjustedResult = V8ScoringEngine.applyV8Adjustments(
                {
                  evaluationId,
                  projectId: evaluation?.projectId || "",
                  projectName: (evaluation?.project?.nom || evaluation?.project?.description) as string,
                  domains: Object.fromEntries(scores),
                  globalScore,
                  normalizedScore: globalScore,
                  rating: rating as unknown as import("@/types/scoring-v7plus").RatingScale,
                  probabilityOfDefault: 0.05,
                  triggeredNOGOs: [],
                  appliedMALUS: [],
                  malusTotal: 0,
                  finalScore: globalScore,
                  recommendation: "APPROVE",
                  calculatedAt: new Date(),
                  version: "7.0",
                },
                sectorData as any,
                evaluation?.project || {}
              );

              // Apply adjusted score
              globalScore = adjustedResult.normalizedScore || adjustedResult.finalScore || baseScore;
              rating = adjustedResult.rating;
              v8Adjustment = adjustedResult.v8Adjustment;
              appliedSectorialConfig = true;

              // Build sectorial detail for response
              sectorialDetail = {
                sectorCode: projectSector,
                sectorName: sectorLabel,
                appliedAt: new Date().toISOString(),
                baseScore: baseScore,
                adjustmentAmount: globalScore - baseScore,
                details: {
                  domainWeightAdjustments: v8Adjustment?.adjustmentDetail?.domainWeightAdjustments || {},
                  redFlagsTriggered: v8Adjustment?.triggeredRedFlags || [],
                  stressTestResults: v8Adjustment?.stressTestResults || [],
                },
              };
            } catch (v8Error) {
              console.warn("V8 adjustment failed, continuing with base score:", v8Error);
            }
          } else {
            console.warn(`Sectoral re-integration enabled but sector ${projectSector} not found in V9 or V8`);
          }
        } else {
          console.info("Sectoral re-integration enabled but project has no sector configured");
        }
      } catch (error) {
        console.error("Error in sectorial re-integration:", error);
        // Graceful degradation: continue with base score
      }
    }

    // Update evaluation with calculated scores (including sectorial if applied)
    await EvaluationService.updateEvaluation(
      evaluationId,
      {
        finalScore: globalScore,
        rating,
      },
      user.userId
    );

    return NextResponse.json(
      {
        data: {
          finalScore: globalScore,
          rating,
          scores: Object.fromEntries(scores),
          v8Adjustment: appliedSectorialConfig ? v8Adjustment : null,
          sectorialApplied: appliedSectorialConfig,
          sectorialDetail,
          // Backward compatibility
          sectorCode: sectorialDetail?.sectorCode || sectorCode || undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error calculating score:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
