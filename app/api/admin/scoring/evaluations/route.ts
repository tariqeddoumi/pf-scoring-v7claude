import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { ScoringEvaluationService } from '@/lib/services/scoring-evaluation-service';

async function handler(request: NextRequest, user: any) {
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { projectId, modelId, modelVersionId } = body;

      if (!projectId || !modelId || !modelVersionId) {
        return NextResponse.json(
          {
            error: 'Missing required fields',
            errors: {
              projectId: !projectId ? 'Project ID is required' : null,
              modelId: !modelId ? 'Model ID is required' : null,
              modelVersionId: !modelVersionId ? 'Model version ID is required' : null
            }
          },
          { status: 400 }
        );
      }

      const evaluation = await ScoringEvaluationService.createEvaluation({
        projectId,
        modelId,
        modelVersionId,
        evaluatedBy: user.userId
      });

      return NextResponse.json(
        {
          success: true,
          data: evaluation
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('[Evaluations POST]', error);
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create evaluation' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  return withAuth(request, handler);
}
