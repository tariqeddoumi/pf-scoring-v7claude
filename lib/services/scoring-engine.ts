import prisma from '@/lib/prisma-client';
import { ScoringAnswerType } from '@prisma/client';

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
 */
export class ScoringEngine {
  /**
   * Score an entire evaluation recursively
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
          applicabilityRules: true
        },
        orderBy: { depth: 'asc' }
      }),
      prisma.scoringEvaluationAnswer.findMany({
        where: { evaluationId }
      })
    ]);

    // Build node tree structure
    const nodeMap = new Map<string, any>();
    nodes.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // Link parent-child relationships
    nodes.forEach((node) => {
      if (node.parentNodeId && nodeMap.has(node.parentNodeId)) {
        nodeMap.get(node.parentNodeId).children.push(nodeMap.get(node.id));
      }
    });

    // Find root nodes (no parent)
    const rootNodes = nodes.filter((n) => !n.parentNodeId);

    // Score from leaves up
    const results = new Map<string, NodeScore>();
    for (const rootNode of rootNodes) {
      await this.scoreNodeRecursive(
        nodeMap.get(rootNode.id),
        evaluationId,
        answers,
        results
      );
    }

    return results;
  }

  /**
   * Recursively score a node and its children
   */
  private static async scoreNodeRecursive(
    nodeWithChildren: any,
    evaluationId: string,
    answers: any[],
    results: Map<string, NodeScore>
  ): Promise<NodeScore> {
    const node = nodeWithChildren;

    // Score children first
    const childScores: NodeScore[] = [];
    for (const child of node.children || []) {
      const childScore = await this.scoreNodeRecursive(
        child,
        evaluationId,
        answers,
        results
      );
      childScores.push(childScore);
      results.set(child.id, childScore);
    }

    // Score this node based on its scoring method
    let nodeScore: NodeScore;

    if (childScores.length > 0 && node.aggregationMethod) {
      // This is a parent node - aggregate children
      nodeScore = await this.aggregateChildScores(
        node,
        childScores,
        evaluationId,
        answers
      );
    } else {
      // This is a leaf node - score based on answer
      nodeScore = await this.scoreLeafNode(node, evaluationId, answers);
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
    node: any,
    evaluationId: string,
    answers: any[]
  ): Promise<NodeScore> {
    const answer = answers.find((a) => a.nodeId === node.id);
    let rawScore = 0;
    let explanation = '';

    if (!answer) {
      explanation = 'No answer provided';
      rawScore = 0;
    } else {
      // Score based on scoring method
      switch (node.scoringMethod) {
        case 'OPTION_SCORE':
          rawScore = await this.scoreFromOption(node, answer);
          explanation = `Scored from option selection`;
          break;

        case 'RANGE_SCORE':
          rawScore = await this.scoreFromRange(node, answer);
          explanation = `Scored from numeric range`;
          break;

        case 'NUMERIC_DIRECT':
          rawScore = answer.valueNumber || 0;
          explanation = `Direct numeric score: ${rawScore}`;
          break;

        case 'MANUAL_SCORE':
          rawScore = answer.manualScore || 0;
          explanation = `Manual score provided: ${rawScore}`;
          break;

        case 'FORMULA_SCORE':
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
      aggregationMethod: node.aggregationMethod,
      explanation,
      ruleImpacts: []
    };
  }

  /**
   * Score from option selection
   */
  private static async scoreFromOption(node: any, answer: any): Promise<number> {
    const option = node.options?.find((o: any) => o.value === answer.valueString);
    return option?.score || 0;
  }

  /**
   * Score from numeric range
   */
  private static async scoreFromRange(node: any, answer: any): Promise<number> {
    const value = answer.valueNumber || 0;
    const range = node.ranges?.find(
      (r: any) =>
        value >= r.minValue &&
        value <= r.maxValue &&
        (r.minIncluded || value > r.minValue) &&
        (r.maxIncluded || value < r.maxValue)
    );
    return range?.score || 0;
  }

  /**
   * Score from formula
   */
  private static async scoreFromFormula(node: any, answer: any): Promise<number> {
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
    node: any,
    childScores: NodeScore[],
    evaluationId: string,
    answers: any[]
  ): Promise<NodeScore> {
    let rawScore = 0;
    let explanation = '';

    switch (node.aggregationMethod) {
      case 'WEIGHTED_AVERAGE':
        rawScore = this.weightedAverage(childScores);
        explanation = `Weighted average of ${childScores.length} children`;
        break;

      case 'SIMPLE_AVERAGE':
        rawScore =
          childScores.reduce((sum, cs) => sum + cs.rawScore, 0) /
          childScores.length;
        explanation = `Simple average of ${childScores.length} children`;
        break;

      case 'SUM':
        rawScore = childScores.reduce((sum, cs) => sum + cs.rawScore, 0);
        explanation = `Sum of ${childScores.length} children`;
        break;

      case 'MIN':
        rawScore = Math.min(...childScores.map((cs) => cs.rawScore));
        explanation = `Minimum of ${childScores.length} children`;
        break;

      case 'MAX':
        rawScore = Math.max(...childScores.map((cs) => cs.rawScore));
        explanation = `Maximum of ${childScores.length} children`;
        break;

      case 'FIRST_NON_NULL':
        const nonNull = childScores.find((cs) => cs.rawScore !== 0);
        rawScore = nonNull?.rawScore || 0;
        explanation = `First non-zero child score`;
        break;

      case 'CHILDREN_AGGREGATION':
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
      aggregationMethod: node.aggregationMethod,
      explanation,
      ruleImpacts: []
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
    node: any,
    nodeScore: NodeScore
  ): Promise<RuleImpact[]> {
    const impacts: RuleImpact[] = [];

    if (!node.rules || node.rules.length === 0) {
      return impacts;
    }

    for (const rule of node.rules) {
      // Simplified rule evaluation
      const triggered = await this.evaluateRuleCondition(rule);

      if (triggered) {
        const impact: RuleImpact = {
          ruleId: rule.id,
          ruleCode: rule.code,
          ruleType: rule.ruleType,
          severity: rule.severity || 'MEDIUM',
          impact: rule.penaltyValue || 0,
          message: rule.messageUser || `Rule ${rule.code} triggered`
        };

        impacts.push(impact);
      }
    }

    return impacts;
  }

  /**
   * Evaluate rule condition (simplified)
   */
  private static async evaluateRuleCondition(rule: any): Promise<boolean> {
    // Simplified evaluation - in production use expression evaluator
    if (!rule.conditionExpression) return false;

    // For now, rules are triggered based on metadata
    // In full implementation, use safe expression evaluator
    return rule.isActive === true;
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
    evaluationId: string,
    results: Map<string, NodeScore>
  ): Promise<{
    globalScore: number;
    scores: Map<string, NodeScore>;
    summary: any;
  }> {
    // Find root scores (nodes with no parent)
    const rootScores = Array.from(results.values()).filter(
      (score) => !score.nodeId.startsWith('child')
    );

    // Calculate global score as weighted average of roots
    const globalScore =
      rootScores.length > 0
        ? rootScores.reduce(
            (sum, s) => sum + s.weightedScore,
            0
          ) / rootScores.length
        : 0;

    return {
      globalScore: Math.round(globalScore),
      scores: results,
      summary: {
        totalNodes: results.size,
        rootNodeCount: rootScores.length,
        timestamp: new Date()
      }
    };
  }
}
