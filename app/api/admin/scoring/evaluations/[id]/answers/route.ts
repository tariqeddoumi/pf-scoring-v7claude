import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { ScoringEvaluationService } from '@/lib/services/scoring-evaluation-service';

async function handler(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  if (request.method === 'GET') {
    try {
      const answers = await ScoringEvaluationService.getEvaluationAnswers(params.id);

      return NextResponse.json({
        success: true,
        data: answers
      });
    } catch (error) {
      console.error('[Answers GET]', error);
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      );
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const {
        nodeId,
        valueString,
        valueNumber,
        valueBoolean,
        valueDate,
        manualScore,
        comment
      } = body;

      if (!nodeId) {
        return NextResponse.json(
          {
            error: 'Missing required fields',
            errors: { nodeId: 'Node ID is required' }
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
        manualScore,
        comment,
        recordedBy: user.userId
      });

      return NextResponse.json(
        {
          success: true,
          data: answer
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('[Answers POST]', error);
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('Can only')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to record answer' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, (req, user) =>
    handler(req, user, { params })
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, (req, user) =>
    handler(req, user, { params })
  );
}
