import prisma from "@/lib/prisma-client";
import { ModelLoader, ModelTree, NodeMeta } from "./model-loader";
import { ScoreCalculator, AggregationEngine } from "./score-calculator";
import { ValueResolver, ResolvedValueSnapshot } from "./value-resolver";
import { BindingResolver, BindingContext } from "./binding-resolver";
import { resolveSectorWeighting, SectorWeighting } from "./sectorial";
import { evaluateCondition, ConditionContext } from "./condition-evaluator";
import {
  BAREME_REPLI,
  RatingResolution,
  RatingSource,
  resolveRatingFromBands,
} from "./rating-scale";
import { buildConditionContext, buildCriteresContext } from "./condition-context";
import { actionRegle, bloquePublication, estBloquante } from "./rule-vocabulary";
import { getRatingScales } from "@/lib/services/scoring-configuration-service";
import { choisirValeur, type OrigineValeur } from "./value-selection";
import {
  getDomainGranularity,
  GRANULARITY_DEPTH,
  isSectorialEnabled,
} from "@/lib/services/scoring-config-service";

export interface RuleImpact {
  ruleId: string;
  ruleCode: string;
  ruleType: string;
  severity: string;
  actionType: string;
  penalty: number;
  blocking: boolean;
  message: string;
}

/** A rule whose condition could not be evaluated — surfaced, never silently skipped. */
export interface RuleDiagnostic {
  ruleId: string;
  ruleCode: string;
  nodeCode: string;
  expression: string;
  reason: string;
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

export interface SectorialTrace {
  applied: boolean;
  sectorCode: string;
  sectorLabel: string;
  /** Base global score before sectorial reweighting */
  baseScore: number;
  /** Global score after sectorial domain reweighting */
  adjustedScore: number;
  /** domainCode → applied weight factor */
  weightFactors: Record<string, number>;
  redFlags: Array<{
    code: string;
    description: string;
    isNoGo: boolean;
    penalty: number | null;
    effet: "INFORMATION";
  }>;
  stressTests: Array<{ code: string; description: string; effet: "INFORMATION" }>;
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
  /** True when a NO_GO or HARD_STOP rule fired: the score cannot authorise approval. */
  blocked: boolean;
  blockingRuleCodes: string[];
  /** True when a BLOCK_PUBLICATION rule fired. */
  publicationBlocked: boolean;
  /** Rules skipped because their condition could not be evaluated. */
  ruleDiagnostics: RuleDiagnostic[];
  /** Critères obligatoires sans donnée réelle (absente, ou seulement une valeur par défaut). */
  donneesObligatoiresManquantes: string[];
  /** Règles bloquantes (NO_GO, HARD_STOP) dont la condition n'a pas pu être évaluée. */
  reglesCritiquesNonEvaluees: string[];
  /** Critères notés sur une valeur par défaut ou de repli, et non sur une donnée de la source. */
  valeursParDefaut: string[];
  /** Dérogations approuvées appliquées : note calculée et note retenue. */
  derogations: Derogation[];
  /** Vrai si une donnée obligatoire ou une règle critique manque : la note est provisoire. */
  incomplet: boolean;
  /** D'où vient la note : "referentiel" (table paramétrable) ou "repli" (barème codé). */
  ratingSource: RatingSource;
  /** Renseigné lorsque le score tombe dans un interstice du barème. */
  ratingWarning?: string;
  /** Present when sectorial calibration is enabled and a sector matched. */
  sectorial?: SectorialTrace;
}

export interface Derogation {
  overrideId: string;
  nodeCode: string;
  scoreCalcule: number;
  scoreRetenu: number;
  motif: string;
  approuvePar: string | null;
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

