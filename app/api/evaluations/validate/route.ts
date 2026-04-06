import { NextRequest, NextResponse } from 'next/server';
import { webhookService } from '@/lib/webhook-service';

export async function POST(req: NextRequest) {
  try {
    const { evaluationId, analyst_email } = await req.json();

    await webhookService.emit('evaluation.validated', {
      evaluationId,
      analyst_email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Evaluation validated',
      evaluationId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate evaluation' },
      { status: 500 }
    );
  }
}
