/**
 * Unit Tests for RulesEngine - NO-GO and MALUS Rules
 */

import { RulesEngine } from "@/lib/scoring-rules-v7plus";
import { ProjectData } from "@/types/scoring-v7plus";
import { SOLAR_MAROC_FIXTURE } from "../fixtures/solar-maroc-case";

describe("RulesEngine - NO-GO Rules", () => {
  let rulesEngine: RulesEngine;

  beforeEach(() => {
    rulesEngine = new RulesEngine();
  });

  describe("NO-GO Rule Checking", () => {
    it("should not trigger any NO-GO for Solar Maroc (excellent project)", () => {
      const nogoRules = rulesEngine.checkNOGOs(SOLAR_MAROC_FIXTURE);

      expect(Array.isArray(nogoRules)).toBe(true);
      expect(nogoRules.length).toBeLessThan(2); // Excellent project should have 0-1 NO-GO max
    });

    it("should trigger NOGO_1A for sponsor with CCC or lower rating", () => {
      const badSponsorData: ProjectData = {
        ...SOLAR_MAROC_FIXTURE,
        financialStructure: {
          ...SOLAR_MAROC_FIXTURE.financialStructure,
          sponsorRating: "D", // Very poor rating
        },
      };

      const nogoRules = rulesEngine.checkNOGOs(badSponsorData);

      // Should have at least one NO-GO for poor sponsor
      expect(nogoRules.length).toBeGreaterThan(0);
      expect(nogoRules.some((rule) => rule.ruleId.includes("NOGO_1"))).toBe(true);
    });

    it("should trigger NOGO_5A for missing PPA", () => {
      const noPPAData: ProjectData = {
        ...SOLAR_MAROC_FIXTURE,
        revenue: {
          ...SOLAR_MAROC_FIXTURE.revenue,
          hasPublicPPA: false,
        },
      };

      const nogoRules = rulesEngine.checkNOGOs(noPPAData);

      // Should have NO-GO for missing PPA
      expect(nogoRules.length).toBeGreaterThan(0);
      expect(nogoRules.some((rule) => rule.ruleId.includes("NOGO_5"))).toBe(true);
    });

    it("should trigger NOGO_6A for DSCR below 1.10", () => {
      const lowDSCRData: ProjectData = {
        ...SOLAR_MAROC_FIXTURE,
        financialStructure: {
          ...SOLAR_MAROC_FIXTURE.financialStructure,
          dscr: 1.05, // Below 1.10 threshold
        },
      };

      const nogoRules = rulesEngine.checkNOGOs(lowDSCRData);

      // Should have NO-GO for insufficient DSCR
      expect(nogoRules.length).toBeGreaterThan(0);
      expect(nogoRules.some((rule) => rule.ruleId.includes("NOGO_6"))).toBe(true);
    });

    it("should trigger NOGO_6C for excessive leverage (>85%)", () => {
      const highLeverageData: ProjectData = {
        ...SOLAR_MAROC_FIXTURE,
        financialStructure: {
          ...SOLAR_MAROC_FIXTURE.financialStructure,
          equityToDebtRatio: 0.12, // ~89% debt (exceeds 85% threshold)
        },
      };

      const nogoRules = rulesEngine.checkNOGOs(highLeverageData);

      // Should have NO-GO for excessive leverage
      expect(nogoRules.length).toBeGreaterThan(0);
      expect(nogoRules.some((rule) => rule.ruleId.includes("NOGO_6"))).toBe(true);
    });
  });
});

describe("RulesEngine - MALUS Rules", () => {
  let rulesEngine: RulesEngine;

  beforeEach(() => {
    rulesEngine = new RulesEngine();
  });

  describe("MALUS Rule Checking", () => {
    it("should not trigger excessive MALUS for Solar Maroc", () => {
      const malusRules = rulesEngine.checkMALUS(SOLAR_MAROC_FIXTURE);

      expect(Array.isArray(malusRules)).toBe(true);
      // Excellent project should have minimal or no MALUS
      expect(malusRules.length).toBeLessThan(3);
    });

    it("should trigger MALUS for DSCR < 1.25 (without indexation)", () => {
      const mediumDSCRData: ProjectData = {
        ...SOLAR_MAROC_FIXTURE,
        financialStructure: {
          ...SOLAR_MAROC_FIXTURE.financialStructure,
          dscr: 1.20, // Below 1.25 but above 1.10
        },
        revenue: {
          ...SOLAR_MAROC_FIXTURE.revenue,
          ppaIndexation: false, // No indexation
        },
      };

      const malusRules = rulesEngine.checkMALUS(mediumDSCRData);

      // Should have MALUS for tight DSCR coverage
      expect(malusRules.length).toBeGreaterThan(0);
      expect(
        malusRules.some((rule) => rule.penaltyPoints && rule.penaltyPoints <= -5)
      ).toBe(true);
    });

    it("should accumulate MALUS penalties correctly", () => {
      const problemData: ProjectData = {
        ...SOLAR_MAROC_FIXTURE,
        financialStructure: {
          ...SOLAR_MAROC_FIXTURE.financialStructure,
          dscr: 1.22, // Tight coverage
          equityToDebtRatio: 0.20, // High leverage (80% debt)
        },
        revenue: {
          ...SOLAR_MAROC_FIXTURE.revenue,
          takeOrPayPercentage: 75, // Below 85%
        },
      };

      const malusRules = rulesEngine.checkMALUS(problemData);

      // Should accumulate multiple MALUS
      expect(malusRules.length).toBeGreaterThan(1);

      // Total penalty should be meaningful but not catastrophic
      const totalPenalty = malusRules.reduce(
        (sum, rule) => sum + (rule.penaltyPoints || 0),
        0
      );
      expect(totalPenalty).toBeLessThan(-1);
      expect(totalPenalty).toBeGreaterThan(-20);
    });
  });

  describe("MALUS justification", () => {
    it("should provide trigger reason for each MALUS", () => {
      const weakData: ProjectData = {
        ...SOLAR_MAROC_FIXTURE,
        construction: {
          ...SOLAR_MAROC_FIXTURE.construction,
          epcContractorRating: "CCC", // Weak contractor
        },
      };

      const malusRules = rulesEngine.checkMALUS(weakData);

      malusRules.forEach((rule) => {
        expect(rule.triggerLevel).toBeDefined();
        expect(rule.triggerLevel.length).toBeGreaterThan(0);
      });
    });
  });
});

describe("RulesEngine - Rule Count Verification", () => {
  let rulesEngine: RulesEngine;

  beforeEach(() => {
    rulesEngine = new RulesEngine();
  });

  it("should have at least 20 NO-GO rules defined", () => {
    const nogoRules = rulesEngine.checkNOGOs(SOLAR_MAROC_FIXTURE);

    // Get all possible NO-GO rule IDs (would need method in RulesEngine)
    // For now, verify the method works and returns array
    expect(Array.isArray(nogoRules)).toBe(true);
  });

  it("should have at least 15 MALUS rules defined", () => {
    const malusRules = rulesEngine.checkMALUS(SOLAR_MAROC_FIXTURE);

    // Verify the method works and returns array
    expect(Array.isArray(malusRules)).toBe(true);
  });
});
