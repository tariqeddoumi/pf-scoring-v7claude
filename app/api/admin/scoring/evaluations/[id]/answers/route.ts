import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";
import { ScoringEvaluationService } from "@/lib/services/scoring-evaluation-service";
import { messagePublic } from "@/lib/erreur-publique";
import { messageErreur } from "@/lib/erreur-inconnue";

/**
 * Handler for GET/POST /api/admin/scoring/evaluations/[id]/answers
 * Gets or creates answers for a specific evaluation
 */
async function handleRequest(
  request: NextRequest,
  user: AuthPayload,
  params: { id: string }
) {
  if (request.method === "GET") {
    try {
      const answers = await ScoringEvaluationService.getEvaluationAnswers(
        params.id
      );

      return NextResponse.json({
        success: true,
        data: answers,
      });
    } catch (error) {
      console.error("[Answers GET]", error);
      return NextResponse.json(
        { error: "Failed to fetch answers" },
        { status: 500 }
      );
    }
  }

  if (request.method === "POST") {
    // Même règle que la saisie principale : un compte en lecture seule ou un auditeur
    // ne renseigne pas les réponses d'une évaluation.
    if (!hasPermission(user.role as UserRole, "evaluation", "update")) {
      return NextResponse.json(
        { error: "Vos droits ne permettent pas de saisir les réponses" },
        { status: 403 }
      );
    }
    try {
      const body = await request.json();
      const {
        nodeId,
        valueString,
        valueNumber,
        valueBoolean,
        valueDate,
        comment,
      } = body;
      if ("manualScore" in body) {
        return NextResponse.json(
          {
            error:
              "Une note manuelle passe par une dérogation approuvée, pas par la saisie.",
          },
          { status: 400 }
        );
      }

      if (!nodeId) {
        return NextResponse.json(
          {
            error: "Missing required fields",
            errors: { nodeId: "Node ID is required" },
          },
          { status: 400 }
        );
      }

      const answer = await ScoringEvaluationService.recordAnswer({
        evaluationId: params.id,
        nodeId,
        valueString,
        valueNumber,
        valueBoolean,
        valueDate: valueDate ? new Date(valueDate) : undefined,
        // manualScore n'est plus accepté : une note manuelle passe par une dérogation
        comment,
        recordedBy: user.userId,
      });

      return NextResponse.json(
        {
          success: true,
          data: answer,
        },
        { status: 201 }
      );
    } catch (error: unknown) {
      console.error("[Answers POST]", error);
      if (messageErreur(error)?.includes("not found")) {
        return NextResponse.json(
          { error: messagePublic(error, "Requête refusée") },
          { status: 404 }
        );
      }
      if (messageErreur(error)?.includes("Can only")) {
        return NextResponse.json(
          { error: messagePublic(error, "Requête refusée") },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Failed to record answer" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, (req, user) => handleRequest(req, user, { id }));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, (req, user) => handleRequest(req, user, { id }));
}