    // Seules les dérogations APPROUVÉES modifient une note ; une dérogation en attente
    // n'a aucun effet. Le score calculé et le score retenu sont tous deux tracés.
    const derogationsApprouvees = await prisma.scoringOverride.findMany({
      where: { evaluationId, status: "APPROVED" },
    });
    const derogationParNode = new Map(derogationsApprouvees.map((o) => [o.nodeId, o]));
    const derogations: Derogation[] = [];
    const donneesObligatoiresManquantes: string[] = [];
    const reglesCritiquesNonEvaluees: string[] = [];
    const valeursParDefaut: string[] = [];
    // Instantané des entrées réellement utilisées : critère, valeur, origine.
    const entrees: Array<{ code: string; valeur: unknown; origine: OrigineValeur }> = [];

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
    const reglesOrphelines: typeof allRules = [];
    for (const rule of allRules) {
      // Une règle sans critère de rattachement était écartée sans un mot : active en
      // base, visible à l'administration, et jamais évaluée.
      if (!rule.nodeId) {
        reglesOrphelines.push(rule);
        continue;
      }
      const list = rulesByNode.get(rule.nodeId) || [];
      list.push(rule);
      rulesByNode.set(rule.nodeId, list);
    }

    // Granularity: per-domain score-entry level (DOMAIN/CRITERION/SUB_CRITERION).
    // A node is treated as a scoring leaf when its depth reaches the configured
    // leaf depth of its root domain; otherwise it aggregates its children.
    // When a domain has no explicit config, behaviour is unchanged (uses isScored).
    const domainGranularity = await getDomainGranularity();
    const rootCodeByNode = this.buildRootCodeMap(tree);
    const effectiveLeafIds = new Set<string>();

    const nodeScores = new Map<string, NodeResult>();
    const triggeredRuleIds: string[] = [];
    let malusTotal = 0;
    const blockingRuleCodes: string[] = [];
    const ruleDiagnostics: RuleDiagnostic[] = [];
    let publicationBlocked = false;

