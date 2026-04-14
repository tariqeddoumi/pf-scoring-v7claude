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
 *
 * ## Flux d'exécution
 *
 * 1. **Charger les nœuds**: Récupère toute la structure hiérarchique
 * 2. **Charger les réponses**: Obtient les réponses utilisateur
 * 3. **Construire l'arbre**: Crée la structure parent-enfant
 * 4. **Scorer récursivement**: Calcule de bas en haut (feuilles → parents)
 *    - Nœuds feuilles: basé sur la réponse et scoringMethod
 *    - Nœuds parents: agrégation des enfants via aggregationMethod
 * 5. **Appliquer les règles**: NO-GO, MALUS, WARNING avec pénalités
 * 6. **Stocker les résultats**: Détail par nœud en base de données
 * 7. **Calculer le score final**: Score global et rating (AAA-D)
 *
 * ## Scoring Methods (à la feuille)
 *
 * - **OPTION_SCORE**: Cherche le score dans les options (choix multiple)
 * - **RANGE_SCORE**: Trouve la plage correspondant à la valeur numérique
 * - **NUMERIC_DIRECT**: Utilise directement la valeur comme score (0-100)
 * - **MANUAL_SCORE**: Utilise le score saisi manuellement par l'analyste
 * - **FORMULA**: Évalue selon une formule (futur)
 *
 * ## Aggregation Methods (aux parents)
 *
 * - **WEIGHTED_AVERAGE**: Moyenne pondérée des enfants
 * - **SIMPLE_AVERAGE**: Moyenne simple
 * - **SUM**: Somme (peut dépasser 100)
 * - **MIN**: Minimum
 * - **MAX**: Maximum
 *
 * ## Évaluation des Règles
 *
 * - **NO-GO**: Règle disqualifiante (déclenchée si score < seuil)
 * - **MALUS**: Pénalité (réduit le score du montant de penaltyValue)
 * - **WARNING**: Informationnel (aucun impact sur le score)
 *
 * ## Exemple d'Arbre de Scoring
 *
 * ```
 * Risque Financier (80 pts, weight=1)
 *   ├─ Liquidité (85 pts, weight=0.5)
 *   │  ├─ Current Ratio (90 pts)
 *   │  └─ Quick Ratio (80 pts)
 *   └─ Levier (75 pts, weight=0.5)
 *      ├─ Debt/Equity (70 pts) [MALUS -10: dette > 3x]
 *      └─ Debt/EBITDA (80 pts)
 *
 * Calcul:
 *   Liquidité = (90 + 80) / 2 = 85
 *   Levier = (70 + 80) / 2 = 75
 *   Risque = (85×0.5 + 75×0.5) / 1 = 80
 * ```
 */
