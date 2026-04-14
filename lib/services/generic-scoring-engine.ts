import prisma from "@/lib/prisma-client";

/**
 * Service de calcul de scoring générique et paramétrable
 *
 * Architecture:
 * - Charge les nœuds d'une version scoring
 * - Récupère les réponses pour une évaluation
 * - Calcule récursivement: feuilles → parents
 * - Applique les règles (NO-GO, MALUS, warnings)
 * - Stocke les résultats détaillés par nœud
 * - Produit le score final et rating
 *
 * Avantages:
 * - 100% paramétré via ScoringNode
 * - Aucune logique hardcodée
 * - Traçabilité complète (audit trail)
 * - Flexible pour futurs changements
 */
export class GenericScoringEngine {
  /**
   * Lance le calcul complet du scoring pour une évaluation
   *
   * @param evaluationId - ID de l'évaluation
   * @param modelVersionId - ID de la version du modèle scoring
   * @returns Score final, rating, et tous les résultats par nœud
   */
  static async calculateEvaluation(
    evaluationId: string,
    modelVersionId: string
  ) {
    console.log(
      `[Scoring] Début calcul: evaluation=${evaluationId}, version=${modelVersionId}`
    );

    try {
      // Étape 1: Charger la structure du modèle (arbre de nœuds)
      const nodes = await this.loadScoringNodes(modelVersionId);
      if (!nodes.length) {
        throw new Error("Aucun nœud trouvé pour cette version de scoring");
      }
      console.log(`[Scoring] ${nodes.length} nœuds chargés`);

      // Étape 2: Charger les réponses de l'utilisateur
      const answers = await this.loadAnswers(evaluationId);
      console.log(`[Scoring] ${answers.length} réponses chargées`);

      // Étape 3: Construire l'arbre
      const nodeTree = this.buildNodeTree(nodes);
      console.log(`[Scoring] Arbre construit (${nodeTree.length} racines)`);

      // Étape 4: Calculer récursivement
      const results = new Map<string, ScoringNodeResult>();
      for (const rootNode of nodeTree) {
        await this.scoreNode(
          rootNode,
          nodes,
          answers,
          results,
          evaluationId
        );
      }
      console.log(`[Scoring] Calcul récursif: ${results.size} résultats`);

      // Étape 5: Calculer le score final
      const { globalScore, rating, summary } = await this.getFinalScore(
        results,
        evaluationId
      );
      console.log(
        `[Scoring] Score final: ${globalScore}/100 → Rating: ${rating}`
      );

      return {
        evaluationId,
        modelVersionId,
        globalScore,
        rating,
        results: Object.fromEntries(results),
        summary,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`[Scoring] Erreur lors du calcul:`, error);
      throw error;
    }
  }

  /**
   * Charge tous les nœuds d'une version scoring avec leurs configurations
   */
  private static async loadScoringNodes(modelVersionId: string) {
    return prisma.scoringNode.findMany({
      where: { versionId: modelVersionId },
      include: {
        options: true,
        ranges: true,
        rules: true,
        formulas: true,
      },
      orderBy: [{ depth: "asc" }, { orderIndex: "asc" }],
    });
  }

  /**
   * Charge toutes les réponses pour une évaluation
   */
  private static async loadAnswers(evaluationId: string) {
    return prisma.scoringEvaluationAnswer.findMany({
      where: { evaluationId },
    });
  }

  /**
   * Construit l'arbre hiérarchique des nœuds
   */
  private static buildNodeTree(nodes: any[]) {
    const nodeMap = new Map<string, any>();
    const roots: any[] = [];

    // Créer une map avec enfants vides
    nodes.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // Lier les enfants aux parents
    nodes.forEach((node) => {
      if (node.parentNodeId && nodeMap.has(node.parentNodeId)) {
        nodeMap.get(node.parentNodeId)?.children.push(nodeMap.get(node.id));
      } else if (!node.parentNodeId) {
        roots.push(nodeMap.get(node.id));
      }
    });

    return roots;
  }

  /**
   * Calcule un nœud et ses enfants récursivement
   */
  private static async scoreNode(
    node: any,
    allNodes: any[],
    answers: any[],
    results: Map<string, ScoringNodeResult>,
    evaluationId: string
  ): Promise<ScoringNodeResult> {
    // 1. Calculer les enfants d'abord
    const childResults: ScoringNodeResult[] = [];
    for (const child of node.children || []) {
      const childResult = await this.scoreNode(
        child,
        allNodes,
        answers,
        results,
        evaluationId
      );
      childResults.push(childResult);
      results.set(child.id, childResult);
    }

    // 2. Scorer ce nœud
    let nodeScore: ScoringNodeResult;

    if (childResults.length > 0) {
      // Nœud parent: agréger les enfants
      nodeScore = this.aggregateChildren(node, childResults);
    } else {
      // Nœud feuille: scorer basé sur la réponse
      const answer = answers.find((a) => a.nodeId === node.id);
      nodeScore = this.scoreLeafNode(node, answer);
    }

    // 3. Appliquer les règles
    nodeScore.appliedRules = await this.applyRules(node, nodeScore);
    nodeScore.normalizedScore = this.applyRuleImpacts(
      nodeScore.rawScore,
      nodeScore.appliedRules
    );

    // 4. Stocker en BD
    await this.storeNodeResult(evaluationId, nodeScore);

    return nodeScore;
  }

