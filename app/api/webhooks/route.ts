import { NextRequest, NextResponse } from 'next/server';
import { webhookService } from '@/lib/webhook-service';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Verify webhook signature (in production)
    const signature = req.headers.get('x-supabase-signature');
    if (!signature && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Handle webhook
    const results = await webhookService.handleWebhookPayload(payload);

    return NextResponse.json({
      success: true,
      event: payload.event,
      processed: results.length,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

// Health check
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint ready',
    timestamp: new Date().toISOString(),
  });
}
