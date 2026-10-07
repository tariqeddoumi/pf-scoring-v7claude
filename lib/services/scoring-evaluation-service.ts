import prisma from "@/lib/prisma-client";
import { ScoringEngineV8 } from "./scoring";
import { motifsRefusDecisionFavorable, motifsRefusSoumission } from "./scoring/decision-guard";

export class ScoringEvaluationService {
  /**
   * Create a new evaluation for a project
   */
  static async createEvaluation(data: {
    projectId: string;
    modelId: string;
    modelVersionId: string;
    evaluatedBy: string;
  }) {
    const version = await prisma.scoringModelVersion.findUnique({
      where: { id: data.modelVersionId },
    });

    if (!version) {
      throw new Error("Scoring model version not found");
    }
    if (!version.isPublished || version.modelId !== data.modelId) {
      throw new Error("Only the published version of this model can be used");
    }

    const evaluation = await prisma.scoringEvaluation.create({
      data: {
        projectId: data.projectId,
        modelId: data.modelId,
        modelVersionId: data.modelVersionId,
        analystId: data.evaluatedBy,
        status: "brouillon",
      },
      include: {
        answers: true,
      },
    });

    return evaluation;
  }

  /**
   * Record an answer for a node in an evaluation
   */
  static async recordAnswer(data: {
    evaluationId: string;
    nodeId: string;
    valueString?: string;
    valueNumber?: number;
    valueBoolean?: boolean;
    valueDate?: Date;
    manualScore?: number;
    comment?: string;
    recordedBy: string;
  }) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: data.evaluationId },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    if (evaluation.status !== "brouillon") {
      throw new Error("Can only record answers on draft evaluations");
    }

    const node = await prisma.scoringNode.findUnique({
      where: { id: data.nodeId },
    });

    // Un nœud d'une autre version du modèle n'appartient pas à la grille du dossier.
    if (!node || node.versionId !== evaluation.modelVersionId) {
      throw new Error("Node not found in the evaluation's model version");
    }

    // Check if answer already exists
    const existingAnswer = await prisma.scoringEvaluationAnswer.findFirst({
      where: {
        evaluationId: data.evaluationId,
        nodeId: data.nodeId,
      },
    });

    let answer;

    if (existingAnswer) {
      // Update existing answer
      answer = await prisma.scoringEvaluationAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          valueString: data.valueString,
          valueNumber: data.valueNumber,
          valueBoolean: data.valueBoolean,
          valueDate: data.valueDate,
          comment: data.comment,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new answer
      answer = await prisma.scoringEvaluationAnswer.create({
        data: {
          evaluationId: data.evaluationId,
          nodeId: data.nodeId,
          answerType: node.answerType || "TEXT",
          valueString: data.valueString,
          valueNumber: data.valueNumber,
          valueBoolean: data.valueBoolean,
          valueDate: data.valueDate,
          comment: data.comment,
        },
      });
    }

    // La réponse modifiée invalide le calcul courant : il faudra recalculer.
    await prisma.scoringEvaluation.update({
      where: { id: data.evaluationId },
      data: {
        finalScore: null,
        rating: null,
        recommendation: null,
        probabilityOfDefault: null,
        malusTotal: 0,
        triggeredRulesJson: null,
        summaryJson: null,
      },
    });

    return answer;
  }

  /**
   * Get all answers for an evaluation
   */
  static async getEvaluationAnswers(evaluationId: string) {
    return prisma.scoringEvaluationAnswer.findMany({
      where: { evaluationId },
      include: {
        node: true,
      },
    });
  }

  /**
   * Submit evaluation for review
   */
  static async submitEvaluation(evaluationId: string, submittedBy: string) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    if (evaluation.status !== "brouillon") {
      throw new Error("Only draft evaluations can be submitted");
    }

    // Calcul serveur, puis contrôle des préconditions de soumission
    await this.calculateScores(evaluationId, submittedBy);
    const recalcule = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
      select: { summaryJson: true },
    });
    const motifs = motifsRefusSoumission(recalcule?.summaryJson ?? null);
    if (motifs.length > 0) {
      throw new Error(`Only complete evaluations can be submitted — ${motifs.join(" ")}`);
    }

    const updated = await prisma.scoringEvaluation.update({
      where: { id: evaluationId },
      data: {
        status: "soumis",
        submittedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Approve evaluation
   */
  static async approveEvaluation(evaluationId: string, approvedBy: string) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    if (evaluation.status !== "soumis") {
      throw new Error("Only submitted evaluations can be approved");
    }

    // Statut seul ne suffit pas : NO_GO, calcul à jour et séparation des fonctions.
    const motifs = motifsRefusDecisionFavorable({
      evaluation: {
        status: String(evaluation.status),
        finalScore: evaluation.finalScore,
        summaryJson: evaluation.summaryJson,
        analystId: evaluation.analystId,
      },
      decideurId: approvedBy,
    });
    if (motifs.length > 0) {
      throw new Error(`Can only approve when allowed — ${motifs.join(" ")}`);
    }

    const updated = await prisma.scoringEvaluation.update({
      where: { id: evaluationId },
      data: {
        status: "valide",
        validatedAt: new Date(),
      },
    });
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringEvaluation",
        entityId: evaluationId,
        evaluationId,
        action: "VALIDATE",
        newValueJson: JSON.stringify({ status: "valide" }),
        changedBy: approvedBy,
        comment: "Évaluation approuvée",
      },
    });

    return updated;
  }

  /**
   * Reject evaluation with comments
   */
  static async rejectEvaluation(
    evaluationId: string,
    reason: string,
    rejectedBy: string
  ) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    if (!["soumis", "valide"].includes(evaluation.status)) {
      throw new Error("Can only reject submitted or validated evaluations");
    }

    // Reset to draft for corrections
    const updated = await prisma.scoringEvaluation.update({
      where: { id: evaluationId },
      data: {
        status: "brouillon",
        notes: reason,
      },
    });

    return updated;
  }

  /**
   * Calcule et persiste les scores via le moteur unique de l'application.
   *
   * Il n'existe plus qu'un seul moteur de scoring : ScoringEngineV8. Le score, le
   * rating, les malus, les règles déclenchées et l'éventuel blocage en proviennent,
   * et non plus d'une table de correspondance locale divergente.
   */
  static async calculateScores(evaluationId: string, auteur: string | null = null) {
    const trace = await ScoringEngineV8.scoreEvaluation(evaluationId);
    await ScoringEngineV8.persistTrace(trace, auteur);

    return {
      finalScore: trace.finalScore,
      rating: trace.rating,
      recommendation: trace.recommendation,
      malusTotal: trace.malusTotal,
      blocked: trace.blocked,
      blockingRuleCodes: trace.blockingRuleCodes,
    };
  }

  /**
   * Get evaluation with all results
   */
  static async getEvaluationWithResults(evaluationId: string) {
    return prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        answers: {
          include: {
            node: true,
          },
        },
        nodeResults: {
          include: {
            node: true,
          },
        },
        version: {
          include: {
            nodes: true,
          },
        },
      },
    });
  }

  /**
   * List evaluations for a project
   */
  static async getProjectEvaluations(projectId: string) {
    return prisma.scoringEvaluation.findMany({
      where: { projectId },
      include: {
        version: {
          select: {
            versionNumber: true,
            model: {
              select: { label: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
