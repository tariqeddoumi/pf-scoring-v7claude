import prisma from "@/lib/prisma-client";

/**
 * Binding resolver - resolves node data bindings against source entities
 * (Client, Project, Evaluation, Document, Calculated, External, Manual).
 *
 * A binding declares: "node X reads its value from source Y.field Z,
 * with transform T, in mode M (auto/auto-if-empty/manual/calculated)".
 *
 * The resolver returns a snapshot + resolved value that the evaluation
 * service then persists on the ScoringEvaluationAnswer.
 */

export type SourceEntity =
  | "CLIENT"
  | "PROJECT"
  | "EVALUATION"
  | "DOCUMENT"
  | "CALCULATED"
  | "EXTERNAL_REFERENCE"
  | "MANUAL";

export type BindingMode =
  | "AUTO_READONLY"
  | "AUTO_EDITABLE"
  | "AUTO_IF_EMPTY"
  | "MANUAL_ONLY"
  | "CALCULATED_ONLY";

export type TransformType =
  | "NONE"
  | "LOOKUP"
  | "FORMAT"
  | "MAP_VALUE"
  | "AGGREGATE"
  | "FORMULA"
  | "NORMALIZE";

export interface BindingContext {
  evaluationId: string;
  projectId: string;
  clientId?: string | null;
}

export interface ResolvedValue {
  bindingId: string;
  sourceEntity: SourceEntity;
  sourceField: string | null;
  sourcePath: string | null;
  sourceSnapshot: unknown;
  resolvedValue: unknown;
  dataType: string | null;
  transformType: TransformType;
  bindingMode: BindingMode;
  /** La source a fourni une valeur exploitable (hors défaut et repli). */
  isAvailable: boolean;
  /** Origine de resolvedValue : la source, la valeur par défaut, le repli, ou rien. */
  valueOrigin: "SOURCE" | "DEFAULT" | "FALLBACK" | "NONE";
  note?: string;
}

/**
 * Transformations déclarées dans le paramétrage mais non exécutées par ce résolveur :
 * elles renvoyaient la valeur brute comme si elle était transformée. Elles rendent
 * désormais la donnée indisponible, avec un motif explicite.
 */
export const TRANSFORMATIONS_NON_EXECUTEES: TransformType[] = ["LOOKUP", "AGGREGATE", "FORMULA"];

export interface BindingRow {
  id: string;
  nodeId: string;
  sourceEntity: string;
  sourceField: string | null;
  sourcePath: string | null;
  bindingMode: string;
  dataType: string | null;
  transformType: string;
  transformConfigJson: string | null;
  defaultValue: string | null;
  fallbackValue: string | null;
  fallbackMessage: string | null;
  isActive: boolean;
  priority: number;
}

function parseJson<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readPath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function applyTransform(
  raw: unknown,
  transformType: TransformType,
  config: Record<string, unknown> | null
): unknown {
  if (raw == null) return raw;
  switch (transformType) {
    case "NONE":
      return raw;
    case "FORMAT": {
      if (typeof raw === "number" && config?.decimals != null) {
        const d = Number(config.decimals);
        return Number(raw.toFixed(d));
      }
      return raw;
    }
    case "MAP_VALUE": {
      const map = (config?.map as Record<string, unknown> | undefined) || {};
      const key = String(raw);
      return key in map ? map[key] : raw;
    }
    case "NORMALIZE": {
      if (typeof raw === "string") return raw.trim().toLowerCase();
      return raw;
    }
    case "LOOKUP":
    case "AGGREGATE":
    case "FORMULA":
      // non exécutées ici : voir TRANSFORMATIONS_NON_EXECUTEES
      return undefined;
    default:
      return raw;
  }
}

