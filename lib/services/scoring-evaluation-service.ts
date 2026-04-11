import prisma from "@/lib/prisma-client";
import { ScoringEngine } from "./scoring-engine";

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

    if (!node) {
      throw new Error("Node not found");
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
          manualScore: data.manualScore,
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
          manualScore: data.manualScore,
          comment: data.comment,
        },
      });
    }

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

    // Calculate scores
    await this.calculateScores(evaluationId);

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

    const updated = await prisma.scoringEvaluation.update({
      where: { id: evaluationId },
      data: {
        status: "valide",
        validatedAt: new Date(),
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
   * Calculate scores for evaluation using the generic scoring engine
   */
  static async calculateScores(evaluationId: string) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
      select: { modelVersionId: true },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    // Use the generic scoring engine
    const nodeResults = await ScoringEngine.scoreEvaluation(
      evaluationId,
      evaluation.modelVersionId
    );

    // Store results in database
    for (const [nodeId, score] of nodeResults.entries()) {
      await prisma.scoringEvaluationNodeResult.upsert({
        where: {
          evaluationId_nodeId: {
            evaluationId,
            nodeId,
          },
        },
        create: {
          evaluationId,
          nodeId,
          rawScore: score.rawScore,
          weightedScore: score.weightedScore,
          normalizedScore: score.normalizedScore,
          explanation: score.explanation,
          aggregationMethod: score.aggregationMethod,
          ruleImpactJson: JSON.stringify(score.ruleImpacts),
          traceJson: JSON.stringify({
            weight: score.weight,
            method: score.aggregationMethod,
            ruleCount: score.ruleImpacts.length,
          }),
        },
        update: {
          rawScore: score.rawScore,
          weightedScore: score.weightedScore,
          normalizedScore: score.normalizedScore,
          explanation: score.explanation,
          aggregationMethod: score.aggregationMethod,
          ruleImpactJson: JSON.stringify(score.ruleImpacts),
          traceJson: JSON.stringify({
            weight: score.weight,
            method: score.aggregationMethod,
            ruleCount: score.ruleImpacts.length,
          }),
        },
      });
    }

    // Calculate and store global score
    const finalScores = await ScoringEngine.getFinalScores(
      evaluationId,
      nodeResults
    );

    // Update evaluation with final score
    await prisma.scoringEvaluation.update({
      where: { id: evaluationId },
      data: {
        finalScore: finalScores.globalScore,
      },
    });

    return { nodeResults, finalScores };
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
