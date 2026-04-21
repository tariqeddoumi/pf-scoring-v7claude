/**
 * Score calculator — évalue chaque nœud selon sa réponse.
 *
 * COMMENT ÇA MARCHE (pour débutants) :
 * ----------------------------------------
 * Chaque question du scoring peut être évaluée de 3 façons :
 *
 * 1. OPTIONS  → choix multiples (ex: "Contrat ferme" = 80 pts, "Pas de contrat" = 0 pts)
 * 2. PLAGES   → valeur numérique dans un intervalle (ex: DSCR entre 1.2 et 1.5 = 60 pts)
 * 3. FORMULE  → expression arithmétique (ex: "revenus / dettes * 100")
 *
 * L'AggregationEngine combine les scores enfants en score parent
 * selon différentes méthodes (somme, moyenne pondérée, etc.)
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
   * Évalue une formule arithmétique avec substitution de variables.
   *
   * SÉCURITÉ : on utilise un parser récursif au lieu de eval() pour éviter
   * toute injection de code. Seules les opérations +, -, *, / et parenthèses
   * sont autorisées.
   *
   * Exemple : expression="dscr * 50", variables={dscr: 1.4} → 70
   */
  static scoreFromFormula(
    expression: string,
    variables: Record<string, unknown>,
    fallback: number = 0
  ): ScoreOutput {
    try {
      // Remplacer chaque variable par sa valeur numérique
      let expr = expression;
      for (const [key, value] of Object.entries(variables)) {
        const val = Number(value);
        if (!isNaN(val)) {
          // \b = word boundary : évite de remplacer "dscr" dans "dscr2"
          expr = expr.replace(new RegExp(`\\b${key}\\b`, "g"), String(val));
        }
      }

      // Parser arithmétique sécurisé (pas d'eval)
      const score = safeEvalArithmetic(expr);
      if (isNaN(score)) throw new Error("Résultat NaN");

      return {
        rawScore: score,
        explanation: `Formule "${expression}" évaluée à ${score}`,
      };
    } catch (err) {
      return {
        rawScore: fallback,
        explanation: `Échec de la formule : ${err instanceof Error ? err.message : String(err)}`,
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

// ============================================================================
// PARSER ARITHMÉTIQUE SÉCURISÉ (remplace eval)
// ============================================================================
// Implémentation d'un parseur "descente récursive" pour les expressions
// arithmétiques simples : +, -, *, /, parenthèses, nombres décimaux.
//
// Grammaire supportée :
//   expression = term (('+' | '-') term)*
//   term       = factor (('*' | '/') factor)*
//   factor     = '(' expression ')' | '-' factor | NUMBER
//
// Cette approche est 100% sûre car elle n'exécute JAMAIS de code arbitraire.
// ============================================================================

/**
 * Découpe une expression en tokens (nombres et opérateurs).
 * Exemple : "1.5 * (2 + 3)" → ["1.5", "*", "(", "2", "+", "3", ")"]
 */
function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    // Ignorer les espaces
    if (/\s/.test(ch)) { i++; continue; }
    // Opérateurs et parenthèses
    if ("+-*/()".includes(ch)) { tokens.push(ch); i++; continue; }
    // Nombres décimaux
    if (/[\d.]/.test(ch)) {
      let num = "";
      while (i < expr.length && /[\d.]/.test(expr[i])) num += expr[i++];
      tokens.push(num);
      continue;
    }
    throw new Error(`Caractère invalide dans la formule : "${ch}"`);
  }
  return tokens;
}

/**
 * Évalue une expression arithmétique de façon sécurisée.
 * Lève une erreur si la formule est invalide ou si elle contient des caractères non autorisés.
 */
function safeEvalArithmetic(expr: string): number {
  const tokens = tokenize(expr);
  let pos = 0;

  // Niveau 1 : addition et soustraction (priorité basse)
  function parseExpression(): number {
    let left = parseTerm();
    while (pos < tokens.length && (tokens[pos] === "+" || tokens[pos] === "-")) {
      const op = tokens[pos++];
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  // Niveau 2 : multiplication et division (priorité haute)
  function parseTerm(): number {
    let left = parseFactor();
    while (pos < tokens.length && (tokens[pos] === "*" || tokens[pos] === "/")) {
      const op = tokens[pos++];
      const right = parseFactor();
      if (op === "/" && right === 0) throw new Error("Division par zéro");
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }

  // Niveau 3 : nombre, parenthèse, ou signe négatif
  function parseFactor(): number {
    if (tokens[pos] === "(") {
      pos++; // consommer "("
      const val = parseExpression();
      if (tokens[pos] === ")") pos++; // consommer ")"
      return val;
    }
    if (tokens[pos] === "-") {
      pos++; // signe négatif unaire
      return -parseFactor();
    }
    const num = parseFloat(tokens[pos]);
    if (isNaN(num)) throw new Error(`Token invalide : "${tokens[pos]}"`);
    pos++;
    return num;
  }

  return parseExpression();
}

// ============================================================================

/**
 * Aggregation engine — combine les scores enfants en score parent.
 * Méthodes supportées : SUM, WEIGHTED_SUM, AVERAGE, WEIGHTED_AVERAGE, MIN, MAX, COUNT.
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
