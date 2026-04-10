import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { ScoringNodeService } from '@/lib/services/scoring-node-service';

async function handler(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string; versionId: string } }
) {
  if (request.method === 'GET') {
    try {
      const nodes = await ScoringNodeService.getNodesByVersion(params.versionId);

      return NextResponse.json({
        success: true,
        data: nodes
      });
    } catch (error) {
      console.error('[Nodes GET]', error);
      return NextResponse.json(
        { error: 'Failed to fetch nodes' },
        { status: 500 }
      );
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const {
        nodeType,
        code,
        label,
        description,
        parentNodeId,
        weight,
        answerType,
        scoringMethod,
        aggregationMethod
      } = body;

      if (!nodeType || !code || !label) {
        return NextResponse.json(
          {
            error: 'Missing required fields',
            errors: {
              nodeType: !nodeType ? 'Node type is required' : null,
              code: !code ? 'Code is required' : null,
              label: !label ? 'Label is required' : null
            }
          },
          { status: 400 }
        );
      }

      const node = await ScoringNodeService.createNode({
        versionId: params.versionId,
        nodeType: nodeType as any,
        code,
        label,
        description,
        parentNodeId,
        weight,
        answerType: answerType as any,
        scoringMethod,
        aggregationMethod,
        createdBy: user.userId
      });

      return NextResponse.json(
        {
          success: true,
          data: node
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('[Nodes POST]', error);
      return NextResponse.json(
        { error: 'Failed to create node' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function GET(
  request: NextRequest,
  { params }: any
) {
  return withAuth(request, (req, user) =>
    handler(req, user, { params })
  );
}

export async function POST(
  request: NextRequest,
  { params }: any
) {
  return withAuth(request, (req, user) =>
    handler(req, user, { params })
  );
}
