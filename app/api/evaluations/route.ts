import { NextRequest, NextResponse } from "next/server";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { EvaluationService } from "@/lib/services/evaluation-service";
import { paginationSchema } from "@/lib/validation-schemas";

/**
 * GET /api/evaluations - List all evaluations (paginated)
 */
async function handleGET(request: NextRequest, user: any) {
  try {
    if (!hasMinimumRole(user.role, "analyst")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");

    const validated = paginationSchema.parse({ page, limit });

    const filters = {
      ...(status && { status }),
      ...(projectId && { projectId }),
    };

    const result = await EvaluationService.getAllEvaluations(
      validated.page,
      validated.limit,
      filters
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * POST /api/evaluations - Create new evaluation (analyst+)
 */
async function handlePOST(request: NextRequest, user: any) {
  try {
    if (!hasMinimumRole(user.role, "analyst")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const evaluation = await EvaluationService.createEvaluation(
      body,
      user.userId
    );

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handleGET(req, user));
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
