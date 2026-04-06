import { NextRequest, NextResponse } from 'next/server';
import { webhookService } from '@/lib/webhook-service';

export async function POST(req: NextRequest) {
  try {
    const { evaluationId, projectId, analyst_name, analyst_email } = await req.json();

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'evaluationId required' },
        { status: 400 }
      );
    }

    // Emit webhook event
    await webhookService.emit('evaluation.submitted', {
      evaluationId,
      projectId,
      analyst_name,
      analyst_email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Evaluation submitted',
      evaluationId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit evaluation' },
      { status: 500 }
    );
  }
}
