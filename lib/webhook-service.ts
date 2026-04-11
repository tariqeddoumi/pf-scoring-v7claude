import { emailService } from "./email-service";

export type WebhookEvent =
  | "evaluation.created"
  | "evaluation.submitted"
  | "evaluation.validated"
  | "evaluation.rejected"
  | "alert.created"
  | "project.created"
  | "comment.created";

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
}

export class WebhookService {
  private handlers: Map<WebhookEvent, Function[]> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers() {
    // Evaluation workflows
    this.on("evaluation.submitted", async (data: any) => {
      console.log("📤 Evaluation submitted:", data.evaluationId);
      if (data.analyst_email) {
        await emailService.sendEvaluationSubmitted(
          data.analyst_email,
          data.analyst_name,
          data.evaluationId
        );
      }
    });

    this.on("evaluation.validated", async (data: any) => {
      console.log("✅ Evaluation validated:", data.evaluationId);
      if (data.analyst_email) {
        await emailService.sendEvaluationValidated(
          data.analyst_email,
          data.evaluationId
        );
      }
    });

    this.on("evaluation.rejected", async (data: any) => {
      console.log("❌ Evaluation rejected:", data.evaluationId);
      if (data.analyst_email) {
        await emailService.sendEvaluationRejected(
          data.analyst_email,
          data.evaluationId,
          data.reason || "N/A"
        );
      }
    });

    // Alerts
    this.on("alert.created", async (data: any) => {
      if (data.severity === "critical") {
        console.log("🚨 Critical alert:", data.type);
        // Send to manager email
        if (data.manager_email) {
          await emailService.sendAlertCritical(
            data.manager_email,
            data.type,
            data.project_name
          );
        }
      }
    });
  }

  on(event: WebhookEvent, handler: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  async emit(event: WebhookEvent, data: any) {
    const handlers = this.handlers.get(event) || [];
    console.log(`🔔 Event: ${event} (${handlers.length} handlers)`);

    const results = await Promise.allSettled(
      handlers.map((handler) => handler(data))
    );

    return results;
  }

  async handleWebhookPayload(payload: WebhookPayload) {
    return this.emit(payload.event, payload.data);
  }
}

export const webhookService = new WebhookService();
