interface EmailTemplate {
  subject: string;
  html: string;
}

const TEMPLATES = {
  evaluation_submitted: (name: string, evalId: string): EmailTemplate => ({
    subject: "Évaluation soumise - " + evalId,
    html: `
      <h2>Évaluation soumise</h2>
      <p>Bonjour,</p>
      <p>L'évaluation <strong>${evalId}</strong> a été soumise par ${name}.</p>
      <p>
        <a href="https://pf-scoring.app/evaluations/${evalId}"
           style="background: #00a8cc; color: white; padding: 10px 20px;
                  text-decoration: none; border-radius: 4px;">
          Voir l'évaluation
        </a>
      </p>
      <p>Cordialement,<br/>Équipe PF Scoring</p>
    `,
  }),

  evaluation_validated: (evalId: string): EmailTemplate => ({
    subject: "Évaluation validée - " + evalId,
    html: `
      <h2>Évaluation validée ✅</h2>
      <p>L'évaluation <strong>${evalId}</strong> a été validée.</p>
      <p><strong>Action requise:</strong> Aucune - évaluation archivée.</p>
    `,
  }),

  evaluation_rejected: (evalId: string, reason: string): EmailTemplate => ({
    subject: "Évaluation rejetée - " + evalId,
    html: `
      <h2>Évaluation rejetée ❌</h2>
      <p>L'évaluation <strong>${evalId}</strong> a été rejetée.</p>
      <p><strong>Raison:</strong> ${reason}</p>
      <p>Veuillez corriger et resoummettre.</p>
    `,
  }),

  alert_critical: (type: string, project: string): EmailTemplate => ({
    subject: "🚨 ALERTE CRITIQUE - " + type,
    html: `
      <h2>Alerte Critique</h2>
      <p>Type: <strong>${type}</strong></p>
      <p>Projet: <strong>${project}</strong></p>
      <p>Action immédiate requise.</p>
    `,
  }),
};

export class EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.EMAIL_API_KEY || "";
    this.fromEmail = process.env.EMAIL_FROM || "noreply@pfscoring.ma";
  }

  async send(to: string, template: EmailTemplate): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      // Mock implementation - replace with actual email provider
      return true;
    } catch (error) {
      return false;
    }
  }

  async sendEvaluationSubmitted(email: string, name: string, evalId: string) {
    const template = TEMPLATES.evaluation_submitted(name, evalId);
    return this.send(email, template);
  }

  async sendEvaluationValidated(email: string, evalId: string) {
    const template = TEMPLATES.evaluation_validated(evalId);
    return this.send(email, template);
  }

  async sendEvaluationRejected(email: string, evalId: string, reason: string) {
    const template = TEMPLATES.evaluation_rejected(evalId, reason);
    return this.send(email, template);
  }

  async sendAlertCritical(email: string, type: string, project: string) {
    const template = TEMPLATES.alert_critical(type, project);
    return this.send(email, template);
  }
}

export const emailService = new EmailService();
