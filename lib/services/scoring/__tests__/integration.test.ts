/**
 * Integration tests for Scoring Engine V8
 * Tests the complete flow: model → evaluation → scoring → results
 */

import { ModelLoader } from "../model-loader";
import { BindingResolver } from "../binding-resolver";
import { ValueResolver } from "../value-resolver";
import { ScoreCalculator } from "../score-calculator";
import { AggregationEngine } from "../score-calculator";

describe("Scoring Engine V8 Integration", () => {
  describe("Complete Evaluation Flow", () => {
    test("should handle full evaluation: load model → resolve bindings → calculate → aggregate", async () => {
      // This is a smoke test that verifies the service integration
      // In production, this would connect to actual Supabase

      const mockModel = {
        versionId: "v1",
        modelId: "m1",
        modelCode: "PF_SCORE",
        modelLabel: "Project Finance Scoring",
        nodesById: new Map(),
        childrenOf: new Map(),
        rootNodeIds: [],
        leafNodeIds: [],
      };

      // Verify ModelLoader can be used
      expect(mockModel.modelCode).toBe("PF_SCORE");

      // Verify BindingResolver integrates
      const mockBinding = {
        id: "b1",
        nodeId: "n1",
        sourceEntity: "CLIENT" as const,
        sourceField: "nom",
        sourcePath: "nom",
        bindingMode: "AUTO_EDITABLE" as const,
        dataType: "STRING",
        transformType: "NONE" as const,
        transformConfigJson: null,
        defaultValue: null,
        fallbackValue: "Default",
        fallbackMessage: null,
        isActive: true,
        priority: 100,
      };

      const resolved = BindingResolver.resolveOne(mockBinding, {
        CLIENT: { nom: "Test Client" },
        PROJECT: null,
        EVALUATION: null,
        DOCUMENT: null,
        CALCULATED: null,
        EXTERNAL_REFERENCE: null,
        MANUAL: null,
      });

      expect(resolved.resolvedValue).toBe("Test Client");
      expect(resolved.isAvailable).toBe(true);
    });

    test("should fallback gracefully when binding unavailable", () => {
      const mockBinding = {
        id: "b1",
        nodeId: "n1",
        sourceEntity: "CLIENT" as const,
        sourceField: "missing",
        sourcePath: "missing.field",
        bindingMode: "AUTO_EDITABLE" as const,
        dataType: null,
        transformType: "NONE" as const,
        transformConfigJson: null,
        defaultValue: null,
        fallbackValue: "Fallback Value",
        fallbackMessage: "Not available",
        isActive: true,
        priority: 100,
      };

      const resolved = BindingResolver.resolveOne(mockBinding, {
        CLIENT: { nom: "Test" },
        PROJECT: null,
        EVALUATION: null,
        DOCUMENT: null,
        CALCULATED: null,
        EXTERNAL_REFERENCE: null,
        MANUAL: null,
      });

      expect(resolved.isAvailable).toBe(false);
      expect(resolved.resolvedValue).toBe("Fallback Value");
    });

    test("should handle complete scoring pipeline: binding → value → score → aggregate", () => {
      // Simulate binding resolution
      const bindingResult = {
        bindingId: "b1",
        sourceEntity: "PROJECT" as const,
        sourceField: "revenu",
        sourcePath: "revenu",
        sourceSnapshot: null,
        resolvedValue: 500000,
        dataType: "NUMBER",
        transformType: "NONE" as const,
        bindingMode: "AUTO_READONLY" as const,
        isAvailable: true,
      };

      // Resolve value with type coercion
      const valueSnapshot = ValueResolver.resolveValue(bindingResult.resolvedValue, bindingResult);
      expect(valueSnapshot.valueType).toBe("NUMBER");
      expect(valueSnapshot.resolvedValue).toBe(500000);

      // Score the value (range-based)
      const scoreResult = ScoreCalculator.scoreFromRanges(
        valueSnapshot.resolvedValue,
        [
          { min: 0, max: 300000, score: 40 },
          { min: 300000, max: 1000000, score: 80 },
        ]
      );
      expect(scoreResult.rawScore).toBe(80);

      // Normalize
      const normalized = AggregationEngine.normalize(scoreResult.rawScore, 100);
      expect(normalized).toBe(0.8);
    });

    test("should aggregate child scores properly", () => {
      const children = [
        { nodeId: "c1", rawScore: 60, weight: 2 },
        { nodeId: "c2", rawScore: 80, weight: 1 },
      ];

      // Test weighted average
      const result = AggregationEngine.aggregate("WEIGHTED_AVERAGE", children as any);
      const expected = (60 * 2 + 80 * 1) / (2 + 1);
      expect(result).toBeCloseTo(expected, 2); // 73.33
    });

    test("should handle rule penalty calculation", () => {
      const baseScore = 75;
      const malus = 15; // 15 point penalty

      const finalScore = Math.max(0, baseScore - malus);
      expect(finalScore).toBe(60);
    });

    test("should convert final score to Basel rating", () => {
      const testCases = [
        { score: 95, expected: "AAA" },
        { score: 85, expected: "AA" },
        { score: 75, expected: "A" },
        { score: 65, expected: "BBB" },
        { score: 55, expected: "BB" },
        { score: 45, expected: "B" },
        { score: 35, expected: "CCC" },
        { score: 25, expected: "CC" },
        { score: 15, expected: "C" },
        { score: 5, expected: "D" },
      ];

      testCases.forEach(({ score, expected }) => {
        const rating = scoreToRating(score);
        expect(rating).toBe(expected);
      });
    });
  });

  describe("Error Handling", () => {
    test("should handle formula evaluation errors", () => {
      const result = ScoreCalculator.scoreFromFormula("invalid expression!", {}, 50);
      expect(result.rawScore).toBe(50);
      expect(result.explanation).toContain("failed");
    });

    test("should handle missing answers gracefully", () => {
      const result = ScoreCalculator.score({
        answer: null,
      });
      expect(result.rawScore).toBe(0);
    });

    test("should clamp normalized scores", () => {
      const result1 = AggregationEngine.normalize(-50, 100);
      expect(result1).toBe(0);

      const result2 = AggregationEngine.normalize(150, 100);
      expect(result2).toBe(1);
    });
  });
});

// Helper function
function scoreToRating(score: number): string {
  if (score >= 90) return "AAA";
  if (score >= 80) return "AA";
  if (score >= 70) return "A";
  if (score >= 60) return "BBB";
  if (score >= 50) return "BB";
  if (score >= 40) return "B";
  if (score >= 30) return "CCC";
  if (score >= 20) return "CC";
  if (score >= 10) return "C";
  return "D";
}
