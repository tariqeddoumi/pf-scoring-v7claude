import prisma from '@/lib/prisma-client';

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
      where: { id: data.modelVersionId }
    });

    if (!version) {
      throw new Error('Scoring model version not found');
    }

    const evaluation = await prisma.scoringEvaluation.create({
      data: {
        projectId: data.projectId,
        modelId: data.modelId,
        modelVersionId: data.modelVersionId,
        analystId: data.evaluatedBy,
        status: 'brouillon'
      },
      include: {
        answers: true
      }
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
      where: { id: data.evaluationId }
    });

    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    if (evaluation.status !== 'brouillon') {
      throw new Error('Can only record answers on draft evaluations');
    }

    const node = await prisma.scoringNode.findUnique({
      where: { id: data.nodeId }
    });

    if (!node) {
      throw new Error('Node not found');
    }

    // Check if answer already exists
    const existingAnswer = await prisma.scoringEvaluationAnswer.findFirst({
      where: {
        evaluationId: data.evaluationId,
        nodeId: data.nodeId
      }
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
          updatedAt: new Date()
        }
      });
    } else {
      // Create new answer
      answer = await prisma.scoringEvaluationAnswer.create({
        data: {
          evaluationId: data.evaluationId,
          nodeId: data.nodeId,
          answerType: node.answerType || 'TEXT',
          valueString: data.valueString,
          valueNumber: data.valueNumber,
          valueBoolean: data.valueBoolean,
          valueDate: data.valueDate,
          manualScore: data.manualScore,
          comment: data.comment
        }
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
        node: true
      }
    });
  }

  /**
   * Submit evaluation for review
   */
  static async submitEvaluation(
    evaluationId: string,
    submittedBy: string
  ) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId }
    });

    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    if (evaluation.status !== 'brouillon') {
      throw new Error('Only draft evaluations can be submitted');
    }

    // Calculate scores
    await this.calculateScores(evaluationId);

    const updated = await prisma.scoringEvaluation.update({
      where: { id: evaluationId },
      data: {
        status: 'soumis',
        submittedAt: new Date()
      }
    });

    return updated;
  }

  /**
   * Approve evaluation
   */
  static async approveEvaluation(
    evaluationId: string,
    approvedBy: string
  ) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId }
    });

    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    if (evaluation.status !== 'soumis') {
      throw new Error('Only submitted evaluations can be approved');
    }

    const updated = await prisma.scoringEvaluation.update({
      where: { id: evaluationId },
      data: {
        status: 'valide',
        validatedAt: new Date()
      }
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
      where: { id: evaluationId }
    });

    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    if (!['soumis', 'valide'].includes(evaluation.status)) {
      throw new Error('Can only reject submitted or validated evaluations');
    }

    // Reset to draft for corrections
    const updated = await prisma.scoringEvaluation.update({
      where: { id: evaluationId },
      data: {
        status: 'brouillon',
        notes: reason
      }
    });

    return updated;
  }

  /**
   * Calculate scores for evaluation
   */
  static async calculateScores(evaluationId: string) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        answers: true,
        version: {
          include: {
            nodes: true
          }
        }
      }
    });

    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    // Get all nodes in the hierarchy
    const nodes = evaluation.version.nodes;
    const nodeResults = new Map<string, any>();

    // Identify leaf nodes (nodes with no children)
    const nodeIds = new Set(nodes.map((n) => n.id));
    const parentNodeIds = new Set(
      nodes.map((n) => n.parentNodeId).filter((id) => id)
    );
    const leafNodeIds = new Set(
      nodes
        .filter((n) => !parentNodeIds.has(n.id))
        .map((n) => n.id)
    );

    // Score leaf nodes first
    for (const node of nodes.filter((n) => leafNodeIds.has(n.id))) {
      const score = await this.scoreNode(node, evaluation.answers);
      nodeResults.set(node.id, score);
    }

    // Store results
    for (const [nodeId, score] of nodeResults.entries()) {
      await prisma.scoringEvaluationNodeResult.upsert({
        where: {
          evaluationId_nodeId: {
            evaluationId,
            nodeId
          }
        },
        create: {
          evaluationId,
          nodeId,
          rawScore: score.value,
          weightedScore: score.value * (score.weight || 1),
          explanation: score.notes
        },
        update: {
          rawScore: score.value,
          weightedScore: score.value * (score.weight || 1),
          explanation: score.notes
        }
      });
    }

    return { nodeResults };
  }

  /**
   * Score a single node based on answer
   */
  private static async scoreNode(
    node: any,
    answers: any[]
  ): Promise<{
    value: number;
    weight: number;
    notes: string;
  }> {
    const answer = answers.find((a) => a.nodeId === node.id);

    if (!answer) {
      return {
        value: 0,
        weight: node.weight || 0,
        notes: 'No answer provided'
      };
    }

    // Score based on node's scoring method
    let score = 0;

    switch (node.scoringMethod) {
      case 'OPTION_SCORE':
        // Find option and get its score value
        const option = await prisma.scoringNodeOption.findFirst({
          where: {
            nodeId: node.id,
            value: answer.valueString
          }
        });
        score = option?.score || 0;
        break;

      case 'RANGE_SCORE':
        // Find range that contains the value
        const range = await prisma.scoringNodeRange.findFirst({
          where: {
            nodeId: node.id,
            minValue: { lte: answer.valueNumber || 0 },
            maxValue: { gte: answer.valueNumber || 0 }
          }
        });
        score = range?.score || 0;
        break;

      case 'MANUAL_SCORE':
        // Use the manual score provided
        score = answer.manualScore || 0;
        break;

      default:
        score = answer.valueNumber || 0;
    }

    return {
      value: score,
      weight: node.weight || 1,
      notes: answer.comment || ''
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
            node: true
          }
        },
        nodeResults: {
          include: {
            node: true
          }
        },
        version: {
          include: {
            nodes: true
          }
        }
      }
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
              select: { label: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
