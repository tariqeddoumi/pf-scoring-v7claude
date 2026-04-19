import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import {
  getAllScoringCriteria,
  createScoringCriterion,
} from '@/lib/services/scoring-criteria-service';

async function handler(request: NextRequest, user: any) {
  // GET - List scoring criteria
  if (request.method === 'GET') {
    try {
      const { searchParams } = new URL(request.url);
      const category = searchParams.get('category');

      const criteria = await getAllScoringCriteria(category || undefined);

      return NextResponse.json({
        success: true,
        data: criteria,
      });
    } catch (error: any) {
      console.error('[Scoring Criteria GET]', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch scoring criteria' },
        { status: 500 }
      );
    }
  }

  // POST - Create new criterion
  if (request.method === 'POST') {
    try {
      const body = await request.json();

      // Validate required fields
      if (!body.code || !body.label || !body.category) {
        return NextResponse.json(
          {
            error: 'Missing required fields: code, label, category',
            errors: [
              { field: 'code', message: 'Code is required' },
              { field: 'label', message: 'Label is required' },
              { field: 'category', message: 'Category is required' },
            ],
          },
          { status: 400 }
        );
      }

      const criterion = await createScoringCriterion({
        ...body,
        createdBy: user.userId,
      });

      return NextResponse.json(
        {
          success: true,
          data: criterion,
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('[Scoring Criteria POST]', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create scoring criterion' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function GET(request: NextRequest) {
  return withAdminAuth(request, (req, user) => handler(req, user));
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, (req, user) => handler(req, user));
}
