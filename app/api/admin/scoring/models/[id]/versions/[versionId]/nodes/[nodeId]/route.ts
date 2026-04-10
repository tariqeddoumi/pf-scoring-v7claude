import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { ScoringNodeService } from '@/lib/services/scoring-node-service';

async function handler(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string; versionId: string; nodeId: string } }
) {
  if (request.method === 'GET') {
    try {
      const node = await ScoringNodeService.getNodeById(params.nodeId);

      if (!node) {
        return NextResponse.json(
          { error: 'Node not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: node
      });
    } catch (error) {
      console.error('[Node GET]', error);
      return NextResponse.json(
        { error: 'Failed to fetch node' },
        { status: 500 }
      );
    }
  }

  if (request.method === 'PUT') {
    try {
      const body = await request.json();
      const {
        label,
        description,
        weight,
        answerType,
        scoringMethod,
        aggregationMethod,
        action,
        newOrderIndex,
        option,
        range,
        rule,
        applicabilityRule
      } = body;

      // Handle different actions
      if (action === 'addOption' && option) {
        const result = await ScoringNodeService.addNodeOption({
          nodeId: params.nodeId,
          label: option.label,
          value: option.value,
          score: option.score,
          createdBy: user.userId
        });
        return NextResponse.json({ success: true, data: result });
      }

      if (action === 'addRange' && range) {
        const result = await ScoringNodeService.addNodeRange({
          nodeId: params.nodeId,
          label: range.label,
          minValue: range.minValue,
          maxValue: range.maxValue,
          score: range.score,
          createdBy: user.userId
        });
        return NextResponse.json({ success: true, data: result });
      }

      if (action === 'addRule' && rule) {
        const result = await ScoringNodeService.addNodeRule({
          nodeId: params.nodeId,
          versionId: params.versionId,
          ruleType: rule.ruleType,
          code: rule.code,
          label: rule.label,
          description: rule.description,
          conditionExpression: rule.conditionExpression,
          severity: rule.severity,
          actionType: rule.actionType,
          createdBy: user.userId
        });
        return NextResponse.json({ success: true, data: result });
      }

      if (action === 'addApplicabilityRule' && applicabilityRule) {
        const result = await ScoringNodeService.addApplicabilityRule({
          nodeId: params.nodeId,
          effectType: applicabilityRule.effectType,
          conditionExpression: applicabilityRule.conditionExpression,
          createdBy: user.userId
        });
        return NextResponse.json({ success: true, data: result });
      }

      if (action === 'reorder' && newOrderIndex !== undefined) {
        const result = await ScoringNodeService.reorderNode(
          params.nodeId,
          newOrderIndex,
          user.userId
        );
        return NextResponse.json({ success: true, data: result });
      }

      // Standard update
      const node = await ScoringNodeService.updateNode(params.nodeId, {
        label,
        description,
        weight,
        answerType: answerType as any,
        scoringMethod,
        aggregationMethod,
        updatedBy: user.userId
      });

      return NextResponse.json({
        success: true,
        data: node
      });
    } catch (error: any) {
      console.error('[Node PUT]', error);
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update node' },
        { status: 500 }
      );
    }
  }

  if (request.method === 'DELETE') {
    try {
      await ScoringNodeService.deleteNode(params.nodeId, user.userId);

      return NextResponse.json({
        success: true,
        message: 'Node deleted successfully'
      });
    } catch (error: any) {
      console.error('[Node DELETE]', error);
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Node not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to delete node' },
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

export async function PUT(
  request: NextRequest,
  { params }: any
) {
  return withAuth(request, (req, user) =>
    handler(req, user, { params })
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  return withAuth(request, (req, user) =>
    handler(req, user, { params })
  );
}
