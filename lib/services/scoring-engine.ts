import prisma from "@/lib/prisma-client";
import { getDomainLeafDepth } from "@/lib/services/scoring-config-service";
import type { ScoringNode, ScoringEvaluationAnswer } from "@prisma/client";

/**
 * Result of scoring a single node
 */
export interface NodeScore {
  nodeId: string;
  rawScore: number;
  weightedScore: number;
  normalizedScore: number;
  weight: number;
  aggregationMethod?: string;
  explanation: string;
  ruleImpacts: RuleImpact[];
  childScores?: NodeScore[];
}

/**
 * Impact of a rule on scoring
 */
export interface RuleImpact {
  ruleId: string;
  ruleCode: string;
  ruleType: string;
  severity: string;
  impact: number;
  message: string;
}

/**
 * Generic recursive scoring engine
 * Supports domain-level granularity configuration for flexible scoring levels
 */
export class ScoringEngine {
  /**
   * Score an entire evaluation recursively
   * Respects per-domain leaf depth configuration from SCORING_DOMAIN_GRANULARITY
   */
  static async scoreEvaluation(
    evaluationId: string,
    versionId: string
  ): Promise<Map<string, NodeScore>> {
    // Fetch all nodes and answers
    const [nodes, answers] = await Promise.all([
      prisma.scoringNode.findMany({
        where: { versionId },
        include: {
          options: true,
          ranges: true,
          formulas: true,
          rules: true,
          applicabilityRules: true,
        },
        orderBy: { depth: "asc" },
      }),
      prisma.scoringEvaluationAnswer.findMany({
        where: { evaluationId },
      }),
    ]);

    // Build node tree structure
    const nodeMap = new Map<string, ScoringNode & { children: unknown[] }>();
    nodes.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // Link parent-child relationships
    nodes.forEach((node) => {
      if (node.parentNodeId && nodeMap.has(node.parentNodeId)) {
        const parent = nodeMap.get(node.parentNodeId);
        const child = nodeMap.get(node.id);
        if (parent && child) {
          parent.children.push(child);
        }
      }
    });

    // Find root nodes (no parent)
    const rootNodes = nodes.filter((n) => !n.parentNodeId);

    // Score from leaves up
    const results = new Map<string, NodeScore>();
    for (const rootNode of rootNodes) {
      const nodeWithChildren = nodeMap.get(rootNode.id);
      if (nodeWithChildren) {
        // Determine effective leaf depth for this domain
        let effectiveLeafDepth: number | undefined;
        if (rootNode.depth === 0 && rootNode.code) {
          const configuredDepth = await getDomainLeafDepth(rootNode.code);
          if (configuredDepth !== null) {
            effectiveLeafDepth = configuredDepth;
          }
        }
        if (effectiveLeafDepth === undefined) {
          effectiveLeafDepth = rootNode.scoreLeafDepth ?? 1; // Default to CRITERION
        }

        await this.scoreNodeRecursive(
          nodeWithChildren,
          evaluationId,
          answers,
          results,
          effectiveLeafDepth
        );
      }
    }

    return results;
  }

  /**
   * Recursively score a node and its children
   * respects the configured leaf depth for granular scoring
   */
  private static async scoreNodeRecursive(
    nodeWithChildren: ScoringNode & { children: unknown[] },
    _evaluationId: string,
    answers: ScoringEvaluationAnswer[],
    results: Map<string, NodeScore>,
    effectiveLeafDepth: number = 1
  ): Promise<NodeScore> {
    const node = nodeWithChildren;

    // Score children first
    const childScores: NodeScore[] = [];
    for (const child of node.children || []) {
      const childNode = child as ScoringNode & { children: unknown[] };
      const childScore = await this.scoreNodeRecursive(
        childNode,
        _evaluationId,
        answers,
        results,
        effectiveLeafDepth
      );
      childScores.push(childScore);
      results.set(childNode.id, childScore);
    }

    // Score this node based on its scoring method
    let nodeScore: NodeScore;

    // Check if this node should be treated as a leaf based on configured depth
    const isAtLeafDepth = node.depth >= effectiveLeafDepth;

    if (!isAtLeafDepth && childScores.length > 0 && node.aggregationMethod) {
      // This is a parent node - aggregate children
      nodeScore = await this.aggregateChildScores(
        node,
        childScores,
        answers
      );
    } else {
      // This is a leaf node - score based on answer
      // (either configured as leaf depth, or has no children, or marked as isScoringLeaf)
      nodeScore = await this.scoreLeafNode(node, answers);
    }

    // Apply rules
    nodeScore.ruleImpacts = await this.evaluateRules(node, nodeScore);
    nodeScore.normalizedScore = this.applyRuleImpacts(
      nodeScore.rawScore,
      nodeScore.ruleImpacts
    );

    nodeScore.childScores = childScores;

    return nodeScore;
  }