export class BindingResolver {
  /**
   * Load active bindings for the given nodes.
   */
  static async loadBindings(nodeIds: string[]): Promise<Map<string, BindingRow[]>> {
    if (nodeIds.length === 0) return new Map();
    const rows = await prisma.scoringNodeDataBinding.findMany({
      where: { nodeId: { in: nodeIds }, isActive: true },
      orderBy: [{ nodeId: "asc" }, { priority: "asc" }],
    });
    const map = new Map<string, BindingRow[]>();
    for (const r of rows) {
      const list = map.get(r.nodeId) || [];
      list.push(r as BindingRow);
      map.set(r.nodeId, list);
    }
    return map;
  }

  /**
   * Resolve a single binding given its context payloads.
   */
  static resolveOne(
    binding: BindingRow,
    payloads: Record<SourceEntity, unknown>
  ): ResolvedValue {
    const source = binding.sourceEntity as SourceEntity;
    const payload = payloads[source];
    const path = binding.sourcePath || binding.sourceField || "";
    const raw = path ? readPath(payload, path) : payload;

    const config = parseJson<Record<string, unknown>>(binding.transformConfigJson);
    const transformType = binding.transformType as TransformType;

    const nonExecutee = TRANSFORMATIONS_NON_EXECUTEES.includes(transformType);
    let resolved = applyTransform(raw, transformType, config);

    // Disponibilité calculée APRÈS transformation ; défaut et repli sont tracés à part.
    const isAvailable = resolved != null && resolved !== "";
    let valueOrigin: ResolvedValue["valueOrigin"] = isAvailable ? "SOURCE" : "NONE";
    if (!isAvailable && !nonExecutee) {
      if (binding.defaultValue != null) {
        resolved = binding.defaultValue;
        valueOrigin = "DEFAULT";
      } else if (binding.fallbackValue != null) {
        resolved = binding.fallbackValue;
        valueOrigin = "FALLBACK";
      }
    }

    return {
      bindingId: binding.id,
      sourceEntity: source,
      sourceField: binding.sourceField,
      sourcePath: binding.sourcePath,
      sourceSnapshot: raw ?? null,
      resolvedValue: resolved ?? null,
      dataType: binding.dataType,
      transformType,
      bindingMode: binding.bindingMode as BindingMode,
      isAvailable,
      valueOrigin,
      note: nonExecutee
        ? `transformation ${transformType} non exécutée par le moteur : donnée indisponible`
        : isAvailable
          ? undefined
          : binding.fallbackMessage ?? undefined,
    };
  }

  /**
   * Load the context payloads (client/project/evaluation) once per request.
   */
  static async loadContextPayloads(ctx: BindingContext): Promise<Record<SourceEntity, unknown>> {
    const [project, evaluation] = await Promise.all([
      prisma.project.findUnique({
        where: { id: ctx.projectId },
        include: { client: true },
      }),
      prisma.scoringEvaluation.findUnique({ where: { id: ctx.evaluationId } }),
    ]);

    const client = project?.client ?? null;
    return {
      CLIENT: client,
      PROJECT: project,
      EVALUATION: evaluation,
      DOCUMENT: null,
      CALCULATED: null,
      EXTERNAL_REFERENCE: null,
      MANUAL: null,
    };
  }

  /**
   * Resolve all bindings for a set of nodes given an evaluation context.
   * Returns a map nodeId → picked binding result (highest priority available).
   */
  static async resolveForNodes(
    nodeIds: string[],
    ctx: BindingContext
  ): Promise<Map<string, ResolvedValue>> {
    const [bindingsByNode, payloads] = await Promise.all([
      this.loadBindings(nodeIds),
      this.loadContextPayloads(ctx),
    ]);

    const result = new Map<string, ResolvedValue>();
    for (const [nodeId, bindings] of bindingsByNode.entries()) {
      let pick: ResolvedValue | null = null;
      for (const b of bindings) {
        const r = this.resolveOne(b, payloads);
        if (r.isAvailable) {
          pick = r;
          break;
        }
        if (!pick) pick = r;
      }
      if (pick) result.set(nodeId, pick);
    }
    return result;
  }
}
