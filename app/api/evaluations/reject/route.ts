import { NextRequest, NextResponse } from 'next/server';
import { withAuth, hasMinimumRole } from '@/lib/auth-middleware';
import { EvaluationService } from '@/lib/services/evaluation-service';

/**
 * POST /api/evaluations/reject - Reject evaluation (manager/admin)
 */
async function handlePOST(request: NextRequest, user: any) {
  try {
    if (!hasMinimumRole(user.role, 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...rejectData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Evaluation ID required' }, { status: 400 });
    }

    const evaluation = await EvaluationService.rejectEvaluation(id, rejectData, user.sub);

    return NextResponse.json(evaluation, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