  /**
   * Score a leaf node based on its answer
   */
  private static async scoreLeafNode(
    node: ScoringNode & { options?: unknown[]; ranges?: unknown[]; weight?: number | null; aggregationMethod?: string | null },
    answers: ScoringEvaluationAnswer[]
  ): Promise<NodeScore> {
    const answer = answers.find((a) => a.nodeId === node.id);
    let rawScore = 0;
    let explanation = "";

    if (!answer) {
      explanation = "No answer provided";
      rawScore = 0;
    } else {
      // Score based on scoring method
      switch (node.scoringMethod) {
        case "OPTION_SCORE":
          rawScore = await this.scoreFromOption(node, answer);
          explanation = `Scored from option selection`;
          break;

        case "RANGE_SCORE":
          rawScore = await this.scoreFromRange(node, answer);
          explanation = `Scored from numeric range`;
          break;

        case "NUMERIC_DIRECT":
          rawScore = answer.valueNumber || 0;
          explanation = `Direct numeric score: ${rawScore}`;
          break;

        case "MANUAL_SCORE":
          rawScore = answer.manualScore || 0;
          explanation = `Manual score provided: ${rawScore}`;
          break;

        case "FORMULA_SCORE":
          rawScore = await this.scoreFromFormula(node, answer);
          explanation = `Scored from formula`;
          break;

        default:
          rawScore = answer.valueNumber || 0;
          explanation = `Default scoring method`;
      }

      if (answer.comment) {
        explanation += ` (${answer.comment})`;
      }
    }

    const weighted = rawScore * (node.weight || 1);

    return {
      nodeId: node.id,
      rawScore,
      weightedScore: weighted,
      normalizedScore: rawScore,
      weight: node.weight || 1,
      aggregationMethod: node.aggregationMethod || undefined,
      explanation,
      ruleImpacts: [],
    };
  }

  /**
   * Score from option selection
   */
  private static async scoreFromOption(
    node: ScoringNode & { options?: unknown[] },
    answer: ScoringEvaluationAnswer
  ): Promise<number> {
    const option = node.options?.find(
      (o: unknown) => (o as Record<string, unknown>).value === answer.valueString
    );
    return (option as Record<string, unknown> | undefined)?.score as number || 0;
  }

  /**
   * Score from numeric range
   */
  private static async scoreFromRange(node: ScoringNode & { ranges?: unknown[] }, answer: ScoringEvaluationAnswer): Promise<number> {
    const value = answer.valueNumber || 0;
    const range = node.ranges?.find(
      (r: unknown) => {
        const rangeRec = r as Record<string, unknown>;
        return value >= (rangeRec.minValue as number) &&
          value <= (rangeRec.maxValue as number) &&
          ((rangeRec.minIncluded as boolean) || value > (rangeRec.minValue as number)) &&
          ((rangeRec.maxIncluded as boolean) || value < (rangeRec.maxValue as number));
      }
    );
    return (range as Record<string, unknown> | undefined)?.score as number || 0;
  }