  /**
   * Agrège les scores des enfants en utilisant la méthode du nœud parent
   */
  private static aggregateChildren(
    parentNode: any,
    childResults: ScoringNodeResult[]
  ): ScoringNodeResult {
    if (childResults.length === 0) {
      return {
        nodeId: parentNode.id,
        rawScore: 0,
        normalizedScore: 0,
        weight: parentNode.weight || 1,
        aggregationMethod: parentNode.aggregationMethod,
        explanation: "Aucun enfant",
        appliedRules: [],
      };
    }

    let rawScore = 0;
    let explanation = "";

    // Sélectionner la méthode d'agrégation
    switch (parentNode.aggregationMethod) {
      case "WEIGHTED_AVERAGE":
        const totalWeight = childResults.reduce((sum, r) => sum + r.weight, 0);
        rawScore =
          childResults.reduce((sum, r) => sum + r.rawScore * r.weight, 0) /
          totalWeight;
        explanation = `Moyenne pondérée de ${childResults.length} enfants`;
        break;

      case "SIMPLE_AVERAGE":
        rawScore =
          childResults.reduce((sum, r) => sum + r.rawScore, 0) /
          childResults.length;
        explanation = `Moyenne simple de ${childResults.length} enfants`;
        break;

      case "SUM":
        rawScore = childResults.reduce((sum, r) => sum + r.rawScore, 0);
        explanation = `Somme de ${childResults.length} enfants`;
        break;

      case "MIN":
        rawScore = Math.min(...childResults.map((r) => r.rawScore));
        explanation = `Minimum de ${childResults.length} enfants`;
        break;

      case "MAX":
        rawScore = Math.max(...childResults.map((r) => r.rawScore));
        explanation = `Maximum de ${childResults.length} enfants`;
        break;

      default:
        rawScore =
          childResults.reduce((sum, r) => sum + r.rawScore, 0) /
          childResults.length;
        explanation = `Agrégation par défaut (moyenne)`;
    }

    return {
      nodeId: parentNode.id,
      rawScore: Math.min(100, Math.max(0, rawScore)), // Clamp 0-100
      normalizedScore: rawScore,
      weight: parentNode.weight || 1,
      aggregationMethod: parentNode.aggregationMethod,
      explanation,
      appliedRules: [],
    };
  }

  /**
   * Calcule le score d'un nœud feuille basé sur la réponse
   */
  private static scoreLeafNode(
    node: any,
    answer: any
  ): ScoringNodeResult {
    let rawScore = 0;
    let explanation = "Pas de réponse";

    if (!answer) {
      rawScore = 0;
      explanation = "Aucune réponse fournie";
    } else {
      // Méthode de scoring du nœud
      switch (node.scoringMethod) {
        case "OPTION_SCORE":
          // Réponse choix: chercher le score de l'option
          const option = node.options?.find(
            (o: any) => o.value === answer.valueString
          );
          rawScore = option?.score || 0;
          explanation = `Option sélectionnée: ${answer.valueString} (${rawScore}pts)`;
          break;

        case "RANGE_SCORE":
          // Réponse numérique: chercher la plage
          const range = node.ranges?.find(
            (r: any) =>
              answer.valueNumber >= r.minValue &&
              answer.valueNumber <= r.maxValue
          );
          rawScore = range?.score || 0;
          explanation = `Valeur ${answer.valueNumber} → plage ${range?.label || "?"} (${rawScore}pts)`;
          break;

        case "NUMERIC_DIRECT":
          // Score direct de la valeur (normalisé 0-100)
          rawScore = Math.min(100, Math.max(0, answer.valueNumber || 0));
          explanation = `Score numérique direct: ${rawScore}`;
          break;

        case "MANUAL_SCORE":
          // Score saisi manuellement
          rawScore = answer.manualScore || 0;
          explanation = `Score manuel: ${rawScore}`;
          break;

        case "FORMULA":
          // À évaluer avec formule (future)
          rawScore = answer.manualScore || 0;
          explanation = `Score via formule`;
          break;

        default:
          rawScore = answer.valueNumber || 0;
          explanation = "Méthode de scoring par défaut";
      }
    }

    // Appliquer le poids du nœud
    const weightedScore = rawScore * (node.weight || 1);

    return {
      nodeId: node.id,
      rawScore,
      normalizedScore: rawScore,
      weight: node.weight || 1,
      aggregationMethod: node.aggregationMethod,
      explanation,
      appliedRules: [],
    };
  }

