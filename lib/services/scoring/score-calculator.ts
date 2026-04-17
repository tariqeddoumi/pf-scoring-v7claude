import prisma from "@/lib/prisma-client";

/**
 * Score calculator - evaluates individual nodes based on answers and rules.
 * Computes raw, weighted, and normalized scores.
 */

export interface ScoreInputs {
  answer: string | number | boolean | null;
  options?: Array<{ value: string; score: number }>;
  ranges?: Array<{ min: number; max: number; score: number }>;
  formula?: { expression: string; variables: Record<string, unknown> };
}

export interface ScoreOutput {
  rawScore: number;
  explanation: string;
}

export class ScoreCalculator {
  /**
   * Match an answer against options to get score.
   */
  static scoreFromOptions(
    answer: unknown,
    options: Array<{ value: string; score: number }>
  ): ScoreOutput {
    const answerStr = String(answer).trim();
    for (const opt of options) {
      if (opt.value === answerStr) {
        return {
          rawScore: opt.score,
          explanation: `Matched option "${opt.value}" → score ${opt.score}`,
        };
      }
    }
    return { rawScore: 0, explanation: `No option match for "${answerStr}"` };
  }

  /**
   * Match a numeric answer against ranges to get score.
   */
  static scoreFromRanges(
    answer: unknown,
    ranges: Array<{ min: number; max: number; score: number }>
  ): ScoreOutput {
    const num = Number(answer);
    if (isNaN(num)) {
      return { rawScore: 0, explanation: `Cannot convert "${answer}" to number` };
    }
    for (const r of ranges) {
      if (num >= r.min && num <= r.max) {
        return {
          rawScore: r.score,
          explanation: `Value ${num} in range [${r.min}, ${r.max}] → score ${r.score}`,
        };
      }
    }
    return {
      rawScore: 0,
      explanation: `Value ${num} outside all ranges`,
    };
  }

  /**
   * Evaluate a formula with variables.
   * Basic expression parsing: supports +, -, *, /, parentheses.
   */
  static scoreFromFormula(
    expression: string,
    variables: Record<string, unknown>,
    fallback: number = 0
  ): ScoreOutput {
    try {
      let expr = expression;
      for (const [key, value] of Object.entries(variables)) {
        const val = Number(value);
        if (!isNaN(val)) {
          expr = expr.replace(new RegExp(`\\b${key}\\b`, "g"), String(val));
        }
      }
      // Simple evaluation (in production use a safe math evaluator)
      // eslint-disable-next-line no-eval
      const result = eval(expr);
      const score = Number(result);
      if (isNaN(score)) throw new Error("Result is NaN");
      return {
        rawScore: score,
        explanation: `Formula "${expression}" evaluated to ${score}`,
      };
    } catch (err) {
      return {
        rawScore: fallback,
        explanation: `Formula evaluation failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Route to the appropriate scoring method.
   */
  static score(inputs: ScoreInputs, fallback: number = 0): ScoreOutput {
    if (inputs.answer == null) {
      return { rawScore: fallback, explanation: "No answer provided" };
    }

    if (inputs.options && inputs.options.length > 0) {
      return this.scoreFromOptions(inputs.answer, inputs.options);
    }

    if (inputs.ranges && inputs.ranges.length > 0) {
      return this.scoreFromRanges(inputs.answer, inputs.ranges);
    }

    if (inputs.formula) {
      return this.scoreFromFormula(inputs.formula.expression, inputs.formula.variables, fallback);
    }

    return { rawScore: fallback, explanation: "No scoring method available" };
  }
}

/**
 * Aggregation engine - combines child scores into parent scores.
 * Supports: SUM, WEIGHTED_SUM, AVERAGE, WEIGHTED_AVERAGE, MIN, MAX, COUNT.
 */

export interface NodeScoreData {
  nodeId: string;
  rawScore: number;
  weight?: number;
  isScored?: boolean;
  isTerminal?: boolean;
  children?: NodeScoreData[];
}

export class AggregationEngine {
  /**
   * Aggregate child scores using the specified method.
   */
  static aggregate(
    method: string | undefined,
    children: NodeScoreData[],
    totalWeight: number = 1
  ): number {
    if (!children || children.length === 0) return 0;

    const method_ = (method || "SUM").toUpperCase();
    switch (method_) {
      case "SUM":
        return children.reduce((sum, c) => sum + c.rawScore, 0);

      case "WEIGHTED_SUM": {
        let sum = 0;
        for (const c of children) {
          const w = c.weight ?? 1;
          sum += c.rawScore * w;
        }
        return sum;
      }

      case "AVERAGE":
        return children.reduce((sum, c) => sum + c.rawScore, 0) / children.length;

      case "WEIGHTED_AVERAGE": {
        let sum = 0;
        let wsum = 0;
        for (const c of children) {
          const w = c.weight ?? 1;
          sum += c.rawScore * w;
          wsum += w;
        }
        return wsum > 0 ? sum / wsum : 0;
      }

      case "MIN":
        return Math.min(...children.map((c) => c.rawScore));

      case "MAX":
        return Math.max(...children.map((c) => c.rawScore));

      case "COUNT":
        return children.length;

      default:
        return 0;
    }
  }

  /**
   * Recursively compute weighted scores using hierarchy.
   */
  static computeWeighted(node: NodeScoreData, totalWeight: number = 100): number {
    const nodeWeight = node.weight ?? totalWeight;
    return (node.rawScore * nodeWeight) / 100;
  }

  /**
   * Normalize score to [0, 1] or [0, 100] range.
   */
  static normalize(score: number, max: number = 100): number {
    if (max <= 0) return 0;
    const normalized = score / max;
    return Math.max(0, Math.min(1, normalized));
  }
}
