/**
 * Value resolver - converts raw answers (string/number/boolean/date) into
 * typed values suitable for scoring (options/ranges/formulas).
 * Integrates binding-aware snapshots and override tracking.
 */

import prisma from "@/lib/prisma-client";
import { ResolvedValue } from "./binding-resolver";

export type ValueType = "STRING" | "NUMBER" | "BOOLEAN" | "DATE" | "JSON";

export interface ResolvedValueSnapshot {
  valueType: ValueType;
  rawValue: unknown;
  resolvedValue: unknown;
  isAutoFilled: boolean;
  isOverridden: boolean;
  overrideReason?: string;
  bindingSource?: ResolvedValue;
}

export class ValueResolver {
  /**
   * Type-infer and coerce a value based on hints and bindings.
   */
  static resolveValue(
    rawValue: unknown,
    binding: ResolvedValue | undefined,
    expectedType?: ValueType
  ): ResolvedValueSnapshot {
    let valueType: ValueType = expectedType || "STRING";
    let resolvedValue: unknown = rawValue;
    const isAutoFilled = !!binding;

    // Try to infer type from binding
    if (binding?.dataType) {
      if (binding.dataType.toUpperCase() === "NUMBER") valueType = "NUMBER";
      else if (binding.dataType.toUpperCase() === "BOOLEAN") valueType = "BOOLEAN";
      else if (binding.dataType.toUpperCase() === "DATE") valueType = "DATE";
      else if (binding.dataType.toUpperCase() === "JSON") valueType = "JSON";
    }

    // Coerce to target type
    if (valueType === "NUMBER" && rawValue != null) {
      const num = Number(rawValue);
      if (!isNaN(num)) resolvedValue = num;
    } else if (valueType === "BOOLEAN" && rawValue != null) {
      if (typeof rawValue === "boolean") resolvedValue = rawValue;
      else if (typeof rawValue === "string") {
        resolvedValue = ["true", "yes", "1", "on"].includes(rawValue.toLowerCase());
      } else {
        resolvedValue = Boolean(rawValue);
      }
    } else if (valueType === "DATE" && rawValue != null) {
      try {
        if (typeof rawValue === "string" || typeof rawValue === "number" || rawValue instanceof Date) {
          const dateValue = new Date(rawValue);
          if (!isNaN(dateValue.getTime())) {
            resolvedValue = dateValue;
          } else {
            resolvedValue = rawValue;
            valueType = "STRING";
          }
        } else {
          resolvedValue = rawValue;
          valueType = "STRING";
        }
      } catch {
        valueType = "STRING";
      }
    } else if (valueType === "JSON" && typeof rawValue === "string") {
      try {
        resolvedValue = JSON.parse(rawValue);
      } catch {
        valueType = "STRING";
      }
    }

    return {
      valueType,
      rawValue,
      resolvedValue,
      isAutoFilled,
      isOverridden: false,
      bindingSource: binding,
    };
  }

  /**
   * Load an evaluation answer with full provenance (binding + override tracking).
   */
  static async loadAnswerWithProvenance(
    evaluationId: string,
    nodeId: string
  ): Promise<ResolvedValueSnapshot | null> {
    const answer = await prisma.scoringEvaluationAnswer.findUnique({
      where: { evaluationId_nodeId: { evaluationId, nodeId } },
    });

    if (!answer) return null;

    // Reconstruct the binding (if it exists)
    let binding: ResolvedValue | undefined;
    if (answer.sourceBindingId) {
      const b = await prisma.scoringNodeDataBinding.findUnique({
        where: { id: answer.sourceBindingId },
      });
      if (b) {
        binding = {
          bindingId: b.id,
          sourceEntity: b.sourceEntity as any,
          sourceField: b.sourceField,
          sourcePath: b.sourcePath,
          sourceSnapshot: null,
          resolvedValue: null,
          dataType: b.dataType,
          transformType: b.transformType as any,
          bindingMode: b.bindingMode as any,
          isAvailable: true,
        };
      }
    }

    // Use sourceValueSnapshotJson if available
    let rawValue: unknown = answer.valueString ?? answer.valueNumber ?? answer.valueBoolean ?? answer.valueDate ?? answer.valueJson;
    if (answer.sourceValueSnapshotJson) {
      try {
        rawValue = JSON.parse(answer.sourceValueSnapshotJson);
      } catch {
        // fallback to stored value
      }
    }

    const resolved = this.resolveValue(rawValue, binding);
    resolved.isOverridden = answer.isOverridden ?? false;
    if (answer.overrideReason) resolved.overrideReason = answer.overrideReason;

    return resolved;
  }

  /**
   * Format a resolved value for display/export.
   */
  static format(snapshot: ResolvedValueSnapshot): string {
    const { valueType, resolvedValue } = snapshot;
    if (resolvedValue == null) return "";
    switch (valueType) {
      case "NUMBER":
        return typeof resolvedValue === "number" ? resolvedValue.toFixed(2) : String(resolvedValue);
      case "DATE":
        if (resolvedValue instanceof Date) {
          return resolvedValue.toLocaleDateString("fr-FR");
        }
        return String(resolvedValue);
      case "BOOLEAN":
        return resolvedValue ? "Oui" : "Non";
      case "JSON":
        return JSON.stringify(resolvedValue, null, 2);
      default:
        return String(resolvedValue);
    }
  }
}