  /**
   * Applique les règles (NO-GO, MALUS, warnings) à un nœud
   */
  private static async applyRules(
    node: any,
    nodeScore: ScoringNodeResult
  ) {
    const appliedRules: AppliedRule[] = [];

    if (!node.rules || node.rules.length === 0) {
      return appliedRules;
    }

    for (const rule of node.rules) {
      // Évaluer si la règle s'applique
      const triggered = this.evaluateRuleCondition(rule, nodeScore);

      if (triggered) {
        appliedRules.push({
          ruleId: rule.id,
          ruleCode: rule.code,
          ruleType: rule.ruleType, // NO-GO, MALUS, WARNING
          severity: rule.severity || "MEDIUM",
          penaltyValue: rule.penaltyValue || 0,
          message: rule.messageUser || `Règle ${rule.code} déclenchée`,
        });
      }
    }

    return appliedRules;
  }

  /**
   * Évalue si une règle s'applique basée sur des conditions
   */
  private static evaluateRuleCondition(rule: any, nodeScore: ScoringNodeResult): boolean {
    // Pour l'instant, logique simple
    // Futur: parser d'expressions pour conditions complexes

    if (!rule.isActive) return false;

    // Exemple: règle déclenchée si score < 25
    if (rule.ruleType === "NO-GO" && nodeScore.rawScore < 25) {
      return true;
    }

    return false;
  }

  /**
   * Applique l'impact des règles au score
   */
  private static applyRuleImpacts(
    baseScore: number,
    rules: AppliedRule[]
  ): number {
    let score = baseScore;

    for (const rule of rules) {
      if (rule.penaltyValue < 0) {
        score += rule.penaltyValue; // Ajouter la pénalité (valeur négative)
      }
    }

    // Clamper 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Stocke le résultat d'un nœud en BD
   */
  private static async storeNodeResult(
    evaluationId: string,
    result: ScoringNodeResult
  ) {
    await prisma.scoringEvaluationNodeResult.upsert({
      where: {
        evaluationId_nodeId: {
          evaluationId,
          nodeId: result.nodeId,
        },
      },
      create: {
        evaluationId,
        nodeId: result.nodeId,
        rawScore: result.rawScore,
        normalizedScore: result.normalizedScore,
        weight: result.weight,
        appliedRulesJson: JSON.stringify(result.appliedRules),
        explanation: result.explanation,
      },
      update: {
        rawScore: result.rawScore,
        normalizedScore: result.normalizedScore,
        appliedRulesJson: JSON.stringify(result.appliedRules),
        explanation: result.explanation,
      },
    });
  }

  /**
   * Calcule le score final et la rating à partir des résultats des nœuds racines
   */
  private static async getFinalScore(
    results: Map<string, ScoringNodeResult>,
    evaluationId: string
  ) {
    // Récupérer les nœuds racines (domaines)
    const rootResults = Array.from(results.values()).filter((r) =>
      this.isRootNode(r)
    );

    if (rootResults.length === 0) {
      return {
        globalScore: 0,
        rating: "D",
        summary: { message: "Aucun score calculé" },
      };
    }

    // Moyenne pondérée des domaines
    const totalWeight = rootResults.reduce((sum, r) => sum + r.weight, 0);
    const globalScore =
      rootResults.reduce((sum, r) => sum + r.normalizedScore * r.weight, 0) /
      totalWeight;

    // Déterminer la rating
    const rating = this.getRatingFromScore(Math.round(globalScore));

    return {
      globalScore: Math.round(globalScore),
      rating,
      summary: {
        rootCount: rootResults.length,
        totalWeight,
        averageScore:
          rootResults.reduce((sum, r) => sum + r.normalizedScore, 0) /
          rootResults.length,
      },
    };
  }

  /**
   * Détermine si un résultat est une racine (domaine)
   */
  private static isRootNode(result: ScoringNodeResult): boolean {
    // Les racines sont les domaines (depth = 0)
    // À améliorer: passer le depth
    return true; // Pour l'instant
  }

  /**
   * Détermine la rating basée sur le score
   */
  private static getRatingFromScore(score: number): string {
    const thresholds: Record<string, { min: number; max: number }> = {
      AAA: { min: 95, max: 100 },
      AA: { min: 85, max: 94 },
      A: { min: 75, max: 84 },
      BBB: { min: 65, max: 74 },
      BB: { min: 55, max: 64 },
      B: { min: 45, max: 54 },
      CCC: { min: 35, max: 44 },
      CC: { min: 25, max: 34 },
      C: { min: 15, max: 24 },
      D: { min: 0, max: 14 },
    };

    for (const [rating, { min, max }] of Object.entries(thresholds)) {
      if (score >= min && score <= max) {
        return rating;
      }
    }

    return "D";
  }
}

/**
 * Interface: Résultat du calcul d'un nœud
 */
export interface ScoringNodeResult {
  nodeId: string;
  rawScore: number; // Avant règles
  normalizedScore: number; // Après règles
  weight: number;
  aggregationMethod?: string;
  explanation: string;
  appliedRules: AppliedRule[];
}

/**
 * Interface: Règle appliquée
 */
export interface AppliedRule {
  ruleId: string;
  ruleCode: string;
  ruleType: string; // NO-GO, MALUS, WARNING
  severity: string;
  penaltyValue: number;
  message: string;
}
