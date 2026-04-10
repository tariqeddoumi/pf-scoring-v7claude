import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { ScoringVersionService } from '@/lib/services/scoring-version-service';

async function handler(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  if (request.method === 'GET') {
    try {
      const versions = await ScoringVersionService.getVersionsByModel(params.id);

      return NextResponse.json({
        success: true,
        data: versions
      });
    } catch (error) {
      console.error('[Versions GET]', error);
      return NextResponse.json(
        { error: 'Failed to fetch versions' },
        { status: 500 }
      );
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { versionNumber, label, changeReason } = body;

      if (!versionNumber) {
        return NextResponse.json(
          {
            error: 'Missing required fields',
            errors: { versionNumber: 'Version number is required' }
          },
          { status: 400 }
        );
      }

      const version = await ScoringVersionService.createVersion({
        modelId: params.id,
        versionNumber: parseInt(versionNumber),
        label,
        changeReason,
        createdBy: user.userId
      });

      return NextResponse.json(
        {
          success: true,
          data: version
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('[Versions POST]', error);
      return NextResponse.json(
        { error: 'Failed to create version' },
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
