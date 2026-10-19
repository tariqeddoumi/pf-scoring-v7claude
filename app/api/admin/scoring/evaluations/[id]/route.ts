import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth, type AuthPayload } from "@/lib/auth-middleware";
import { ScoringEvaluationService } from "@/lib/services/scoring-evaluation-service";
import { messagePublic } from "@/lib/erreur-publique";
import { messageErreur } from "@/lib/erreur-inconnue";

async function handler(
  request: NextRequest,
  user: AuthPayload,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (request.method === "GET") {
    try {
      const evaluation =
        await ScoringEvaluationService.getEvaluationWithResults(id);

      if (!evaluation) {
        return NextResponse.json(
          { error: "Evaluation not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: evaluation,
      });
    } catch (error) {
      console.error("[Evaluation GET]", error);
      return NextResponse.json(
        { error: "Failed to fetch evaluation" },
        { status: 500 }
      );
    }
  }

  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { action, reason } = body;

      if (action === "submit") {
        const evaluation = await ScoringEvaluationService.submitEvaluation(
          id,
          user.userId
        );

        return NextResponse.json({
          success: true,
          data: evaluation,
        });
      }

      if (action === "approve") {
        const evaluation = await ScoringEvaluationService.approveEvaluation(
          id,
          user.userId
        );

        return NextResponse.json({
          success: true,
          data: evaluation,
        });
      }

      if (action === "reject" && reason) {
        const evaluation = await ScoringEvaluationService.rejectEvaluation(
          id,
          reason,
          user.userId
        );

        return NextResponse.json({
          success: true,
          data: evaluation,
        });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: unknown) {
      console.error("[Evaluation POST]", error);
      if (messageErreur(error)?.includes("not found")) {
        return NextResponse.json(
          { error: messagePublic(error, "Requête refusée") },
          { status: 404 }
        );
      }
      if (
        messageErreur(error)?.includes("Can only") ||
        messageErreur(error)?.includes("Only")
      ) {
        return NextResponse.json(
          { error: messagePublic(error, "Requête refusée") },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Failed to process evaluation action" },
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
  return withAdminAuth(request, (req, user) => handler(req, user, { params }));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, (req, user) => handler(req, user, { params }));
}
