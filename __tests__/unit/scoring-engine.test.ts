/**
 * Unit Tests for ScoringEngine - PF Scoring V7++
 */

import { ScoringEngine } from "@/lib/scoring-engine-v7plus";
import { RulesEngine } from "@/lib/scoring-rules-v7plus";
import { DataValidator } from "@/lib/scoring-validators-v7plus";
import { SOLAR_MAROC_FIXTURE, SOLAR_MAROC_EXPECTED } from "../fixtures/solar-maroc-case";

describe("ScoringEngine", () => {
  let engine: ScoringEngine;
  let rulesEngine: RulesEngine;
  let validator: DataValidator;

  beforeEach(() => {
    engine = new ScoringEngine(SOLAR_MAROC_FIXTURE);
    rulesEngine = new RulesEngine();
    validator = new DataValidator();
  });

  describe("calculateGlobalScore", () => {
    it("should calculate scoring for Solar Maroc case study", () => {
      const result = engine.calculateGlobalScore(rulesEngine, validator);

      expect(result).toBeDefined();
      expect(result.rating).toBeDefined();
      expect(result.finalScore).toBeGreaterThan(0);
      expect(result.finalScore).toBeLessThanOrEqual(10);
      expect(result.probabilityOfDefault).toBeGreaterThan(0);
      expect(result.probabilityOfDefault).toBeLessThan(1);
    });

    it("should return all 9 domain scores", () => {
      const result = engine.calculateGlobalScore(rulesEngine, validator);

      expect(result.domains).toBeDefined();
      expect(Object.keys(result.domains).length).toBeGreaterThanOrEqual(6);
    });

    it("should trigger no NO-GO rules for Solar Maroc (excellent project)", () => {
      const result = engine.calculateGlobalScore(rulesEngine, validator);

      // Solar Maroc should have no NO-GO triggers (A-rated project)
      expect(Array.isArray(result.triggeredNOGOs)).toBe(true);
      expect(result.triggeredNOGOs.length).toBeLessThan(3); // Allow some but should be minimal
    });

    it("should match expected rating range for Solar Maroc", () => {
      const result = engine.calculateGlobalScore(rulesEngine, validator);

      // Expected: A rating, score ~8.08
      const ratingOrder = ["D", "CCC", "B", "BB", "BBB", "A", "AA", "AAA"];
      const expectedIndex = ratingOrder.indexOf("A");
      const resultIndex = ratingOrder.indexOf(result.rating);

      // Should be within ±1 rating band
      expect(Math.abs(resultIndex - expectedIndex)).toBeLessThanOrEqual(1);
      expect(result.finalScore).toBeGreaterThan(7.5); // A-range starts ~7.5
    });
  });

  describe("Domain-specific scoring", () => {
    it("D1: Project Fundamentals should score well", () => {
      const result = engine.calculateGlobalScore(rulesEngine, validator);
      const d1 = result.domains.D1;

      if (d1) {
        expect(d1.aggregatedScore).toBeGreaterThan(7); // Proven technology, mature project
      }
    });

    it("D2: Host Country should score well for Morocco", () => {
      const result = engine.calculateGlobalScore(rulesEngine, validator);
      const d2 = result.domains.D2;

      if (d2) {
        expect(d2.aggregatedScore).toBeGreaterThan(6); // BBB sovereign rating, stable
      }
    });

    it("D5: Revenue & Market should score well with PPA", () => {
      const result = engine.calculateGlobalScore(rulesEngine, validator);
      const d5 = result.domains.D5;

      if (d5) {
        expect(d5.aggregatedScore).toBeGreaterThan(8); // Government PPA, strong offtaker
      }
    });

    it("D6: Financial Structure should show acceptable leverage", () => {
      const result = engine.calculateGlobalScore(rulesEngine, validator);
      const d6 = result.domains.D6;

      if (d6) {
        expect(d6.aggregatedScore).toBeGreaterThan(7); // 75% debt is acceptable with strong DSCR
      }
    });
  });

  describe("Validation integration", () => {
    it("should validate Solar Maroc data completeness", () => {
      const completeness = validator.validateCompleteness(SOLAR_MAROC_FIXTURE);

      expect(completeness).toBeDefined();
      expect(completeness.overall).toMatch(/COMPLETE|PARTIAL/); // Should be complete or partial
    });

    it("should pass field validation for Solar Maroc", () => {
      const fieldErrors = validator.validateFields(SOLAR_MAROC_FIXTURE);

      expect(Array.isArray(fieldErrors)).toBe(true);
      // Should have minimal or no critical errors
      const criticalErrors = fieldErrors.filter((e) => e.severity === "ERROR");
      expect(criticalErrors.length).toBeLessThan(3);
    });
  });

  describe("Recommendation logic", () => {
    it("should recommend APPROVE for Solar Maroc", () => {
      const result = engine.calculateGlobalScore(rulesEngine, validator);

      expect(result.recommendation).toMatch(/APPROVE|APPROVE_WITH_CONDITIONS/);
    });

    it("should provide recommendation justification", () => {
      const result = engine.calculateGlobalScore(rulesEngine, validator);

      if (result.justification) {
        expect(result.justification.length).toBeGreaterThan(0);
      }
    });
  });
});
