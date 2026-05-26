/**
 * PF Scoring V8 - Sectoral Integration Layer
 * Applies sector-specific adjustments to V7++ base scores
 * Includes stress tests, red flags, and domain impact modifiers
 */

import { ScoringResult } from "@/types/scoring-v7plus";

export interface V8SectorData {
  id: string;
  code: string;
  label: string;
  domainWeights: Array<{
    domainCode: string;
    weightAdjusted: number;
  }>;
  stressTests: Array<{
    id: string;
    description: string;
    orderIndex: number;
  }>;
  redFlags: Array<{
    id: string;
    description: string;
    isNoGo: boolean;
    orderIndex: number;
  }>;
  domainImpacts: Array<{
    domainCode: string;
    impact: number; // -3 to +5
  }>;
}

export interface V8ScoringAdjustment {
  sectorCode: string;
  adjustedScore: number;
  adjustmentDetail: {
    baseScore: number;
    domainWeightAdjustments: Record<string, number>;
    stressTestImpact: number;
    redFlagPenalty: number;
    domainImpactAdjustment: number;
  };
  triggeredRedFlags: Array<{
    id: string;
    description: string;
    isNoGo: boolean;
  }>;
  stressTestResults: Array<{
    id: string;
    description: string;
    severity: "low" | "medium" | "high";
  }>;
}

export interface V8ScoringResult extends ScoringResult {
  v8Adjustment?: V8ScoringAdjustment;
  sectorCode?: string;
}

// ============================================================================
// V8 SCORING ENGINE
// ============================================================================

export class V8ScoringEngine {
  /**
   * Apply V8 sectoral adjustments to V7++ base score
   */
  public static applyV8Adjustments(
    baseResult: ScoringResult,
    sectorData: V8SectorData,
    projectData: any
  ): V8ScoringResult {
    const adjustment: V8ScoringAdjustment = {
      sectorCode: sectorData.code,
      adjustedScore: baseResult.normalizedScore,
      adjustmentDetail: {
        baseScore: baseResult.normalizedScore,
        domainWeightAdjustments: {},
        stressTestImpact: 0,
        redFlagPenalty: 0,
        domainImpactAdjustment: 0,
      },
      triggeredRedFlags: [],
      stressTestResults: [],
    };

    // Step 1: Apply domain weight adjustments
    const domainWeightImpact = this.applyDomainWeights(
      baseResult,
      sectorData,
      adjustment
    );

    // Step 2: Check red flags
    const redFlagPenalty = this.checkRedFlags(
      projectData,
      sectorData,
      adjustment
    );

    // Step 3: Evaluate stress tests
    const stressTestImpact = this.evaluateStressTests(
      projectData,
      sectorData,
      adjustment
    );

    // Step 4: Apply domain impact modifiers
    const domainImpactAdjustment = this.applyDomainImpacts(
      baseResult,
      sectorData,
      adjustment
    );

    // Calculate final adjusted score
    const totalAdjustment =
      domainWeightImpact +
      redFlagPenalty +
      stressTestImpact +
      domainImpactAdjustment;

    adjustment.adjustedScore = Math.max(1, baseResult.normalizedScore + totalAdjustment);
    adjustment.adjustmentDetail.domainWeightAdjustments = Object.fromEntries(
      sectorData.domainWeights.map((dw) => [
        dw.domainCode,
        dw.weightAdjusted,
      ])
    );
    adjustment.adjustmentDetail.stressTestImpact = stressTestImpact;
    adjustment.adjustmentDetail.redFlagPenalty = redFlagPenalty;
    adjustment.adjustmentDetail.domainImpactAdjustment = domainImpactAdjustment;

    return {
      ...baseResult,
      normalizedScore: adjustment.adjustedScore,
      finalScore: Math.max(1, adjustment.adjustedScore + baseResult.malusTotal),
      v8Adjustment: adjustment,
      sectorCode: sectorData.code,
      rating: this.scoreToRating(
        Math.max(1, adjustment.adjustedScore + baseResult.malusTotal)
      ),
      version: "8.0",
    };
  }

  /**
   * Apply sector-specific domain weight adjustments
   * Reweights domains based on sector priorities
   */
  private static applyDomainWeights(
    baseResult: ScoringResult,
    sectorData: V8SectorData,
    adjustment: V8ScoringAdjustment
  ): number {
    let weightAdjustmentImpact = 0;

    for (const domainWeight of sectorData.domainWeights) {
      const domainCode = domainWeight.domainCode;
      const baseDomainScore = baseResult.domains[domainCode]?.aggregatedScore ?? 0;

      // Calculate the adjustment factor (0.8 to 1.2 range for ±20% variance)
      const adjustmentFactor = domainWeight.weightAdjusted / 0.111; // Default weight = 1/9 ≈ 0.111

      // Apply adjustment
      if (adjustmentFactor !== 1) {
        const adjustmentAmount =
          baseDomainScore * (adjustmentFactor - 1) * 0.01; // Small impact scaling
        weightAdjustmentImpact += adjustmentAmount;
      }
    }

    return Math.max(-2, Math.min(2, weightAdjustmentImpact)); // Cap at ±2 points
  }

