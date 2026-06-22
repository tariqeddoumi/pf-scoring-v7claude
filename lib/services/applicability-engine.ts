import prisma from "@/lib/prisma-client";
import type { ScoringNode } from "@prisma/client";

/**
 * Applicability evaluation result
 */
export interface ApplicabilityResult {
  nodeId: string;
  visible: boolean;
  required: boolean;
  readOnly: boolean;
  excludeFromScore: boolean;
  explanation: string;
}

/**
 * Context for applicability evaluation
 */
export interface ApplicabilityContext {
  evaluationId: string;
  projectData?: Record<string, unknown>;
  evaluationData?: Record<string, unknown>;
  parentAnswers?: Map<string, unknown>;
}

/**
 * Applicability rule engine for conditional visibility and access control
 */
export class ApplicabilityEngine {
  /**
   * Evaluate applicability of all nodes for an evaluation
   */
  static async evaluateApplicabilityForVersion(
    versionId: string,
    context: ApplicabilityContext
  ): Promise<Map<string, ApplicabilityResult>> {
    const nodes = await prisma.scoringNode.findMany({
      where: { versionId },
      include: { applicabilityRules: { where: { isActive: true } } },
    });

    const results = new Map<string, ApplicabilityResult>();

    for (const node of nodes) {
      const applicability = await this.evaluateNodeApplicability(node, context);
      results.set(node.id, applicability);
    }

    return results;
  }

  /**
   * Evaluate applicability of a single node
   */
  static async evaluateNodeApplicability(
    node: ScoringNode & { applicabilityRules: Array<{ id: string; conditionExpression: string; effectType: string }> },
    context: ApplicabilityContext
  ): Promise<ApplicabilityResult> {
    // Default: node is visible and optional
    let visible = true;
    let required = node.isMandatory || false;
    let readOnly = false;
    let excludeFromScore = false;
    let explanation = "Node is applicable";

    if (!node.applicabilityRules || node.applicabilityRules.length === 0) {
      return {
        nodeId: node.id,
        visible,
        required,
        readOnly,
        excludeFromScore,
        explanation,
      };
    }

    // Evaluate rules in order (first match wins for visibility)
    for (const rule of node.applicabilityRules) {
      const triggered = await this.evaluateCondition(
        rule.conditionExpression,
        context
      );

      if (triggered) {
        switch (rule.effectType) {
          case "SHOW":
            visible = true;
            explanation = `Rule: ${rule.id} - Node shown`;
            break;

          case "HIDE":
            visible = false;
            explanation = `Rule: ${rule.id} - Node hidden`;
            break;

          case "REQUIRE":
            required = true;
            explanation = `Rule: ${rule.id} - Node required`;
            break;

          case "OPTIONAL":
            required = false;
            explanation = `Rule: ${rule.id} - Node optional`;
            break;

          case "READ_ONLY":
            readOnly = true;
            explanation = `Rule: ${rule.id} - Node read-only`;
            break;

          case "EXCLUDE_FROM_SCORE":
            excludeFromScore = true;
            explanation = `Rule: ${rule.id} - Excluded from scoring`;
            break;
        }
      }
    }

    return {
      nodeId: node.id,
      visible,
      required,
      readOnly,
      excludeFromScore,
      explanation,
    };
  }

  /**
   * Evaluate condition expression
   */
  private static async evaluateCondition(
    expression: string,
    context: ApplicabilityContext
  ): Promise<boolean> {
    if (!expression) return true; // Default: condition matches if empty

    try {
      // Build evaluation context from project and evaluation data
      const evalContext = {
        ...context.projectData,
        ...context.evaluationData,
      };

      // Simple pattern matching for common conditions
      // In production, use a safe expression evaluator

      // Pattern: field == value
      if (expression.includes("==")) {
        const [left, right] = expression.split("==").map((s) => s.trim());
        const contextValue = (evalContext as Record<string, unknown>)[left];
        return contextValue === right || contextValue === parseFloat(right);
      }

      // Pattern: field != value
      if (expression.includes("!=")) {
        const [left, right] = expression.split("!=").map((s) => s.trim());
        const contextValue = (evalContext as Record<string, unknown>)[left];
        return contextValue !== right && contextValue !== parseFloat(right);
      }

      // Pattern: field in [value1, value2]
      if (expression.includes(" in ")) {
        const [left, right] = expression.split(" in ").map((s) => s.trim());
        const contextValue = (evalContext as Record<string, unknown>)[left];
        const values = right
          .replace(/[\[\]]/g, "")
          .split(",")
          .map((s) => s.trim());
        return values.includes(String(contextValue));
      }

      // Default: evaluate as truthy
      return Boolean(evalContext);
    } catch (error) {
      console.error("Error evaluating applicability condition:", error);
      return true; // Default to showing node on error
    }
  }

  /**
   * Filter nodes to show only applicable ones
   */
  static filterApplicableNodes(
    nodes: Array<{ id: string }>,
    applicabilities: Map<string, ApplicabilityResult>
  ): Array<{ id: string }> {
    return nodes.filter((node) => {
      const applicability = applicabilities.get(node.id);
      return applicability?.visible ?? true;
    });
  }

  /**
   * Get required nodes that must have answers
   */
  static getRequiredNodes(
    applicabilities: Map<string, ApplicabilityResult>
  ): string[] {
    return Array.from(applicabilities.values())
      .filter((a) => a.visible && a.required)
      .map((a) => a.nodeId);
  }

  /**
   * Check if all required nodes have been answered
   */
  static checkRequiredAnswers(
    requiredNodeIds: string[],
    answers: Map<string, unknown>
  ): { satisfied: boolean; missingNodes: string[] } {
    const missingNodes = requiredNodeIds.filter(
      (nodeId) => !answers.has(nodeId)
    );

    return {
      satisfied: missingNodes.length === 0,
      missingNodes,
    };
  }

  /**
   * Get nodes that should be excluded from scoring
   */
  static getExcludedFromScoring(
    applicabilities: Map<string, ApplicabilityResult>
  ): string[] {
    return Array.from(applicabilities.values())
      .filter((a) => a.excludeFromScore)
      .map((a) => a.nodeId);
  }

  /**
   * Get read-only nodes (user cannot modify)
   */
  static getReadOnlyNodes(
    applicabilities: Map<string, ApplicabilityResult>
  ): string[] {
    return Array.from(applicabilities.values())
      .filter((a) => a.readOnly)
      .map((a) => a.nodeId);
  }

  /**
   * Summary of node visibility for UI rendering
   */
  static getVisibilitySummary(
    applicabilities: Map<string, ApplicabilityResult>
  ): {
    totalNodes: number;
    visibleNodes: number;
    hiddenNodes: number;
    requiredNodes: number;
    readOnlyNodes: number;
  } {
    const values = Array.from(applicabilities.values());

    return {
      totalNodes: values.length,
      visibleNodes: values.filter((a) => a.visible).length,
      hiddenNodes: values.filter((a) => !a.visible).length,
      requiredNodes: values.filter((a) => a.required && a.visible).length,
      readOnlyNodes: values.filter((a) => a.readOnly && a.visible).length,
    };
  }
}
