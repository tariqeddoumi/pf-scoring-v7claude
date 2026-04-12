import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import {
  getScoringCriterion,
  updateScoringCriterion,
  deleteScoringCriterion,
  createScoringThreshold,
  updateScoringThreshold,
  deleteScoringThreshold,
  createScoringOption,
  updateScoringOption,
  deleteScoringOption,
} from '@/lib/services/scoring-criteria-service';

async function handler(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // GET - Fetch specific criterion with thresholds and options
  if (request.method === 'GET') {
    try {
      const criterion = await getScoringCriterion(id);

      if (!criterion) {
        return NextResponse.json(
          { error: 'Criterion not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: criterion,
      });
    } catch (error: any) {
      console.error('[Scoring Criterion GET]', error);
      return NextResponse.json(
        { error: 'Failed to fetch criterion' },
        { status: 500 }
      );
    }
  }

  // PUT - Update criterion
  if (request.method === 'PUT') {
    try {
      const body = await request.json();

      const criterion = await updateScoringCriterion(id, {
        ...body,
        updatedBy: user.userId,
      });

      return NextResponse.json({
        success: true,
        data: criterion,
      });
    } catch (error: any) {
      console.error('[Scoring Criterion PUT]', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update criterion' },
        { status: 500 }
      );
    }
  }

  // DELETE - Delete criterion
  if (request.method === 'DELETE') {
    try {
      await deleteScoringCriterion(id);

      return NextResponse.json({
        success: true,
        message: 'Criterion deleted successfully',
      });
    } catch (error: any) {
      console.error('[Scoring Criterion DELETE]', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete criterion' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, (req, user) =>
    handler(req, user, { params: { id } })
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, (req, user) =>
    handler(req, user, { params: { id } })
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, (req, user) =>
    handler(req, user, { params: { id } })
  );
}
