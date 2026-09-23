import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { ScoringEngineV8 } from "@/lib/services/scoring";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";

/**
 * POST /api/scoring/evaluations/[id]/calculate
 *
 * Exécute le moteur de scoring et retourne le résultat.
 *
 * Avec ?apercu=1, le calcul est un APERÇU : il n'est pas persisté et ne modifie
 * pas l'évaluation. C'est ce mode qui alimente le score affiché pendant la saisie,
 * afin que le chiffre montré à l'analyste soit toujours celui du moteur — poids,
 * malus, règles et calibrage sectoriel compris — et jamais une approximation
 * recalculée dans le navigateur.
 */
async function handlePOST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  user: AuthPayload
) {
  try {
    const { id } = await params;
    const evaluationId = id;
    const apercu = req.nextUrl.searchParams.get("apercu") === "1";

    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
      select: { id: true, status: true },
    });

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: "Évaluation introuvable", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Un aperçu ne modifie rien : il reste consultable sur un dossier figé.
    if (!apercu && (evaluation.status === "soumis" || evaluation.status === "valide")) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de recalculer une évaluation soumise ou validée",
          errorCode: "INVALID_STATE",
        },
        { status: 400 }
      );
    }

    const trace = await ScoringEngineV8.scoreEvaluation(evaluationId);

    if (!apercu) {
      await ScoringEngineV8.persistTrace(trace);
    }

    return NextResponse.json({
      success: true,
      data: {
        evaluationId,
        apercu,
        finalScore: trace.finalScore,
        rating: trace.rating,
        recommendation: trace.recommendation,
        malusTotal: trace.malusTotal,
        blocked: trace.blocked,
        blockingRuleCodes: trace.blockingRuleCodes,
        ruleDiagnosticCount: trace.ruleDiagnostics.length,
        triggeredRuleCount: trace.triggeredRuleIds.length,
        domains: trace.rootResults.map((r) => ({
          nodeId: r.nodeId,
          code: r.code,
          label: r.label,
          score: r.rawScore,
          weight: r.weight,
        })),
        sectorial: trace.sectorial ?? null,
        traceUrl: `/api/scoring/evaluations/${evaluationId}/trace`,
      },
    });
  } catch (error) {
    console.error("POST /api/scoring/evaluations/[id]/calculate error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return withAuth(req, (r, user) => handlePOST(r, ctx, user));
}
