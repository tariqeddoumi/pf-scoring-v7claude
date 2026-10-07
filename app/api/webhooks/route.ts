import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { webhookService } from "@/lib/webhook-service";
import { marquerVu, verifierSignatureWebhook } from "@/lib/webhook-signature";

const EVENEMENTS = [
  "evaluation.created",
  "evaluation.submitted",
  "evaluation.validated",
  "evaluation.rejected",
  "alert.created",
  "project.created",
  "comment.created",
] as const;

const payloadSchema = z.object({
  event: z.enum(EVENEMENTS),
  timestamp: z.string().optional(),
  data: z.record(z.string(), z.unknown()),
});

/**
 * POST /api/webhooks — signature HMAC vérifiée sur le corps brut AVANT tout effet
 * (voir lib/webhook-signature.ts), puis schéma de la charge utile validé.
 */
export async function POST(req: NextRequest) {
  const corps = await req.text();
  const verif = verifierSignatureWebhook({
    secret: process.env.WEBHOOK_SECRET,
    signature: req.headers.get("x-webhook-signature"),
    timestamp: req.headers.get("x-webhook-timestamp"),
    id: req.headers.get("x-webhook-id"),
    corps,
    dejaVu: marquerVu,
  });
  if (!verif.ok) {
    if (verif.motif === "non_configure") {
      return NextResponse.json({ error: "Webhooks non configurés (WEBHOOK_SECRET)" }, { status: 503 });
    }
    return NextResponse.json({ error: "Signature invalide", motif: verif.motif }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(corps);
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Charge utile invalide" }, { status: 400 });
  }

  try {
    const results = await webhookService.handleWebhookPayload({
      event: parsed.data.event,
      timestamp: parsed.data.timestamp ?? new Date().toISOString(),
      data: parsed.data.data,
    });
    return NextResponse.json({ success: true, event: parsed.data.event, processed: results.length });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