export class GenericScoringEngine {
  /**
   * Lance le calcul complet du scoring pour une évaluation
   *
   * Orchestre tout le flux:
   * 1. Charge les nœuds et réponses
   * 2. Construit l'arbre hiérarchique
   * 3. Calcule récursivement les scores
   * 4. Applique les règles
   * 5. Stocke les résultats
   * 6. Calcule le score final et la rating
   *
   * @param evaluationId - ID de l'évaluation à scorer
   * @param modelVersionId - ID de la version du modèle de scoring
   * @returns Objet contenant:
   *   - evaluationId: ID de l'évaluation
   *   - modelVersionId: Version utilisée
   *   - globalScore: Score final (0-100)
   *   - rating: Rating (AAA-D)
   *   - results: Map des résultats par nœud
   *   - summary: Résumé des domaines
   *   - timestamp: Moment du calcul
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
   *
   * Récupère l'arborescence complète incluant:
   * - Structure parent-enfant via parentNodeId
   * - Options (pour OPTION_SCORE)
   * - Plages numériques (pour RANGE_SCORE)
   * - Règles (NO-GO, MALUS, WARNING)
   * - Formules (pour FORMULA)
   *
   * Les nœuds sont triés par depth puis orderIndex pour traitement prévisible.
   *
   * @param modelVersionId - ID de la version du modèle
   * @returns Array de nœuds avec toutes leurs relations chargées
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
   *
   * Récupère les réponses utilisateur associées à chaque nœud.
   * Une réponse peut contenir:
   * - valueString: pour choix multiples
   * - valueNumber: pour valeurs numériques/plages
   * - valueBoolean: pour questions booléennes
   * - valueDate: pour dates
   * - valueJson: pour données complexes
   * - manualScore: pour scores saisis manuellement
   *
   * @param evaluationId - ID de l'évaluation
   * @returns Array de réponses avec nœud et type de réponse
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
   *
   * Implémente l'algorithme depth-first: score les enfants d'abord,
   * puis remonte pour scorer les parents.
   *
   * Flux:
   * 1. **Récursion**: Scorer tous les enfants (profondeur d'abord)
   * 2. **Évaluation**: Score le nœud courant basé sur ses enfants ou sa réponse
   * 3. **Règles**: Applique les règles (NO-GO, MALUS, WARNING)
   * 4. **Stockage**: Enregistre le résultat en base
   * 5. **Retour**: Remonte le résultat au parent
   *
   * @param node - Nœud avec enfants pré-chargés
   * @param allNodes - Tous les nœuds (pour contexte)
   * @param answers - Map de réponses par nodeId
   * @param results - Map en cours de résultats
   * @param evaluationId - ID de l'évaluation
   * @returns Résultat du scoring du nœud
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
   *
   * Combine les scores des enfants selon la méthode spécifiée dans le nœud:
   *
   * - **WEIGHTED_AVERAGE**: Moyenne pondérée (enfants avec poids différents)
   *   Formule: Σ(score × weight) / Σweight
   *   Usage: Domaines avec importance différente
   *
   * - **SIMPLE_AVERAGE**: Moyenne simple (tous les enfants égaux)
   *   Formule: Σscore / count
   *   Usage: Dimensions parallèles sans hiérarchie
   *
   * - **SUM**: Somme directe (pour métriques accumulatives)
   *   Usage: Budgets, quantités (peut dépasser 100)
   *
   * - **MIN**: Prend le pire score (critère de sécurité)
   *   Usage: Conformité (un échec = évaluation échoue)
   *
   * - **MAX**: Prend le meilleur score
   *   Usage: Opportunités, capacités maximales
   *
   * Le résultat est toujours clamped à [0, 100] sauf pour SUM.
   *
   * @param parentNode - Nœud parent (contient aggregationMethod)
   * @param childResults - Scores des enfants à agréger
   * @returns Résultat du nœud parent avec score agrégé
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
   *
   * Un nœud feuille n'a pas d'enfants et son score est déterminé par:
   * 1. La réponse fournie par l'utilisateur
   * 2. La méthode de scoring du nœud (scoringMethod)
   * 3. La configuration du nœud (options, plages, etc.)
   *
   * Méthodes supportées:
   * - **OPTION_SCORE**: Réponse choix → lookup dans node.options → score
   * - **RANGE_SCORE**: Réponse numérique → lookup dans node.ranges → score
   * - **NUMERIC_DIRECT**: Réponse numérique utilisée directement (0-100)
   * - **MANUAL_SCORE**: Score saisi manuellement par l'analyste
   * - **FORMULA**: Évaluation via formule (futur: nécessite expression parser)
   *
   * Si aucune réponse n'existe → rawScore = 0
   *
   * @param node - Nœud feuille avec scoringMethod et configuration
   * @param answer - Réponse utilisateur (peut être undefined)
   * @returns Résultat du nœud avec rawScore calculé
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
   *
   * Évalue si chaque règle du nœud s'applique et les enregistre.
   * Les règles peuvent:
   *
   * - **NO-GO**: Disqualifiante (ex: License manquante)
   *   - Déclenchée si condition vraie
   *   - Severity: CRITICAL
   *   - Pénalité: grande (ex: -100 points)
   *
   * - **MALUS**: Pénalité (ex: Dépôt insuffisant)
   *   - Réduit le score de penaltyValue
   *   - Severity: MEDIUM
   *   - Pénalité: modérée (ex: -15 points)
   *
   * - **WARNING**: Informationnel (ex: Premier emprunteur)
   *   - Aucune pénalité
   *   - Severity: LOW
   *   - Pénalité: 0
   *
   * Les pénalités sont appliquées via applyRuleImpacts() après évaluation.
   *
   * @param node - Nœud avec règles configurées
   * @param nodeScore - Score du nœud avant règles
   * @returns Array de règles applicables (pré-pénalités)
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
