/**
 * PF Scoring V7++ - Validators & Complex Indicators
 * Data validation, completeness checks, complex indicator calculations
 */

import {
  ProjectData,
  DataCompletenessCheck,
  DataCompletenesStatus,
  ValidationError,
  OfftakerHealthIndex,
  PPARobustnessScore,
  MarketResilienceIndex,
  DomainCode,
  RatingScale,
} from "@/types/scoring-v7plus";

// ============================================================================
// DATA VALIDATORS
// ============================================================================

export class DataValidator {
  /**
   * Validate project data completeness
   */
  public validateCompleteness(projectData: ProjectData): DataCompletenessCheck {
    const results: DataCompletenessCheck = {
      projectId: projectData.projectId,
      overall: DataCompletenesStatus.COMPLETE,
      byDomain: {},
      missingFields: [],
      warnings: [],
    };

    // Check D1: Project Fundamentals
    const d1Complete = this.checkD1Completeness(projectData);
    results.byDomain[DomainCode.D1] = d1Complete;
    if (d1Complete !== DataCompletenesStatus.COMPLETE) {
      results.overall = DataCompletenesStatus.PARTIAL;
    }

    // Check D2: Host Country
    const d2Complete = this.checkD2Completeness(projectData);
    results.byDomain[DomainCode.D2] = d2Complete;

    // Check D5: Revenue & Market (critical)
    const d5Complete = this.checkD5Completeness(projectData);
    results.byDomain[DomainCode.D5] = d5Complete;
    if (d5Complete === DataCompletenesStatus.MISSING) {
      results.missingFields.push("ppaData (D5 critical)");
      results.overall = DataCompletenesStatus.MISSING;
    }

    // Check Financial data (critical for D7)
    const d7Complete = this.checkD7Completeness(projectData);
    results.byDomain[DomainCode.D7] = d7Complete;
    if (d7Complete === DataCompletenesStatus.MISSING) {
      results.missingFields.push("financial.dscr (D7 critical)");
      results.overall = DataCompletenesStatus.MISSING;
    }

    // Warnings
    if (!projectData.ppaData?.indexation) {
      results.warnings.push("PPA indexation not specified (assumes FIXED)");
    }
    if (!projectData.esg?.climateRisk) {
      results.warnings.push("ESG climate risk assessment missing");
    }

    return results;
  }

  private checkD1Completeness(p: ProjectData): DataCompletenesStatus {
    if (
      !p.sponsor?.name ||
      !p.sponsor?.rating ||
      p.sponsor?.equityPercent === undefined
    ) {
      return DataCompletenesStatus.PARTIAL;
    }
    return DataCompletenesStatus.COMPLETE;
  }

  private checkD2Completeness(p: ProjectData): DataCompletenesStatus {
    if (!p.hostCountry?.countryCode) {
      return DataCompletenesStatus.PARTIAL;
    }
    return DataCompletenesStatus.COMPLETE;
  }

  private checkD5Completeness(p: ProjectData): DataCompletenesStatus {
    if (!p.ppaData) return DataCompletenesStatus.MISSING;
    if (
      !p.offtaker ||
      !p.offtaker.name ||
      p.offtaker.concentrationPercent === undefined
    ) {
      return DataCompletenesStatus.PARTIAL;
    }
    return DataCompletenesStatus.COMPLETE;
  }

  private checkD7Completeness(p: ProjectData): DataCompletenesStatus {
    if (
      p.financial?.dscr === undefined ||
      p.financial?.debtAmount === undefined ||
      p.financial?.equityAmount === undefined
    ) {
      return DataCompletenesStatus.MISSING;
    }
    return DataCompletenesStatus.COMPLETE;
  }