    ModelLoader.traverseBottomUp(tree, (node) => {
      const answer = answersByNode.get(node.id);
      const binding = resolvedBindings.get(node.id);

      // Priorité saisie / donnée automatique selon le mode : voir value-selection.ts.
      const choix = choisirValeur(answer, binding);
      const origine: OrigineValeur = choix.origine;
      let valueSnapshot: ResolvedValueSnapshot | undefined;
      if (origine !== "AUCUNE") {
        valueSnapshot = ValueResolver.resolveValue(choix.valeur, binding);
      }

      // Decide whether this node is a scoring leaf (read its answer) or an
      // aggregator (combine children). Per-domain granularity overrides the
      // default isScored-based behaviour when configured.
      const rootCode = rootCodeByNode.get(node.id);
      const configuredLevel = rootCode ? domainGranularity[rootCode] : undefined;
      let treatAsLeaf: boolean;
      let treatAsAggregator: boolean;
      if (configuredLevel) {
        const leafDepth = GRANULARITY_DEPTH[configuredLevel];
        treatAsLeaf = node.depth >= leafDepth;
        treatAsAggregator = !treatAsLeaf && node.childrenCount > 0;
      } else {
        treatAsLeaf = node.isScored;
        treatAsAggregator = !node.isScored && node.childrenCount > 0;
      }
      if (treatAsLeaf) effectiveLeafIds.add(node.id);

      let rawScore = 0;
      let explanation = "";

      if (treatAsLeaf && valueSnapshot) {
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
        // Le barème du critère est exprimé sur l'échelle qu'il déclare (0–10 pour la
        // grille V7++) ; le moteur, le barème de notation et l'affichage travaillent
        // sur 0–100. La conversion a lieu ici, une fois, au seul endroit où une
        // valeur entre dans le calcul depuis le paramétrage.
        rawScore = AggregationEngine.rescaleTo100(
          scoreOut.rawScore,
          node.scoreMin,
          node.scoreMax
        );
        explanation = scoreOut.explanation;
        if (origine === "DEFAUT") {
          valeursParDefaut.push(node.code);
          explanation += " — valeur par défaut, non issue de la source";
        }
      }

      if (treatAsLeaf) {
        entrees.push({ code: node.code, valeur: choix.valeur ?? null, origine });
        // Une donnée obligatoire absente n'est ni un zéro « normal » ni une non-
        // applicabilité : la note devient provisoire et la décision est bloquée.
        if (node.isMandatory && (origine === "AUCUNE" || origine === "DEFAUT")) {
          donneesObligatoiresManquantes.push(node.code);
        }
        const derogation = derogationParNode.get(node.id);
        if (derogation && derogation.overriddenScore !== null && derogation.overriddenScore !== undefined) {
          const retenu = Math.max(0, Math.min(100, derogation.overriddenScore));
          derogations.push({
            overrideId: derogation.id,
            nodeCode: node.code,
            scoreCalcule: rawScore,
            scoreRetenu: retenu,
            motif: derogation.reason,
            approuvePar: derogation.approvedBy,
          });
          explanation += ` — dérogation approuvée : ${rawScore.toFixed(1)} → ${retenu.toFixed(1)}`;
          rawScore = retenu;
        }
      } else if (treatAsAggregator) {
        const childIds = tree.childrenOf.get(node.id) || [];
        const children = childIds.map((id) => nodeScores.get(id)).filter(Boolean) as NodeResult[];
        try {
          rawScore = AggregationEngine.aggregate(
            node.aggregationMethod ?? undefined,
            children as any
          );
        } catch (e) {
          throw new Error(
            `Nœud « ${node.code} » : ${e instanceof Error ? e.message : String(e)}`
          );
        }
        explanation = `Aggregated ${children.length} children using ${node.aggregationMethod || "AVERAGE"}`;
      }

      // FIX 2: weights are fractions (0.0-1.0), no /100 division needed
      const weight = node.weight ?? null;
      const weightedScore = weight !== null ? rawScore * weight : rawScore;

      // Les règles sont évaluées après la traversée, une fois tous les nœuds notés :
      // une condition peut ainsi interroger n'importe quel critère du modèle, et pas
      // seulement ceux que l'ordre de parcours a déjà rencontrés.
      const ruleImpacts: RuleImpact[] = [];

      // Tous les scores du moteur sont désormais sur 0–100, les feuilles ayant été
      // converties depuis leur échelle déclarée : la normalisation divise donc par 100
      // et non par le scoreMax du nœud, qui vaut 10 pour un critère de la grille.
      const normalizedScore = AggregationEngine.normalize(rawScore, 100);

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

    // --- Seconde passe : évaluation des règles ---------------------------------
    for (const rule of reglesOrphelines) {
      ruleDiagnostics.push({
        ruleId: rule.id,
        ruleCode: rule.code,
        nodeCode: "—",
        expression: rule.conditionExpression ?? "",
        reason:
          "règle rattachée à aucun critère : le moteur ne sait pas quand l'évaluer",
      });
    }

    // Le contexte est construit une fois, complet, et partagé par toutes les règles.
    const criteres = buildCriteresContext({
      nodes: Array.from(tree.nodesById.values()),
      nodeScores,
      answersByNode,
      optionsByNode,
    });

    for (const [nodeId, rules] of rulesByNode) {
      const resultat = nodeScores.get(nodeId);
      const node = tree.nodesById.get(nodeId);
      if (!resultat || !node) continue;

      const conditionCtx: ConditionContext = buildConditionContext({
        score: resultat.rawScore,
        node: { code: node.code, label: node.label, depth: node.depth },
        project: evaluation.project as Record<string, unknown> | null,
        evaluation: evaluation as unknown as Record<string, unknown>,
        malusTotal,
        criteres,
      });

      for (const rule of rules) {
        const verdict = evaluateCondition(rule.conditionExpression, conditionCtx);

        if (!verdict.evaluated) {
          // Une règle bloquante non évaluable ne cesse pas de protéger la décision.
          if (estBloquante(rule)) reglesCritiquesNonEvaluees.push(rule.code);
          ruleDiagnostics.push({
            ruleId: rule.id,
            ruleCode: rule.code,
            nodeCode: node.code,
            expression: rule.conditionExpression ?? "",
            reason: verdict.reason ?? "expression non évaluable",
          });
          continue;
        }
        if (!verdict.triggered) continue;

        const isBlocking = estBloquante(rule);
        const penalty = actionRegle(rule.actionType)?.exigeMalus
          ? (rule.penaltyValue ?? 0)
          : 0;

        resultat.ruleImpacts.push({
          ruleId: rule.id,
          ruleCode: rule.code,
          ruleType: rule.ruleType,
          severity: rule.severity,
          actionType: rule.actionType,
          penalty,
          blocking: isBlocking,
          message: rule.messageUser || rule.label,
        });
        triggeredRuleIds.push(rule.id);

        if (penalty) malusTotal += penalty;
        if (isBlocking) blockingRuleCodes.push(rule.code);
        if (bloquePublication(rule)) publicationBlocked = true;
      }
    }

    const rootResults: NodeResult[] = [];
    for (const rootId of tree.rootNodeIds) {
      const root = nodeScores.get(rootId);
      if (root) {
        // Prune below effective leaves so the trace reflects the active granularity.
        root.childResults = effectiveLeafIds.has(rootId)
          ? []
          : this.buildResultTree(rootId, nodeScores, tree, effectiveLeafIds);
        rootResults.push(root);
      }
    }

    // Sectorial calibration: when enabled and a sector matches the project,
    // reweight the domains using the sector's weight FACTORS (multipliers).
    const sectorialOn = await isSectorialEnabled();
    let sectorWeighting: SectorWeighting | null = null;
    if (sectorialOn) {
      sectorWeighting = await resolveSectorWeighting(evaluation.project?.secteur);
    }
    // Calibrage sectoriel actif mais aucun profil pour le secteur du projet : la note
    // n'est pas finalisable (pondération de base appliquée sans le dire auparavant).
    const profilSectorielManquant = sectorialOn && !sectorWeighting;
    const factorFor = (code: string): number =>
      sectorWeighting?.weightFactors.get(code) ?? 1;

    // FIX 3: finalScore = weighted average across ALL domains.
    // Sectorial factors multiply each domain's base weight (no effect when null/1).
    const baseTotalWeight = rootResults.reduce((s, r) => s + (r.weight ?? 0), 0);
    const baseRawFinal =
      baseTotalWeight > 0
        ? rootResults.reduce((s, r) => s + r.rawScore * (r.weight ?? 0), 0) / baseTotalWeight
        : rootResults.reduce((s, r) => s + r.weightedScore, 0);

    const adjTotalWeight = rootResults.reduce(
      (s, r) => s + (r.weight ?? 0) * factorFor(r.code),
      0
    );
    const adjRawFinal =
      adjTotalWeight > 0
        ? rootResults.reduce(
            (s, r) => s + r.rawScore * (r.weight ?? 0) * factorFor(r.code),
            0
          ) / adjTotalWeight
        : baseRawFinal;

    const rawFinalScore = sectorWeighting ? adjRawFinal : baseRawFinal;
    const finalScoreAdjusted = Math.max(0, Math.min(100, rawFinalScore - malusTotal));
    const ratingResolution = await this.resolveRating(finalScoreAdjusted);

    let sectorial: SectorialTrace | undefined;
    if (sectorWeighting) {
      sectorial = {
        applied: true,
        sectorCode: sectorWeighting.code,
        sectorLabel: sectorWeighting.label,
        baseScore: Math.max(0, Math.min(100, baseRawFinal - malusTotal)),
        adjustedScore: finalScoreAdjusted,
        weightFactors: Object.fromEntries(
          rootResults.map((r) => [r.code, factorFor(r.code)])
        ),
        redFlags: sectorWeighting.redFlags,
        stressTests: sectorWeighting.stressTests,
      };
    }

    // Paquet de reproductibilité : paramètres globaux lus pour CE calcul (ils ne sont
    // pas versionnés avec le modèle) et entrées utilisées, avec leurs empreintes. Deux
    // calculs aux empreintes identiques doivent donner le même résultat ; une
    // empreinte différente explique un écart (paramètre modifié, donnée source changée).
    let bareme: unknown = null;
    try {
      bareme = (await getRatingScales()).map((b) => ({ label: b.label, min: b.minScore, max: b.maxScore }));
    } catch {
      bareme = "illisible";
    }
    const parametres = {
      modelVersionId: evaluation.modelVersionId,
      granularite: domainGranularity,
      sectorielActif: sectorialOn,
      secteurProjet: evaluation.project?.secteur ?? null,
      bareme,
    };
    const { createHash } = await import("crypto");
    const empreinte = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
    const reproductibilite = {
      calculeLe: new Date().toISOString(),
      parametres,
      empreinteParametres: empreinte(parametres),
      entrees,
      empreinteEntrees: empreinte(entrees),
    };

    const blocked = blockingRuleCodes.length > 0;
    const incomplet =
      donneesObligatoiresManquantes.length > 0 ||
      reglesCritiquesNonEvaluees.length > 0 ||
      profilSectorielManquant;
    const traceJson = JSON.stringify(
      {
        rootResults,
        sectorial,
        blockingRuleCodes,
        incomplet,
        profilSectorielManquant,
        donneesObligatoiresManquantes,
        reglesCritiquesNonEvaluees,
        valeursParDefaut,
        derogations,
        reproductibilite,
        // conservé dans la trace : les contrôles de décision le relisent
        publicationBlocked,
        ruleDiagnostics,
        rating: ratingResolution,
      },
      null,
      2
    );

    return {
      evaluationId,
      modelVersionId: evaluation.modelVersionId,
      finalScore: finalScoreAdjusted,
      rating: ratingResolution.rating,
      ratingSource: ratingResolution.source,
      ratingWarning: ratingResolution.warning,
      recommendation: blocked
        ? `Blocage — condition rédhibitoire déclenchée (${blockingRuleCodes.join(", ")})`
        : incomplet
          ? "Provisoire — données obligatoires ou règles critiques indisponibles"
          : await this.avisIndicatif(ratingResolution.rating),
      malusTotal,
      rootResults,
      traceJson,
      triggeredRuleIds,
      blocked,
      blockingRuleCodes,
      publicationBlocked,
      ruleDiagnostics,
      donneesObligatoiresManquantes,
      reglesCritiquesNonEvaluees,
      valeursParDefaut,
      derogations,
      incomplet,
      sectorial,
    };
  }

  /**
   * Map every node id to the code of its root (depth-0) domain ancestor.
   * Used to look up per-domain granularity configuration.
   */
  private static buildRootCodeMap(tree: ModelTree): Map<string, string> {
    const rootCodeByNode = new Map<string, string>();
    for (const node of tree.nodesById.values()) {
      let current: NodeMeta | undefined = node;
      const guard = new Set<string>();
      while (current && current.parentNodeId && !guard.has(current.id)) {
        guard.add(current.id);
        current = tree.nodesById.get(current.parentNodeId);
      }
      if (current) rootCodeByNode.set(node.id, current.code);
    }
    return rootCodeByNode;
  }

  private static buildResultTree(
    nodeId: string,
    nodeScores: Map<string, NodeResult>,
    tree: ModelTree,
    effectiveLeafIds?: Set<string>
  ): NodeResult[] {
    const children: NodeResult[] = [];
    const childIds = tree.childrenOf.get(nodeId) || [];
    for (const childId of childIds) {
      const child = nodeScores.get(childId);
      if (child) {
        // Stop at effective leaves so granularity-truncated branches aren't shown.
        child.childResults =
          effectiveLeafIds && effectiveLeafIds.has(childId)
            ? []
            : this.buildResultTree(childId, nodeScores, tree, effectiveLeafIds);
        children.push(child);
      }
    }
    return children;
  }

  /**
   * Convertit le score en note via le barème paramétrable.
   *
   * Le barème vit en base (BP_PF_v7pp_rating_scales) et se modifie sans redéploiement.
   * Le barème codé n'intervient que si la table est vide : une base non initialisée
   * conserve alors l'ancien comportement au lieu de produire « D » pour tout le monde.
   */
  private static async resolveRating(score: number): Promise<RatingResolution> {
    try {
      const scales = await getRatingScales();
      if (scales.length > 0) {
        return resolveRatingFromBands(
          score,
          scales.map((s) => ({
            rating: s.label,
            minScore: Number(s.minScore),
            maxScore: Number(s.maxScore),
          })),
          "referentiel"
        );
      }
    } catch (e) {
      // Le référentiel est indisponible : on note quand même, en le disant.
      return {
        ...resolveRatingFromBands(score, BAREME_REPLI, "repli"),
        warning: `référentiel illisible (${e instanceof Error ? e.message : String(e)})`,
      };
    }
    return {
      ...resolveRatingFromBands(score, BAREME_REPLI, "repli"),
      warning: "référentiel de notation vide",
    };
  }

  /**
   * Avis indicatif lié au grade. Il était tiré de seuils codés (80, 60, 40)
   * indépendants du barème paramétrable : modifier le barème ne changeait pas l'avis.
   * Il reprend désormais la description du grade dans le barème ; le grade mesure le
   * risque, la décision relève du circuit de validation.
   */
  private static async avisIndicatif(rating: string): Promise<string> {
    try {
      const echelle = (await getRatingScales()).find((s) => s.label === rating);
      if (echelle?.description) return `Grade ${rating} — ${echelle.description}`;
    } catch {
      // barème illisible : avis neutre ci-dessous
    }
    return `Grade ${rating} — avis à rendre par le circuit de validation`;
  }

  /**
   * Enregistre le résultat en UNE transaction : résumé et résultats par nœud. Le
   * résumé était écrit avant la transaction des nœuds ; une panne entre les deux
   * laissait un score récent avec des détails anciens. Chaque calcul est en outre
   * journalisé (score, note, empreinte de la trace) : l'historique n'est plus écrasé.
   */
  static async persistTrace(trace: EvaluationTrace, auteur: string | null = null): Promise<void> {
    const results: Array<{ evaluationId: string; nodeId: string; data: NodeResult }> = [];
    const collectResults = (nodes: NodeResult[]) => {
      for (const node of nodes) {
        results.push({ evaluationId: trace.evaluationId, nodeId: node.nodeId, data: node });
        if (node.childResults) collectResults(node.childResults);
      }
    };
    collectResults(trace.rootResults);

    const { createHash } = await import("crypto");
    const empreinte = createHash("sha256").update(trace.traceJson).digest("hex");

    await prisma.$transaction([
      prisma.scoringEvaluation.update({
        where: { id: trace.evaluationId },
        data: {
          finalScore: trace.finalScore,
          rating: trace.rating,
          recommendation: trace.recommendation,
          malusTotal: trace.malusTotal,
          triggeredRulesJson: JSON.stringify(trace.triggeredRuleIds),
          summaryJson: trace.traceJson,
        },
      }),
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
      prisma.scoringChangeLog.create({
        data: {
          entityType: "ScoringEvaluation",
          entityId: trace.evaluationId,
          evaluationId: trace.evaluationId,
          versionId: trace.modelVersionId,
          action: "SCORING_RUN",
          newValueJson: JSON.stringify({
            finalScore: trace.finalScore,
            rating: trace.rating,
            blocked: trace.blocked,
            incomplet: trace.incomplet,
            empreinteTrace: empreinte,
          }),
          changedBy: auteur,
          comment: "Calcul de la note",
        },
      }),
    ]);
  }
}
