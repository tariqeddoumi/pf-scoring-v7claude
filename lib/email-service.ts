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

  /**
   * Aucun fournisseur d'envoi n'est raccordé.
   *
   * Cette méthode renvoyait « true » dès qu'une clé d'API était configurée, sans rien
   * envoyer : renseigner EMAIL_API_KEY aurait suffi à faire disparaître silencieusement
   * toutes les notifications de validation et de rejet, en les déclarant délivrées.
   * Tant qu'un fournisseur n'est pas branché ici, l'échec est annoncé comme tel.
   */
  async send(to: string, template: EmailTemplate): Promise<boolean> {
    console.warn(
      `[EMAIL] Envoi non effectué vers ${to} (« ${template.subject} ») : ` +
        "aucun fournisseur d'envoi n'est raccordé au service."
    );
    return false;
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