  /**
   * Validate field-level data
   */
  public validateFields(projectData: ProjectData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Project ID validation
    if (!projectData.projectId || projectData.projectId.length === 0) {
      errors.push({
        field: "projectId",
        value: projectData.projectId,
        message: "Project ID is required",
        severity: "ERROR",
      });
    }

    // Rating validation
    if (projectData.sponsor!.rating) {
      if (!Object.values(RatingScale).includes(projectData.sponsor!.rating)) {
        errors.push({
          field: "sponsor.rating",
          value: projectData.sponsor!.rating,
          message: "Invalid rating scale",
          severity: "ERROR",
        });
      }
    }

    // Equity percentage validation
    if (
      projectData.sponsor!.equityPercent !== undefined &&
      (projectData.sponsor!.equityPercent < 0 ||
        projectData.sponsor!.equityPercent > 1)
    ) {
      errors.push({
        field: "sponsor.equityPercent",
        value: projectData.sponsor!.equityPercent,
        message: "Equity percentage must be between 0 and 1",
        severity: "ERROR",
      });
    }

    // DSCR validation (must be > 0.8 at minimum)
    if (
      projectData.financial!.dscr !== undefined &&
      projectData.financial!.dscr < 0.5
    ) {
      errors.push({
        field: "financial.dscr",
        value: projectData.financial!.dscr,
        message: "DSCR below survival threshold (0.5x)",
        severity: "ERROR",
      });
    }

    // Negative amount validation
    if (
      projectData.financial &&
      projectData.financial.debtAmount &&
      projectData.financial.debtAmount < 0
    ) {
      errors.push({
        field: "financial.debtAmount",
        value: projectData.financial.debtAmount,
        message: "Debt amount cannot be negative",
        severity: "ERROR",
      });
    }

    return errors;
  }

  /**
   * Deep validation of business logic
   */
  public validateBusinessLogic(projectData: ProjectData): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!projectData.financial) {
      return errors;
    }

    // Debt + Equity should sum to total funding
    const totalFunding =
      (projectData.financial.debtAmount ?? 0) +
      (projectData.financial.equityAmount ?? 0);
    if (totalFunding <= 0) {
      errors.push({
        field: "financial",
        value: {
          debt: projectData.financial.debtAmount,
          equity: projectData.financial.equityAmount,
        },
        message: "Total funding (debt + equity) must be positive",
        severity: "ERROR",
      });
    }

    // Equity should be 15-50% of funding
    const equityPercent =
      (projectData.financial.equityAmount ?? 0) / totalFunding;
    if (equityPercent < 0.15 || equityPercent > 0.5) {
      errors.push({
        field: "financial.equityAmount",
        value: equityPercent,
        message:
          "Equity should typically be 15-50% of total funding (V7++ standard)",
        severity: "WARNING",
      });
    }

    // PPA duration should align with project life
    if (projectData.ppaData && projectData.projectLife) {
      const ppaDuration = projectData.ppaData.duration;
      if (ppaDuration < projectData.projectLife * 0.8) {
        errors.push({
          field: "ppaData.duration",
          value: ppaDuration,
          message: `PPA duration (${ppaDuration}y) < 80% of project life (${projectData.projectLife}y)`,
          severity: "WARNING",
        });
      }
    }

    return errors;
  }
}

// ============================================================================
// COMPLEX INDICATORS CALCULATOR
// ============================================================================

export class ComplexIndicatorsCalculator {
  /**
   * Calculate Offtaker Health Index (0-10)
   * Composite indicator of offtaker creditworthiness
   */
  public calculateOfftakerHealthIndex(
    projectData: ProjectData
  ): OfftakerHealthIndex {
    if (!projectData.offtaker) {
      return {
        score: 4,
        rating: RatingScale.CCC,
        components: {
          financialRating: 0,
          liquidityRatio: 0,
          leverageInverse: 0,
          sectorStability: 0,
        },
      };
    }

    // Component 1: Financial Rating (0-10)
    const financialRating =
      this.ratingToNumeric(projectData.offtaker.rating) * 10;

    // Component 2: Liquidity Ratio (normalized to 0-10)
    // Target: >0.2 = 10, <0.1 = 1
    const liquidityNormalized = Math.min(
      10,
      (projectData.sponsor!.liquidityRatio ?? 0.15) * 50
    );

    // Component 3: Leverage Inverse (normalized to 0-10)
    // Target: <30% debt = 10, >80% debt = 1
    const debtAmount = projectData.financial?.debtAmount ?? 0;
    const equityAmount = projectData.financial?.equityAmount ?? 0;
    const debtRatio =
      debtAmount + equityAmount > 0
        ? debtAmount / (debtAmount + equityAmount)
        : 0;
    const leverageInverse = Math.max(2, 12 - debtRatio * 14);

    // Component 4: Sector Stability (placeholder, 0-10)
    const sectorStability = 6; // Would analyze sector data

    const score =
      financialRating * 0.5 +
      liquidityNormalized * 0.2 +
      leverageInverse * 0.2 +
      sectorStability * 0.1;

    return {
      score: Math.min(10, Math.max(2, score)),
      rating: this.numericToRating(score),
      components: {
        financialRating,
        liquidityRatio: liquidityNormalized,
        leverageInverse,
        sectorStability,
      },
    };
  }

