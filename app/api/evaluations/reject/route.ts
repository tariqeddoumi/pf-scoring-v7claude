import { NextRequest, NextResponse } from 'next/server';
import { webhookService } from '@/lib/webhook-service';

export async function POST(req: NextRequest) {
  try {
    const { evaluationId, reason, analyst_email } = await req.json();

    await webhookService.emit('evaluation.rejected', {
      evaluationId,
      reason,
      analyst_email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Evaluation rejected',
      evaluationId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reject evaluation' },
      { status: 500 }
    );
  }
}