  /**
   * Check for sector-specific red flags that could be NO-GO conditions
   */
  private static checkRedFlags(
    projectData: any,
    sectorData: V8SectorData,
    adjustment: V8ScoringAdjustment
  ): number {
    let redFlagPenalty = 0;

    // Example red flag checks (these should be expanded based on actual sector requirements)
    for (const flag of sectorData.redFlags) {
      let triggered = false;

      // Generic check based on flag description patterns
      if (
        flag.description.toLowerCase().includes("environmental") &&
        projectData.sector_code === "ENR"
      ) {
        // Check environmental compliance for renewable energy
        triggered = projectData.environmental_compliance !== "full";
      }

      if (
        flag.description.toLowerCase().includes("water quality") &&
        projectData.sector_code === "EAU"
      ) {
        // Check water quality requirements
        triggered = projectData.water_quality_certified !== true;
      }

      if (
        flag.description.toLowerCase().includes("permit") &&
        !projectData.permits_obtained
      ) {
        triggered = true;
      }

      if (triggered) {
        adjustment.triggeredRedFlags.push({
          id: flag.id,
          description: flag.description,
          isNoGo: flag.isNoGo,
        });

        // Apply penalty based on severity
        if (flag.isNoGo) {
          redFlagPenalty = -100; // Auto-rejection
        } else {
          redFlagPenalty -= 1; // 1 point penalty per red flag
        }
      }
    }

    return Math.max(-100, redFlagPenalty);
  }

  /**
   * Evaluate sector-specific stress tests
   * Assess project resilience under adverse conditions
   */
  private static evaluateStressTests(
    projectData: any,
    sectorData: V8SectorData,
    adjustment: V8ScoringAdjustment
  ): number {
    let stressTestImpact = 0;
    const stressScenarios = [
      { type: "market_downturn", severity: "high", impact: -1.5 },
      { type: "cost_overrun", severity: "medium", impact: -1.0 },
      { type: "delay", severity: "medium", impact: -0.8 },
      { type: "regulatory_change", severity: "high", impact: -1.2 },
    ];

    for (const test of sectorData.stressTests) {
      const scenario = stressScenarios.find((s) =>
        test.description.toLowerCase().includes(s.type)
      );

      if (scenario) {
        // Assess project's resilience to this scenario
        const resilience = this.assessProjectResilience(
          projectData,
          scenario.type
        );

        const testImpact = scenario.impact * (1 - resilience); // Higher resilience reduces impact
        stressTestImpact += testImpact;

        adjustment.stressTestResults.push({
          id: test.id,
          description: test.description,
          severity: scenario.severity as "low" | "medium" | "high",
        });
      }
    }

    return Math.max(-3, Math.min(0, stressTestImpact)); // Cap at 0 to -3 points
  }

  /**
   * Assess project's ability to withstand specific stress scenarios
   */
  private static assessProjectResilience(
    projectData: any,
    scenarioType: string
  ): number {
    let resilience = 0.5; // Base resilience

    switch (scenarioType) {
      case "market_downturn":
        // Check demand stability
        resilience = projectData.long_term_agreements ? 0.7 : 0.3;
        resilience +=
          projectData.customer_concentration_hhi ? 0.1 : 0;
        break;

      case "cost_overrun":
        // Check contingency reserves and fixed price contracts
        resilience = (projectData.contingency_reserve_percent ?? 0) / 100;
        resilience += projectData.fixed_price_contracts ? 0.15 : 0;
        break;

      case "delay":
        // Check schedule buffers and penalty clauses
        resilience =
          (projectData.schedule_buffer_months ?? 0) / 12;
        resilience += projectData.penalty_clauses ? 0.1 : 0;
        break;

      case "regulatory_change":
        // Check regulatory stability and diversification
        resilience = projectData.regulatory_stable ? 0.6 : 0.2;
        resilience += projectData.sector_diversified ? 0.2 : 0;
        break;
    }

    return Math.max(0, Math.min(1, resilience));
  }

  /**
   * Apply domain-specific impact modifiers
   * Some sectors have stronger impacts on certain domains
   */
  private static applyDomainImpacts(
    baseResult: ScoringResult,
    sectorData: V8SectorData,
    adjustment: V8ScoringAdjustment
  ): number {
    let domainImpactTotal = 0;

    for (const impact of sectorData.domainImpacts) {
      const domainScore = baseResult.domains[impact.domainCode]?.aggregatedScore ?? 5;

      // Impact modifier: -3 to +5 scale
      // Negative impacts reduce weak scores, positive impacts boost strong scores
      const scoreAdjustment =
        impact.impact > 0
          ? domainScore * (impact.impact / 10) * 0.1 // +impact amplifies good scores
          : domainScore * (impact.impact / 10) * 0.15; // -impact penalizes weak scores more

      domainImpactTotal += scoreAdjustment;
    }

    return Math.max(-2, Math.min(2, domainImpactTotal)); // Cap at ±2 points
  }

  /**
   * Convert score to rating scale (shared with V7++)
   */
  private static scoreToRating(score: number): string {
    if (score >= 8.5) return "AAA";
    if (score >= 7.5) return "AA";
    if (score >= 6.5) return "A";
    if (score >= 5.5) return "BBB";
    if (score >= 4.5) return "BB";
    if (score >= 3.5) return "B";
    if (score >= 2.0) return "CCC";
    return "D";
  }

  /**
   * Fetch V8 sector data from API
   */
  public static async fetchSectorData(
    sectorCode: string
  ): Promise<V8SectorData | null> {
    try {
      const response = await fetch(`/api/v8/sectors?code=${sectorCode}`);
      if (!response.ok) return null;

      const data = await response.json();
      return data.data?.[0] || null;
    } catch (error) {
      console.error("Failed to fetch V8 sector data:", error);
      return null;
    }
  }

  /**
   * Fetch all available V8 sectors
   */
  public static async fetchAllSectors(): Promise<V8SectorData[]> {
    try {
      const response = await fetch("/api/v8/sectors");
      if (!response.ok) return [];

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Failed to fetch V8 sectors:", error);
      return [];
    }
  }
}