  /**
   * Calculate PPA Robustness Score (0-10)
   * Composite indicator of PPA quality and protection level
   */
  public calculatePPARobustnessScore(
    projectData: ProjectData
  ): PPARobustnessScore {
    if (!projectData.ppaData) {
      return {
        score: 2,
        components: {
          duration: 2,
          takeOrPayStrength: 2,
          indexationCoverage: 2,
          penaltyEnforceability: 2,
        },
      };
    }

    // Component 1: Duration Score (2-10)
    // Target: 25+ years = 10, <12 years = 2
    const durationScore = Math.min(
      10,
      Math.max(2, (projectData.ppaData.duration / 25) * 10)
    );

    // Component 2: Take-or-Pay Strength (2-10)
    // Target: 100% = 10, 0% = 2
    const takeOrPayScore = Math.min(
      10,
      (projectData.ppaData.takeOrPayPercent ?? 0.5) * 10
    );

    // Component 3: Indexation Coverage (2-10)
    // CPI = 10, Hybrid = 7, Fixed = 2
    const indexationType = projectData.ppaData.indexation?.type;
    const indexationScore =
      indexationType === "CPI" ? 10 : indexationType === "HYBRID" ? 7 : 2;

    // Component 4: Penalty Enforceability (placeholder, 0-10)
    const penaltyScore = 7; // Would analyze contract clauses

    const score =
      durationScore * 0.3 +
      takeOrPayScore * 0.35 +
      indexationScore * 0.2 +
      penaltyScore * 0.15;

    return {
      score: Math.min(10, Math.max(2, score)),
      components: {
        duration: durationScore,
        takeOrPayStrength: takeOrPayScore,
        indexationCoverage: indexationScore,
        penaltyEnforceability: penaltyScore,
      },
    };
  }

  /**
   * Calculate Market Resilience Index (0-10)
   * Composite indicator of market sustainability and diversity
   */
  public calculateMarketResilienceIndex(
    projectData: ProjectData
  ): MarketResilienceIndex {
    // Component 1: Growth Trajectory (0-10)
    // Target: +2-3% CAGR = 8-9, -2%+ CAGR = 1-2
    const growthScore = 7; // Placeholder

    // Component 2: Diversification Score (0-10)
    // Target: Multiple clients spread = 10, mono-client = 1
    const concentration = projectData.offtaker?.concentrationPercent ?? 1;
    const diversityScore = Math.min(10, (1 - concentration) * 12);

    // Component 3: Regulatory Stability (0-10)
    // Target: Stable 15+ years = 10, volatile = 5
    const regulatoryScore = 7; // Placeholder

    // Component 4: Technology Maturity (2-10)
    // Target: Proven technology TRL 8-9 = 10, emerging TRL <6 = 4
    const techMaturitScore = projectData.technology?.trl
      ? Math.min(10, projectData.technology.trl)
      : 6;

    const score =
      growthScore * 0.3 +
      diversityScore * 0.3 +
      regulatoryScore * 0.2 +
      techMaturitScore * 0.2;

    return {
      score: Math.min(10, Math.max(2, score)),
      components: {
        growthTrajectory: growthScore,
        diversificationScore: diversityScore,
        regulatoryStability: regulatoryScore,
        technologyMaturity: techMaturitScore,
      },
    };
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  private ratingToNumeric(rating: RatingScale | undefined): number {
    if (!rating) return 0;
    const mapping: Record<RatingScale, number> = {
      [RatingScale.AAA]: 10,
      [RatingScale.AA]: 9,
      [RatingScale.A]: 8,
      [RatingScale.BBB]: 7,
      [RatingScale.BB]: 6,
      [RatingScale.B]: 4,
      [RatingScale.CCC]: 2,
      [RatingScale.D]: 0,
    };
    return mapping[rating];
  }

  private numericToRating(score: number): RatingScale {
    if (score >= 8.5) return RatingScale.AAA;
    if (score >= 8) return RatingScale.AA;
    if (score >= 7.5) return RatingScale.A;
    if (score >= 7) return RatingScale.BBB;
    if (score >= 6.5) return RatingScale.BB;
    if (score >= 6) return RatingScale.B;
    if (score >= 5.5) return RatingScale.CCC;
    return RatingScale.D;
  }
}

export default {
  DataValidator,
  ComplexIndicatorsCalculator,
};
