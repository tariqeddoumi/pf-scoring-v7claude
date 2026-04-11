import { NextRequest, NextResponse } from "next/server";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { EvaluationService } from "@/lib/services/evaluation-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/evaluations/[id]
 */
async function handleGET(request: NextRequest, user: any, params: any) {
  try {
    const evaluation = await EvaluationService.getEvaluationById(
      params.id,
      user.userId
    );

    if (!evaluation) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(evaluation, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return withAuth(request, (req, user) => handleGET(req, user, resolvedParams));
}
