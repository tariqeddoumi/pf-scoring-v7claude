import prisma from "@/lib/prisma-client";
import { ModelLoader, ModelTree, NodeMeta } from "./model-loader";
import { ScoreCalculator, AggregationEngine } from "./score-calculator";
import { ValueResolver, ResolvedValueSnapshot } from "./value-resolver";
import { BindingResolver, BindingContext } from "./binding-resolver";

export interface RuleImpact {
  ruleId: string;
  ruleCode: string;
  ruleType: string;
  severity: string;
  penalty: number;
  message: string;
}

export interface NodeResult {
  nodeId: string;
  code: string;
  label: string;
  depth: number;
  rawScore: number;
  weightedScore: number;
  normalizedScore: number;
  weight: number | null;
  aggregationMethod: string | null;
  ruleImpacts: RuleImpact[];
  explanation: string;
  childResults?: NodeResult[];
}

export interface EvaluationTrace {
  evaluationId: string;
  modelVersionId: string;
  finalScore: number;
  rating: string;
  recommendation: string;
  malusTotal: number;
  rootResults: NodeResult[];
  traceJson: string;
  triggeredRuleIds: string[];
}

export class ScoringEngineV8 {
  static async scoreEvaluation(evaluationId: string): Promise<EvaluationTrace> {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
      include: { project: true },
    });
    if (!evaluation) throw new Error(`Evaluation not found: ${evaluationId}`);

    const tree = await ModelLoader.loadVersion(evaluation.modelVersionId);
    const bindingCtx: BindingContext = {
      evaluationId,
      projectId: evaluation.projectId,
      clientId: evaluation.project?.clientId,
    };

    const resolvedBindings = await BindingResolver.resolveForNodes(
      Array.from(tree.nodesById.keys()),
      bindingCtx
    );

    const answers = await prisma.scoringEvaluationAnswer.findMany({
      where: { evaluationId },
    });
    const answersByNode = new Map(answers.map((a) => [a.nodeId, a]));

    // FIX 1: Load options and ranges for ALL nodes upfront
    const nodeIds = Array.from(tree.nodesById.keys());
    const [allOptions, allRanges] = await Promise.all([
      prisma.scoringNodeOption.findMany({
        where: { nodeId: { in: nodeIds }, isActive: true },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.scoringNodeRange.findMany({
        where: { nodeId: { in: nodeIds }, isActive: true },
        orderBy: { minValue: "asc" },
      }),
    ]);
    const optionsByNode = new Map<string, typeof allOptions>();
    for (const opt of allOptions) {
      const list = optionsByNode.get(opt.nodeId) || [];
      list.push(opt);
      optionsByNode.set(opt.nodeId, list);
    }
    const rangesByNode = new Map<string, typeof allRanges>();
    for (const rng of allRanges) {
      const list = rangesByNode.get(rng.nodeId) || [];
      list.push(rng);
      rangesByNode.set(rng.nodeId, list);
    }

    const allRules = await prisma.scoringNodeRule.findMany({
      where: { versionId: evaluation.modelVersionId, isActive: true },
    });
    const rulesByNode = new Map<string, typeof allRules>();
    for (const rule of allRules) {
      if (!rule.nodeId) continue;
      const list = rulesByNode.get(rule.nodeId) || [];
      list.push(rule);
      rulesByNode.set(rule.nodeId, list);
    }

    const nodeScores = new Map<string, NodeResult>();
    let triggeredRuleIds: string[] = [];
    let malusTotal = 0;

    ModelLoader.traverseBottomUp(tree, (node) => {
      const answer = answersByNode.get(node.id);
      const binding = resolvedBindings.get(node.id);

      let valueSnapshot: ResolvedValueSnapshot | undefined;
      if (answer) {
        const raw =
          answer.valueString ??
          answer.valueNumber ??
          answer.valueBoolean ??
          answer.valueDate ??
          answer.valueJson;
        valueSnapshot = ValueResolver.resolveValue(raw, binding);
      } else if (binding?.isAvailable) {
        valueSnapshot = ValueResolver.resolveValue(binding.resolvedValue, binding);
      }

      let rawScore = 0;
      let explanation = "";

      if (node.isScored && valueSnapshot) {
        // FIX 1: Use the preloaded options/ranges
        const options = (optionsByNode.get(node.id) || []).map((o) => ({
          value: o.value ?? o.code ?? o.label,
          score: o.score ?? 0,
        }));
        const ranges = (rangesByNode.get(node.id) || []).map((r) => ({
          min: r.minValue,
          max: r.maxValue,
          score: r.score ?? 0,
        }));

        const scoreOut = ScoreCalculator.score(
          {
            answer: valueSnapshot.resolvedValue as string | number | boolean | null,
            options: options.length > 0 ? options : undefined,
            ranges: ranges.length > 0 ? ranges : undefined,
          },
          0
        );
        rawScore = scoreOut.rawScore;
        explanation = scoreOut.explanation;
      } else if (!node.isScored && node.childrenCount > 0) {
        const childIds = tree.childrenOf.get(node.id) || [];
        const children = childIds.map((id) => nodeScores.get(id)).filter(Boolean) as NodeResult[];
        rawScore = AggregationEngine.aggregate(node.aggregationMethod ?? undefined, children as any);
        explanation = `Aggregated ${children.length} children using ${node.aggregationMethod || "AVERAGE"}`;
      }

      // FIX 2: weights are fractions (0.0-1.0), no /100 division needed
      const weight = node.weight ?? null;
      const weightedScore = weight !== null ? rawScore * weight : rawScore;

      const rules = rulesByNode.get(node.id) || [];
      const ruleImpacts: RuleImpact[] = [];
      for (const rule of rules) {
        if (rule.actionType === "APPLY_MALUS" && rule.penaltyValue) {
          ruleImpacts.push({
            ruleId: rule.id,
            ruleCode: rule.code,
            ruleType: rule.ruleType,
            severity: rule.severity,
            penalty: rule.penaltyValue,
            message: rule.messageUser || rule.label,
          });
          malusTotal += rule.penaltyValue;
          triggeredRuleIds.push(rule.id);
        }
      }

      const normalizedScore = AggregationEngine.normalize(rawScore, node.scoreMax || 100);

      nodeScores.set(node.id, {
        nodeId: node.id,
        code: node.code,
        label: node.label,
        depth: node.depth,
        rawScore,
        weightedScore,
        normalizedScore,
        weight: node.weight,
        aggregationMethod: node.aggregationMethod,
        ruleImpacts,
        explanation,
      });
    });

    const rootResults: NodeResult[] = [];
    for (const rootId of tree.rootNodeIds) {
      const root = nodeScores.get(rootId);
      if (root) {
        root.childResults = this.buildResultTree(rootId, nodeScores, tree);
        rootResults.push(root);
      }
    }

    // FIX 3: finalScore = sum of ALL domain weightedScores (not just first)
    const totalWeight = rootResults.reduce((s, r) => s + (r.weight ?? 0), 0);
    const rawFinalScore =
      totalWeight > 0
        ? rootResults.reduce((s, r) => s + r.rawScore * (r.weight ?? 0), 0) / totalWeight
        : rootResults.reduce((s, r) => s + r.weightedScore, 0);
    const finalScoreAdjusted = Math.max(0, Math.min(100, rawFinalScore - malusTotal));
    const rating = this.scoreToRating(finalScoreAdjusted);

    const traceJson = JSON.stringify(rootResults, null, 2);

    return {
      evaluationId,
      modelVersionId: evaluation.modelVersionId,
      finalScore: finalScoreAdjusted,
      rating,
      recommendation: this.scoreToRecommendation(finalScoreAdjusted),
      malusTotal,
      rootResults,
      traceJson,
      triggeredRuleIds,
    };
  }

  private static buildResultTree(
    nodeId: string,
    nodeScores: Map<string, NodeResult>,
    tree: ModelTree
  ): NodeResult[] {
    const children: NodeResult[] = [];
    const childIds = tree.childrenOf.get(nodeId) || [];
    for (const childId of childIds) {
      const child = nodeScores.get(childId);
      if (child) {
        child.childResults = this.buildResultTree(childId, nodeScores, tree);
        children.push(child);
      }
    }
    return children;
  }

  private static scoreToRating(score: number): string {
    if (score >= 90) return "AAA";
    if (score >= 80) return "AA";
    if (score >= 70) return "A";
    if (score >= 60) return "BBB";
    if (score >= 50) return "BB";
    if (score >= 40) return "B";
    if (score >= 30) return "CCC";
    if (score >= 20) return "CC";
    if (score >= 10) return "C";
    return "D";
  }

  private static scoreToRecommendation(score: number): string {
    if (score >= 80) return "Approuver - Profil très solide";
    if (score >= 60) return "Approuver avec conditions";
    if (score >= 40) return "Examiner en comité";
    return "Rejeter - Profil insuffisant";
  }

  static async persistTrace(trace: EvaluationTrace): Promise<void> {
    await prisma.scoringEvaluation.update({
      where: { id: trace.evaluationId },
      data: {
        finalScore: trace.finalScore,
        rating: trace.rating,
        recommendation: trace.recommendation,
        malusTotal: trace.malusTotal,
        triggeredRulesJson: JSON.stringify(trace.triggeredRuleIds),
        summaryJson: trace.traceJson,
      },
    });

    const results: Array<{ evaluationId: string; nodeId: string; data: NodeResult }> = [];
    const collectResults = (nodes: NodeResult[]) => {
      for (const node of nodes) {
        results.push({ evaluationId: trace.evaluationId, nodeId: node.nodeId, data: node });
        if (node.childResults) collectResults(node.childResults);
      }
    };
    collectResults(trace.rootResults);

    await prisma.$transaction([
      prisma.scoringEvaluationNodeResult.deleteMany({
        where: { evaluationId: trace.evaluationId },
      }),
      prisma.scoringEvaluationNodeResult.createMany({
        data: results.map(({ evaluationId, nodeId, data }) => ({
          evaluationId,
          nodeId,
          rawScore: data.rawScore,
          weightedScore: data.weightedScore,
          normalizedScore: data.normalizedScore,
          aggregationMethod: data.aggregationMethod,
          explanation: data.explanation,
          ruleImpactJson: JSON.stringify(data.ruleImpacts),
          traceJson: JSON.stringify(data),
        })),
      }),
    ]);
  }
}
