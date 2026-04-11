import prisma from "@/lib/prisma-client";

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  severity: "ERROR" | "CRITICAL";
  context?: any;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string;
  message: string;
  context?: any;
}

/**
 * Validation and error handling service
 */
export class ScoringValidationService {
  /**
   * Validate a scoring model version before publication
   */
  static async validateVersionForPublication(
    versionId: string
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Fetch version with all relationships
    const version = await prisma.scoringModelVersion.findUnique({
      where: { id: versionId },
      include: {
        nodes: {
          include: {
            options: true,
            ranges: true,
            applicabilityRules: true,
            documentRequirements: true,
          },
        },
        rules: true,
      },
    });

    if (!version) {
      errors.push({
        code: "VERSION_NOT_FOUND",
        message: "Version not found",
        severity: "CRITICAL",
      });
      return { valid: false, errors, warnings };
    }

    // Validate nodes
    for (const node of version.nodes) {
      // Check for leaf nodes without scoring method
      const isLeaf = !version.nodes.some((n) => n.parentNodeId === node.id);
      if (isLeaf && !node.scoringMethod) {
        errors.push({
          code: "LEAF_NODE_NO_SCORING_METHOD",
          message: `Leaf node '${node.label}' has no scoring method defined`,
          severity: "ERROR",
          context: { nodeId: node.id, nodeLabel: node.label },
        });
      }

      // Check for parent nodes without aggregation method
      const hasChildren = version.nodes.some((n) => n.parentNodeId === node.id);
      if (hasChildren && !node.aggregationMethod) {
        warnings.push({
          code: "PARENT_NODE_NO_AGGREGATION",
          message: `Parent node '${node.label}' has no aggregation method, will use default`,
          context: { nodeId: node.id, nodeLabel: node.label },
        });
      }

      // Check for option nodes without options
      if (node.answerType === "OPTION_SINGLE" && node.options.length === 0) {
        errors.push({
          code: "OPTION_NODE_NO_OPTIONS",
          message: `Option node '${node.label}' has no options defined`,
          severity: "ERROR",
          context: { nodeId: node.id, nodeLabel: node.label },
        });
      }

      // Check for range nodes without ranges
      if (node.answerType === "NUMERIC_RANGE" && node.ranges.length === 0) {
        errors.push({
          code: "RANGE_NODE_NO_RANGES",
          message: `Range node '${node.label}' has no ranges defined`,
          severity: "ERROR",
          context: { nodeId: node.id, nodeLabel: node.label },
        });
      }

      // Check for mandatory nodes
      if (
        node.isMandatory &&
        !node.applicabilityRules.some((r) => r.effectType === "SHOW")
      ) {
        warnings.push({
          code: "MANDATORY_NODE_ALWAYS_SHOWN",
          message: `Mandatory node '${node.label}' is always shown`,
          context: { nodeId: node.id, nodeLabel: node.label },
        });
      }
    }

    // Check for blocking rules
    const blockingRules = version.rules.filter(
      (r) => r.ruleType === "HARD_STOP" || r.ruleType === "NO_GO"
    );
    if (blockingRules.length > 0) {
      warnings.push({
        code: "BLOCKING_RULES_DEFINED",
        message: `Version has ${blockingRules.length} blocking rules`,
        context: { ruleCount: blockingRules.length },
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate evaluation completeness before submission
   */
  static async validateEvaluationCompleteness(
    evaluationId: string
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Fetch evaluation with answers and version
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        answers: true,
        version: {
          include: {
            nodes: {
              include: {
                applicabilityRules: true,
              },
            },
          },
        },
      },
    });

    if (!evaluation) {
      errors.push({
        code: "EVALUATION_NOT_FOUND",
        message: "Evaluation not found",
        severity: "CRITICAL",
      });
      return { valid: false, errors, warnings };
    }

    // Find required nodes
    const answeredNodeIds = new Set(evaluation.answers.map((a) => a.nodeId));
    const requiredNodes = evaluation.version.nodes.filter((n) => n.isMandatory);

    // Check for missing required answers
    for (const node of requiredNodes) {
      if (!answeredNodeIds.has(node.id)) {
        errors.push({
          code: "MISSING_REQUIRED_ANSWER",
          message: `Required node '${node.label}' has no answer`,
          severity: "ERROR",
          context: { nodeId: node.id, nodeLabel: node.label },
        });
      }
    }

    // Check for empty mandatory fields with empty answers
    for (const answer of evaluation.answers) {
      const node = evaluation.version.nodes.find((n) => n.id === answer.nodeId);
      if (node?.isMandatory) {
        const isEmpty =
          !answer.valueString &&
          !answer.valueNumber &&
          !answer.valueBoolean &&
          !answer.valueDate;

        if (isEmpty) {
          errors.push({
            code: "EMPTY_REQUIRED_FIELD",
            message: `Required field '${node.label}' is empty`,
            severity: "ERROR",
            context: { nodeId: node.id },
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate answer against node configuration
   */
  static async validateAnswer(
    nodeId: string,
    answer: any
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Fetch node
    const node = await prisma.scoringNode.findUnique({
      where: { id: nodeId },
      include: {
        options: true,
        ranges: true,
      },
    });

    if (!node) {
      errors.push({
        code: "NODE_NOT_FOUND",
        message: "Node not found",
        severity: "CRITICAL",
      });
      return { valid: false, errors, warnings };
    }

    // Validate based on answer type
    switch (node.answerType) {
      case "OPTION_SINGLE":
        if (!answer.valueString) {
          errors.push({
            code: "OPTION_REQUIRED",
            message: "Option must be selected",
            severity: "ERROR",
          });
        } else {
          const valid = node.options.some(
            (o) => o.value === answer.valueString
          );
          if (!valid) {
            errors.push({
              code: "INVALID_OPTION",
              message: `Invalid option: ${answer.valueString}`,
              severity: "ERROR",
            });
          }
        }
        break;

      case "NUMERIC_RANGE":
        if (answer.valueNumber === undefined || answer.valueNumber === null) {
          errors.push({
            code: "NUMBER_REQUIRED",
            message: "Numeric value is required",
            severity: "ERROR",
          });
        } else {
          const inRange = node.ranges.some(
            (r) =>
              answer.valueNumber >= r.minValue &&
              answer.valueNumber <= r.maxValue
          );
          if (!inRange && node.ranges.length > 0) {
            warnings.push({
              code: "VALUE_OUT_OF_RANGE",
              message: `Value ${answer.valueNumber} is outside defined ranges`,
              context: { value: answer.valueNumber },
            });
          }
        }
        break;

      case "PERCENTAGE":
        if (answer.valueNumber === undefined) {
          errors.push({
            code: "PERCENTAGE_REQUIRED",
            message: "Percentage value is required",
            severity: "ERROR",
          });
        } else if (answer.valueNumber < 0 || answer.valueNumber > 100) {
          errors.push({
            code: "INVALID_PERCENTAGE",
            message: "Percentage must be between 0 and 100",
            severity: "ERROR",
          });
        }
        break;

      case "BOOLEAN":
        if (answer.valueBoolean === undefined || answer.valueBoolean === null) {
          errors.push({
            code: "BOOLEAN_REQUIRED",
            message: "Boolean value is required",
            severity: "ERROR",
          });
        }
        break;

      case "DATE":
        if (!answer.valueDate) {
          errors.push({
            code: "DATE_REQUIRED",
            message: "Date value is required",
            severity: "ERROR",
          });
        } else {
          try {
            new Date(answer.valueDate);
          } catch {
            errors.push({
              code: "INVALID_DATE",
              message: "Invalid date format",
              severity: "ERROR",
            });
          }
        }
        break;

      case "TEXT":
      case "LONG_TEXT":
        if (!answer.valueString && node.isMandatory) {
          errors.push({
            code: "TEXT_REQUIRED",
            message: "Text is required",
            severity: "ERROR",
          });
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate model consistency (no circular dependencies, etc)
   */
  static async validateModelConsistency(
    modelId: string
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Fetch all versions of the model
    const versions = await prisma.scoringModelVersion.findMany({
      where: { modelId },
    });

    if (versions.length === 0) {
      errors.push({
        code: "NO_VERSIONS",
        message: "Model has no versions",
        severity: "ERROR",
      });
    }

    // Check for published versions
    const publishedVersions = versions.filter((v) => v.status === "PUBLISHED");
    if (publishedVersions.length === 0) {
      warnings.push({
        code: "NO_PUBLISHED_VERSION",
        message: "Model has no published version",
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
