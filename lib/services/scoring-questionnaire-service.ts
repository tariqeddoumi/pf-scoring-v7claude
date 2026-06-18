import prisma from "@/lib/prisma-client";
import { getDomainLeafDepth } from "@/lib/services/scoring-config-service";
import { buildScoringLeafTree } from "@/lib/services/scoring-leaves-service";

export interface QuestionnaireNode {
  id: string;
  code: string;
  label: string;
  description?: string;
  depth: number;
  nodeType: string;
  answerType?: string;
  scoringMethod?: string;
  options?: { value: string; label: string; score: number }[];
  ranges?: { minValue: number; maxValue: number; score: number; label?: string }[];
  weight?: number;
  scoreLeafDepth?: number | null;
  isScoringLeaf?: boolean;
  children?: QuestionnaireNode[];
}

export class ScoringQuestionnaireService {
  /**
   * Get questionnaire for a specific ScoringModel version
   * Respects per-domain granularity configuration to truncate trees at appropriate levels
   */
  static async getQuestionnaire(
    modelVersionId: string
  ): Promise<QuestionnaireNode[]> {
    // Fetch all nodes for this version
    const nodes = await prisma.scoringNode.findMany({
      where: { versionId: modelVersionId },
      include: {
        options: {
          select: {
            value: true,
            label: true,
            score: true,
          },
        },
        ranges: {
          select: {
            minValue: true,
            maxValue: true,
            score: true,
            label: true,
          },
        },
      },
      orderBy: [{ depth: "asc" }, { orderIndex: "asc" }],
    });

    // Build tree structure
    const nodeMap = new Map<string, QuestionnaireNode>();
    const rootNodes: QuestionnaireNode[] = [];

    // Create node objects
    nodes.forEach((node) => {
      const qNode: QuestionnaireNode = {
        id: node.id,
        code: node.code,
        label: node.label,
        description: node.description || undefined,
        depth: node.depth,
        nodeType: node.nodeType,
        answerType: node.answerType || undefined,
        scoringMethod: node.scoringMethod || undefined,
        weight: node.weight || undefined,
        scoreLeafDepth: node.scoreLeafDepth || undefined,
        isScoringLeaf: node.isScoringLeaf || false,
        options:
          node.options && node.options.length > 0
            ? node.options.map((o: any) => ({
                value: o.value,
                label: o.label,
                score: o.score,
              }))
            : undefined,
        ranges:
          node.ranges && node.ranges.length > 0
            ? node.ranges.map((r: any) => ({
                minValue: r.minValue,
                maxValue: r.maxValue,
                score: r.score,
                label: r.label || undefined,
              }))
            : undefined,
        children: [],
      };

      nodeMap.set(node.id, qNode);

      // Track root nodes
      if (!node.parentNodeId) {
        rootNodes.push(qNode);
      }
    });

    // Link children to parents
    nodes.forEach((node) => {
      if (node.parentNodeId && nodeMap.has(node.parentNodeId)) {
        const parent = nodeMap.get(node.parentNodeId);
        const child = nodeMap.get(node.id);
        if (parent && child) {
          parent.children!.push(child);
        }
      }
    });

    // Apply domain-level granularity truncation
    const truncatedRoots: QuestionnaireNode[] = [];
    for (const rootNode of rootNodes) {
      // Get configured leaf depth for this domain (if it's a domain node)
      let effectiveLeafDepth: number | undefined;

      if (rootNode.depth === 0 && rootNode.code) {
        // This is a domain - check for configured granularity
        const configuredDepth = await getDomainLeafDepth(rootNode.code);
        if (configuredDepth !== null) {
          effectiveLeafDepth = configuredDepth;
        }
      }

      // If no config, use node's scoreLeafDepth or default
      if (effectiveLeafDepth === undefined) {
        effectiveLeafDepth = rootNode.scoreLeafDepth ?? 1; // Default to CRITERION (depth 1)
      }

      // Set the effective leaf depth on the root for use in buildScoringLeafTree
      rootNode.scoreLeafDepth = effectiveLeafDepth;

      // Truncate tree to appropriate level
      const truncated = buildScoringLeafTree(
        rootNode as any,
        effectiveLeafDepth
      );

      if (truncated) {
        truncatedRoots.push(truncated);
      }
    }

    return truncatedRoots;
  }

  /**
   * Get default scoring model (usually the latest published version)
   */
  static async getDefaultScoringModel() {
    const version = await prisma.scoringModelVersion.findFirst({
      where: {
        isPublished: true,
      },
      include: {
        model: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return version;
  }

  /**
   * Save answers for an evaluation
   */
  static async saveAnswers(
    evaluationId: string,
    answers: Array<{
      nodeId: string;
      answerType: string;
      valueString?: string;
      valueNumber?: number;
      valueBoolean?: boolean;
      comment?: string;
    }>
  ) {
    // Upsert each answer
    const savedAnswers = await Promise.all(
      answers.map((answer) =>
        prisma.scoringEvaluationAnswer.upsert({
          where: {
            evaluationId_nodeId: {
              evaluationId,
              nodeId: answer.nodeId,
            },
          },
          create: {
            evaluationId,
            nodeId: answer.nodeId,
            answerType: answer.answerType as any,
            valueString: answer.valueString,
            valueNumber: answer.valueNumber,
            valueBoolean: answer.valueBoolean,
            comment: answer.comment,
          },
          update: {
            valueString: answer.valueString,
            valueNumber: answer.valueNumber,
            valueBoolean: answer.valueBoolean,
            comment: answer.comment,
            updatedAt: new Date(),
          },
        })
      )
    );

    return savedAnswers;
  }

  /**
   * Get answers for an evaluation
   */
  static async getAnswers(evaluationId: string) {
    return prisma.scoringEvaluationAnswer.findMany({
      where: { evaluationId },
    });
  }
}
