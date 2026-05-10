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

    return NextResponse.json({ data: evaluation }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * PUT /api/evaluations/[id] - Update evaluation or toggle archive status
 */
async function handlePUT(request: NextRequest, user: any, params: any) {
  try {
    if (!["system_admin","scoring_admin","risk_manager","risk_analyst"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Check if this is an archive/restore operation
    if (typeof body.isArchived === "boolean") {
      if (body.isArchived) {
        const evaluation = await EvaluationService.archiveEvaluation(
          params.id,
          user.userId
        );
        return NextResponse.json({ data: evaluation }, { status: 200 });
      } else {
        const evaluation = await EvaluationService.restoreEvaluation(params.id);
        return NextResponse.json({ data: evaluation }, { status: 200 });
      }
    }

    // Regular update
    const evaluation = await EvaluationService.updateEvaluation(
      params.id,
      body,
      user.userId
    );

    return NextResponse.json({ data: evaluation }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * DELETE /api/evaluations/[id] - Delete evaluation
 */
async function handleDELETE(request: NextRequest, user: any, params: any) {
  try {
    if (!["system_admin","scoring_admin","risk_manager","risk_analyst"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await EvaluationService.deleteEvaluation(params.id);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return withAuth(request, (req, user) => handleGET(req, user, resolvedParams));
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return withAuth(request, (req, user) => handlePUT(req, user, resolvedParams));
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return withAuth(request, (req, user) => handleDELETE(req, user, resolvedParams));
}