  /**
   * Score from formula
   */
  private static async scoreFromFormula(
    node: ScoringNode & { formulas?: unknown[] },
    answer: ScoringEvaluationAnswer
  ): Promise<number> {
    const formula = node.formulas?.[0];
    if (!formula) return 0;

    try {
      // Simple formula evaluation (can be enhanced with expression parser)
      // For now, use the manual score if formula exists
      return answer.manualScore || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Aggregate child scores based on aggregation method
   */
  private static async aggregateChildScores(
    node: ScoringNode & { weight?: number | null; aggregationMethod?: string | null },
    childScores: NodeScore[],
    _answers: ScoringEvaluationAnswer[]
  ): Promise<NodeScore> {
    let rawScore = 0;
    let explanation = "";

    switch (node.aggregationMethod) {
      case "WEIGHTED_AVERAGE":
        rawScore = this.weightedAverage(childScores);
        explanation = `Weighted average of ${childScores.length} children`;
        break;

      case "SIMPLE_AVERAGE":
        rawScore =
          childScores.reduce((sum, cs) => sum + cs.rawScore, 0) /
          childScores.length;
        explanation = `Simple average of ${childScores.length} children`;
        break;

      case "SUM":
        rawScore = childScores.reduce((sum, cs) => sum + cs.rawScore, 0);
        explanation = `Sum of ${childScores.length} children`;
        break;

      case "MIN":
        rawScore = Math.min(...childScores.map((cs) => cs.rawScore));
        explanation = `Minimum of ${childScores.length} children`;
        break;

      case "MAX":
        rawScore = Math.max(...childScores.map((cs) => cs.rawScore));
        explanation = `Maximum of ${childScores.length} children`;
        break;

      case "FIRST_NON_NULL":
        const nonNull = childScores.find((cs) => cs.rawScore !== 0);
        rawScore = nonNull?.rawScore || 0;
        explanation = `First non-zero child score`;
        break;

      case "CHILDREN_AGGREGATION":
        // Use weighted average if weights present
        rawScore = this.weightedAverage(childScores);
        explanation = `Hierarchical aggregation`;
        break;

      default:
        rawScore = this.weightedAverage(childScores);
        explanation = `Default aggregation (weighted average)`;
    }

    const weighted = rawScore * (node.weight || 1);

    return {
      nodeId: node.id,
      rawScore,
      weightedScore: weighted,
      normalizedScore: rawScore,
      weight: node.weight || 1,
      aggregationMethod: node.aggregationMethod || undefined,
      explanation,
      ruleImpacts: [],
    };
  }

  /**
   * Calculate weighted average
   */
  private static weightedAverage(scores: NodeScore[]): number {
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = scores.reduce(
      (sum, s) => sum + s.rawScore * s.weight,
      0
    );
    return weightedSum / totalWeight;
  }

  /**
   * Evaluate rules for a node
   */
  private static async evaluateRules(
    node: ScoringNode & { rules?: unknown[] },
    _nodeScore: NodeScore
  ): Promise<RuleImpact[]> {
    const impacts: RuleImpact[] = [];

    if (!node.rules || node.rules.length === 0) {
      return impacts;
    }

    for (const rule of node.rules) {
      // Simplified rule evaluation
      const triggered = await this.evaluateRuleCondition(rule);

      if (triggered) {
        const ruleRec = rule as Record<string, unknown>;
        const impact: RuleImpact = {
          ruleId: String(ruleRec.id),
          ruleCode: String(ruleRec.code),
          ruleType: String(ruleRec.ruleType),
          severity: String(ruleRec.severity || "MEDIUM"),
          impact: (ruleRec.penaltyValue as number) || 0,
          message: String(ruleRec.messageUser || `Rule ${ruleRec.code} triggered`),
        };

        impacts.push(impact);
      }
    }

    return impacts;
  }

  /**
   * Evaluate rule condition (simplified)
   */
  private static async evaluateRuleCondition(rule: unknown): Promise<boolean> {
    // Simplified evaluation - in production use expression evaluator
    const ruleRec = rule as Record<string, unknown>;
    if (!ruleRec.conditionExpression) return false;

    // For now, rules are triggered based on metadata
    // In full implementation, use safe expression evaluator
    return ruleRec.isActive === true;
  }

  /**
   * Apply rule impacts to adjust score
   */
  private static applyRuleImpacts(
    baseScore: number,
    impacts: RuleImpact[]
  ): number {
    let score = baseScore;

    for (const impact of impacts) {
      // Apply penalties
      if (impact.impact < 0) {
        score += impact.impact; // Add negative value
      }
    }

    // Clamp to reasonable range [0, 100]
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get final scores for evaluation
   */
  static async getFinalScores(
    _evaluationId: string,
    results: Map<string, NodeScore>
  ): Promise<{
    globalScore: number;
    scores: Map<string, NodeScore>;
    summary: Record<string, unknown>;
  }> {
    // Find root scores (nodes with no parent)
    const rootScores = Array.from(results.values()).filter(
      (score) => !score.nodeId.startsWith("child")
    );

    // Calculate global score as weighted average of roots
    const globalScore =
      rootScores.length > 0
        ? rootScores.reduce((sum, s) => sum + s.weightedScore, 0) /
          rootScores.length
        : 0;

    return {
      globalScore: Math.round(globalScore),
      scores: results,
      summary: {
        totalNodes: results.size,
        rootNodeCount: rootScores.length,
        timestamp: new Date(),
      },
    };
  }
}
