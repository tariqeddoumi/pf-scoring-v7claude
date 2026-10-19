import { emailService } from "./email-service";

export type WebhookEvent =
  | "evaluation.created"
  | "evaluation.submitted"
  | "evaluation.validated"
  | "evaluation.rejected"
  | "alert.created"
  | "project.created"
  | "comment.created";

/** Données d'un événement : objet libre, propre à chaque événement. */
type DonneesWebhook = Record<string, unknown>;

/** Champs lus par les abonnés par défaut (charge utile externe, non contrôlée champ à champ). */
interface DonneesConnues {
  evaluationId: string;
  analyst_email?: string;
  analyst_name: string;
  reason?: string;
  severity?: string;
  type: string;
  manager_email?: string | null;
  project_name: string;
}

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: DonneesWebhook;
}

/**
 * Un abonné à un événement : il reçoit les données de l'événement (et non
 * l'enveloppe complète) et peut être asynchrone.
 */
type GestionnaireWebhook = (data: DonneesWebhook) => void | Promise<void>;

export class WebhookService {
  private handlers: Map<WebhookEvent, GestionnaireWebhook[]> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers() {
    // Evaluation workflows
    this.on("evaluation.submitted", async (donnees) => {
      const data = donnees as unknown as DonneesConnues;
      console.log("📤 Evaluation submitted:", data.evaluationId);
      if (data.analyst_email) {
        await emailService.sendEvaluationSubmitted(
          data.analyst_email,
          data.analyst_name,
          data.evaluationId
        );
      }
    });

    this.on("evaluation.validated", async (donnees) => {
      const data = donnees as unknown as DonneesConnues;
      console.log("✅ Evaluation validated:", data.evaluationId);
      if (data.analyst_email) {
        await emailService.sendEvaluationValidated(
          data.analyst_email,
          data.evaluationId
        );
      }
    });

    this.on("evaluation.rejected", async (donnees) => {
      const data = donnees as unknown as DonneesConnues;
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
    this.on("alert.created", async (donnees) => {
      const data = donnees as unknown as DonneesConnues;
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

  on(event: WebhookEvent, handler: GestionnaireWebhook) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  async emit(event: WebhookEvent, data: DonneesWebhook) {
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
