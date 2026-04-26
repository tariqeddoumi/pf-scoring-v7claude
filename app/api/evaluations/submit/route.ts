import { NextRequest, NextResponse } from "next/server";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { EvaluationService } from "@/lib/services/evaluation-service";

/**
 * POST /api/evaluations/submit - Submit evaluation for validation
 */
async function handlePOST(request: NextRequest, user: any) {
  try {
    if (!["admin","manager","analyst","risk_analyst"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...submitData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Evaluation ID required" },
        { status: 400 }
      );
    }

    const evaluation = await EvaluationService.submitEvaluation(
      id,
      submitData,
      user.userId
    );

    return NextResponse.json(evaluation, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
