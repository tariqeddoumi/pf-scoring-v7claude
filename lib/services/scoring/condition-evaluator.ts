/**
 * Safe evaluator for scoring rule conditions.
 *
 * Grammar (recursive descent, no host-language evaluation):
 *   or         = and ( "||" and )*
 *   and        = not ( "&&" not )*
 *   not        = "!" not | primary
 *   primary    = "(" or ")" | comparison | operand
 *   comparison = operand ( ">=" | "<=" | "!=" | "==" | "=" | ">" | "<" ) operand
 *              | operand "in" "[" operand ( "," operand )* "]"
 *   operand    = IDENT | NUMBER | STRING | "true" | "false" | "null"
 *
 * An expression that cannot be parsed, or that reads an identifier absent from
 * the context, reports `evaluated: false` with a reason. Callers must treat that
 * as "rule not triggered" AND surface the reason: a misconfigured rule has to be
 * visible, never silently dropped.
 */

export type ConditionContext = Record<string, unknown>;

export interface ConditionResult {
  triggered: boolean;
  evaluated: boolean;
  reason?: string;
}

type Token =
  | { k: "ident"; v: string }
  | { k: "num"; v: number }
  | { k: "str"; v: string }
  | { k: "op"; v: string }
  | { k: "punct"; v: string };

const OPERATORS = [">=", "<=", "!=", "==", "&&", "||", ">", "<", "=", "!"];

class ParseError extends Error {}

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "(" || c === ")" || c === "[" || c === "]" || c === ",") {
      out.push({ k: "punct", v: c });
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      const end = src.indexOf(c, i + 1);
      if (end === -1) throw new ParseError(`chaîne non terminée à la position ${i}`);
      out.push({ k: "str", v: src.slice(i + 1, end) });
      i = end + 1;
      continue;
    }
    const op = OPERATORS.find((o) => src.startsWith(o, i));
    if (op) {
      out.push({ k: "op", v: op });
      i += op.length;
      continue;
    }
    const num = /^-?\d+(\.\d+)?/.exec(src.slice(i));
    if (num && (/\d/.test(c) || (c === "-" && /\d/.test(src[i + 1] ?? "")))) {
      out.push({ k: "num", v: parseFloat(num[0]) });
      i += num[0].length;
      continue;
    }
    const id = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(src.slice(i));
    if (id) {
      out.push({ k: "ident", v: id[0] });
      i += id[0].length;
      continue;
    }
    throw new ParseError(`caractère inattendu « ${c} » à la position ${i}`);
  }
  return out;
}

function lookup(path: string, ctx: ConditionContext): unknown {
  let cur: unknown = ctx;
  for (const part of path.split(".")) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function compare(op: string, left: unknown, right: unknown): boolean {
  const ln = asNumber(left);
  const rn = asNumber(right);
  if (ln !== null && rn !== null) {
    switch (op) {
      case ">": return ln > rn;
      case ">=": return ln >= rn;
      case "<": return ln < rn;
      case "<=": return ln <= rn;
      case "==": case "=": return ln === rn;
      case "!=": return ln !== rn;
    }
  }
  const ls = left === null || left === undefined ? "" : String(left).trim().toLowerCase();
  const rs = right === null || right === undefined ? "" : String(right).trim().toLowerCase();
  switch (op) {
    case "==": case "=": return ls === rs;
    case "!=": return ls !== rs;
    default:
      throw new ParseError(`l'opérateur « ${op} » exige deux valeurs numériques`);
  }
}

class Parser {
  private pos = 0;
  constructor(private toks: Token[], private ctx: ConditionContext) {}

  private peek(): Token | undefined {
    return this.toks[this.pos];
  }
  private eat(k: Token["k"], v?: string): Token {
    const t = this.peek();
    if (!t || t.k !== k || (v !== undefined && t.v !== v)) {
      throw new ParseError(`attendu ${v ?? k}, trouvé ${t ? String(t.v) : "fin d'expression"}`);
    }
    this.pos++;
    return t;
  }
  private isOp(v: string): boolean {
    const t = this.peek();
    return !!t && t.k === "op" && t.v === v;
  }
  private isPunct(v: string): boolean {
    const t = this.peek();
    return !!t && t.k === "punct" && t.v === v;
  }

  parse(): boolean {
    const v = this.or();
    if (this.pos < this.toks.length) {
      throw new ParseError(`texte inattendu après l'expression : « ${String(this.peek()!.v)} »`);
    }
    return v;
  }

  private or(): boolean {
    let left = this.and();
    while (this.isOp("||")) {
      this.pos++;
      const right = this.and();
      left = left || right;
    }
    return left;
  }

  private and(): boolean {
    let left = this.not();
    while (this.isOp("&&")) {
      this.pos++;
      const right = this.not();
      left = left && right;
    }
    return left;
  }

  private not(): boolean {
    if (this.isOp("!")) {
      this.pos++;
      return !this.not();
    }
    return this.primary();
  }

  private primary(): boolean {
    if (this.isPunct("(")) {
      this.pos++;
      const v = this.or();
      this.eat("punct", ")");
      return v;
    }
    const left = this.operand();

    const t = this.peek();
    if (t && t.k === "op" && [">", ">=", "<", "<=", "==", "=", "!="].includes(t.v)) {
      this.pos++;
      const right = this.operand();
      return compare(t.v, left, right);
    }
    if (t && t.k === "ident" && t.v.toLowerCase() === "in") {
      this.pos++;
      this.eat("punct", "[");
      const list: unknown[] = [];
      if (!this.isPunct("]")) {
        list.push(this.operand());
        while (this.isPunct(",")) {
          this.pos++;
          list.push(this.operand());
        }
      }
      this.eat("punct", "]");
      return list.some((item) => compare("==", left, item));
    }

    if (typeof left === "boolean") return left;
    throw new ParseError(
      `« ${String(left)} » n'est pas une condition : une comparaison ou un booléen est attendu`
    );
  }

  private operand(): unknown {
    const t = this.peek();
    if (!t) throw new ParseError("expression incomplète");
    if (t.k === "num" || t.k === "str") {
      this.pos++;
      return t.v;
    }
    if (t.k === "ident") {
      this.pos++;
      const low = t.v.toLowerCase();
      if (low === "true") return true;
      if (low === "false") return false;
      if (low === "null") return null;
      const value = lookup(t.v, this.ctx);
      if (value === undefined) {
        throw new ParseError(`le champ « ${t.v} » est absent du contexte d'évaluation`);
      }
      return value;
    }
    throw new ParseError(`opérande attendue, trouvé « ${String(t.v)} »`);
  }
}

export function evaluateCondition(
  expression: string | null | undefined,
  ctx: ConditionContext
): ConditionResult {
  const src = (expression ?? "").trim();
  if (src === "") {
    return { triggered: false, evaluated: false, reason: "condition vide" };
  }
  try {
    const triggered = new Parser(tokenize(src), ctx).parse();
    return { triggered, evaluated: true };
  } catch (err) {
    const reason = err instanceof ParseError ? err.message : "expression invalide";
    return { triggered: false, evaluated: false, reason };
  }
}
