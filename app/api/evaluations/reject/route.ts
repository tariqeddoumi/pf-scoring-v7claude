import { NextRequest, NextResponse } from "next/server";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { EvaluationService } from "@/lib/services/evaluation-service";

/**
 * POST /api/evaluations/reject - Reject evaluation (manager/admin)
 */
async function handlePOST(request: NextRequest, user: any) {
  try {
    if (!["system_admin","scoring_admin","risk_manager"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...rejectData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Evaluation ID required" },
        { status: 400 }
      );
    }

    const evaluation = await EvaluationService.rejectEvaluation(
      id,
      rejectData,
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
