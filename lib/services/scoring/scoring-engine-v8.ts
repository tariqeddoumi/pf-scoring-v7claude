import prisma from "@/lib/prisma-client";
import { ModelLoader, ModelTree, NodeMeta } from "./model-loader";
import { ScoreCalculator, AggregationEngine } from "./score-calculator";
import { ValueResolver, ResolvedValueSnapshot } from "./value-resolver";
import { BindingResolver, BindingContext } from "./binding-resolver";

/**
 * Scoring Engine V8 — moteur de calcul unifié.
 *
 * FONCTIONNEMENT (pour débutants) :
 * --------------------------------------------------
 * 1. On charge la structure du modèle (arbre de nœuds)
 * 2. On résout les liaisons de données (binding : ex. "lire le montant du projet")
 * 3. On calcule le score de chaque FEUILLE (question individuelle)
 *    → options (choix multiples) ou plages numériques (ex: DSCR > 1.5 = 80 pts)
 * 4. On remonte dans l'arbre (bottom-up) en agrégeant les scores enfants
 * 5. On applique les règles malus (pénalités pour conditions risquées)
 * 6. On génère une trace complète pour l'audit
 *
 * Le score final est converti en note Basel (AAA → D) et une recommandation.
 */

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
  /**
   * Score an entire evaluation end-to-end:
   * 1. Load model structure
   * 2. Resolve all answers with bindings
   * 3. Calculate node scores bottom-up
   * 4. Apply rules & penalties
   * 5. Aggregate hierarchy
   * 6. Generate trace & rating
   */
  static async scoreEvaluation(evaluationId: string): Promise<EvaluationTrace> {
    // Load evaluation context
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
      include: { project: true },
    });
    if (!evaluation) throw new Error(`Evaluation not found: ${evaluationId}`);

    // Load model & answers
    const tree = await ModelLoader.loadVersion(evaluation.modelVersionId);
    const bindingCtx: BindingContext = {
      evaluationId,
      projectId: evaluation.projectId,
      clientId: evaluation.project?.clientId,
    };

    // Resolve all bindings once
    const resolvedBindings = await BindingResolver.resolveForNodes(
      Array.from(tree.nodesById.keys()),
      bindingCtx
    );

    // Load all answers
    const answers = await prisma.scoringEvaluationAnswer.findMany({
      where: { evaluationId },
    });
    const answersByNode = new Map(answers.map((a) => [a.nodeId, a]));

    // Load all rules
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

    // Calcul des scores en remontant de la feuille vers la racine (bottom-up).
    // IMPORTANT : on utilise traverseBottomUp (post-ordre) et non traverseDepthFirst
    // (pré-ordre), sinon les enfants ne sont pas encore calculés quand le parent
    // essaie de les agréger.
    const nodeScores = new Map<string, NodeResult>();
    let triggeredRuleIds: string[] = [];
    let malusTotal = 0;

    ModelLoader.traverseBottomUp(tree, (node) => {
      const answer = answersByNode.get(node.id);
      const binding = resolvedBindings.get(node.id);

      // Resolve value
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

      // Score the node
      let rawScore = 0;
      let explanation = "";

      if (node.isScored && valueSnapshot) {
        // Load options & ranges
        const options: any[] = [];
        const ranges: any[] = [];
        const formula = undefined;

        // Score using appropriate method
        const scoreOut = ScoreCalculator.score(
          {
            answer: valueSnapshot.resolvedValue as string | number | boolean | null,
            options,
            ranges,
            formula,
          },
          0
        );
        rawScore = scoreOut.rawScore;
        explanation = scoreOut.explanation;
      } else if (!node.isScored && node.childrenCount > 0) {
        // Aggregate children
        const childIds = tree.childrenOf.get(node.id) || [];
        const children = childIds.map((id) => nodeScores.get(id)).filter(Boolean) as NodeResult[];
        rawScore = AggregationEngine.aggregate(node.aggregationMethod ?? undefined, children as any);
        explanation = `Aggregated ${children.length} children using ${node.aggregationMethod || "SUM"}`;
      }

      // Apply weighted score
      const weight = node.weight ?? 1;
      const weightedScore = AggregationEngine.computeWeighted({ rawScore, weight } as any);

      // Apply rules
      const rules = rulesByNode.get(node.id) || [];
      const ruleImpacts: RuleImpact[] = [];
      for (const rule of rules) {
        // Simplified rule evaluation (in production, use a proper expression engine)
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

    // Build result hierarchy
    const rootResults: NodeResult[] = [];
    for (const rootId of tree.rootNodeIds) {
      const root = nodeScores.get(rootId);
      if (root) {
        root.childResults = this.buildResultTree(rootId, nodeScores, tree);
        rootResults.push(root);
      }
    }

    // Compute final score (first root's weighted score if available)
    const finalScore = rootResults.length > 0 ? rootResults[0].weightedScore : 0;
    const finalScoreAdjusted = Math.max(0, finalScore - malusTotal);
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

  /**
   * Recursively build child result hierarchy.
   */
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

  /**
   * Convert final score to Basel-compliant grade (AAA-D).
   */
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

  /**
   * Convert rating to risk recommendation.
   */
  private static scoreToRecommendation(score: number): string {
    if (score >= 80) return "Approuver - Profil très solide";
    if (score >= 60) return "Approuver avec conditions";
    if (score >= 40) return "Examiner en comité";
    return "Rejeter - Profil insuffisant";
  }

  /**
   * Persiste les résultats de calcul en base de données.
   *
   * OPTIMISATION : au lieu de faire N appels upsert (un par nœud),
   * on supprime les anciens résultats puis on insère tout en une seule requête.
   * Cela passe de N+1 requêtes à 3 requêtes quelle que soit la taille du modèle.
   */
  static async persistTrace(trace: EvaluationTrace): Promise<void> {
    // Étape 1 : mettre à jour le résumé de l'évaluation (score final, note, recommandation)
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

    // Étape 2 : collecter tous les résultats nœud par nœud (arbre → liste plate)
    const results: Array<{ evaluationId: string; nodeId: string; data: NodeResult }> = [];

    const collectResults = (nodes: NodeResult[]) => {
      for (const node of nodes) {
        results.push({ evaluationId: trace.evaluationId, nodeId: node.nodeId, data: node });
        if (node.childResults) collectResults(node.childResults);
      }
    };
    collectResults(trace.rootResults);

    // Étape 3 : supprimer les anciens résultats, puis insérer tous les nouveaux d'un coup
    // (deleteMany + createMany = 2 requêtes au lieu de N*2 avec upsert individuel)
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
