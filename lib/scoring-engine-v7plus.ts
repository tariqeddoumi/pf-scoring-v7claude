/**
 * PF Scoring V7++ - Scoring Engine
 * Core calculation logic for all 9 domains
 * Strict TypeScript implementation
 */

import {
  DomainCode,
  RatingScale,
  CriterionScore,
  DomainScore,
  ScoringResult,
  ProjectData,
  StressTestResult,
  StressScenario,
  ScoringStatus,
  NOGORule,
  MALUSRule,
} from "@/types/scoring-v7plus";

// ============================================================================
// DOMAIN WEIGHTS & CONFIGURATION
// ============================================================================

const DOMAIN_WEIGHTS: Record<DomainCode, number> = {
  [DomainCode.D1]: 0.20, // Project Fundamentals
  [DomainCode.D2]: 0.10, // Host Country
  [DomainCode.D3]: 0.15, // Construction Phase
  [DomainCode.D4]: 0.15, // Operation Phase
  [DomainCode.D5]: 0.15, // Revenue & Market
  [DomainCode.D6]: 0.15, // Financial Structure
  [DomainCode.D7]: 0.15, // Financial Structure & Cash Flow
  [DomainCode.D8]: 0.10, // Legal & Documentation
  [DomainCode.D9]: 0.10, // ESG & Climate
};

const TOTAL_WEIGHTS = Object.values(DOMAIN_WEIGHTS).reduce((a, b) => a + b, 0);
const NORMALIZATION_FACTOR = 100 / (TOTAL_WEIGHTS * 100);

// Rating transformation thresholds
const SCORE_TO_RATING_THRESHOLDS: Array<[number, RatingScale, number]> = [
  [8.5, RatingScale.AAA, 0.005],
  [8.0, RatingScale.AA, 0.010],
  [7.5, RatingScale.A, 0.015],
  [7.0, RatingScale.BBB, 0.025],
  [6.5, RatingScale.BB, 0.040],
  [6.0, RatingScale.B, 0.065],
  [5.5, RatingScale.CCC, 0.120],
  [0, RatingScale.D, 0.250],
];

// ============================================================================
// MAIN SCORING ENGINE CLASS
// ============================================================================

export class ScoringEngine {
  private projectData: ProjectData;
  private domainScores: Map<DomainCode, DomainScore> = new Map();
  private triggeredNOGOs: NOGORule[] = [];
  private appliedMALUS: MALUSRule[] = [];
  private malusTotal: number = 0;

  constructor(projectData: ProjectData) {
    this.projectData = projectData;
    this.validateInput();
  }

  /**
   * Main entry point: Calculate complete scoring
   */
  public calculateGlobalScore(
    rulesEngine: any,
    validators: any
  ): ScoringResult {
    // Check NO-GO rules first (rejection)
    this.triggeredNOGOs = rulesEngine.checkNOGOs(this.projectData);
    if (this.triggeredNOGOs.some((r) => r.triggered)) {
      return this.buildRejectionResult();
    }

    // Calculate all 9 domain scores
    this.calculateD1_ProjectFundamentals();
    this.calculateD2_HostCountry();
    this.calculateD3_ConstructionPhase();
    this.calculateD4_OperationPhase();
    this.calculateD5_RevenueMarket();
    this.calculateD6_FinancialStructure();
    this.calculateD7_FinancialStructureCashFlow();
    this.calculateD8_Legal();
    this.calculateD9_ESGClimate();

    // Calculate global score
    const globalScore = this.aggregateGlobalScore();
    const normalizedScore =
      globalScore * NORMALIZATION_FACTOR;

    // Apply MALUS rules
    this.appliedMALUS = rulesEngine.checkMALUS(
      this.projectData,
      this.domainScores
    );
    this.malusTotal = this.appliedMALUS.reduce((sum, rule) => {
      return sum + (rule.triggered ? rule.penaltyPoints : 0);
    }, 0);

    const finalScore = Math.max(1, normalizedScore + this.malusTotal);
    const rating = this.scoreToRating(finalScore);
    const pd = this.getProbabilityOfDefault(rating);

    return {
      evaluationId: `eval-${Date.now()}`,
      projectId: this.projectData.projectId,
      projectName: this.projectData.projectName,
      domains: Object.fromEntries(this.domainScores),
      globalScore,
      normalizedScore,
      rating,
      probabilityOfDefault: pd,
      triggeredNOGOs: this.triggeredNOGOs,
      appliedMALUS: this.appliedMALUS,
      malusTotal: this.malusTotal,
      finalScore,
      recommendation: this.getRecommendation(finalScore, this.triggeredNOGOs),
      calculatedAt: new Date(),
      version: "7.0",
    };
  }

  // ========================================================================
  // DOMAIN CALCULATIONS (D1-D9)
  // ========================================================================

  /**
   * D1 - Project Fundamentals (20%)
   */
  private calculateD1_ProjectFundamentals(): void {
    // D1.1 - Sponsor Strength (35%)
    const d1_1_score = this.calculateD1_1_SponsorStrength();

    // D1.2 - Project Structure (35%)
    const d1_2_score = this.calculateD1_2_ProjectStructure();

    // D1.3 - Permits & Land (30%)
    const d1_3_score = this.calculateD1_3_PermitsLand();

    const aggregated =
      d1_1_score * 0.35 + d1_2_score * 0.35 + d1_3_score * 0.3;

    this.domainScores.set(DomainCode.D1, {
      domainId: DomainCode.D1,
      domainCode: "PROJECT_FUNDAMENTALS",
      domainName: "Project Fundamentals",
      weight: DOMAIN_WEIGHTS[DomainCode.D1],
      subCriteria: [
        // {
        //   subCriterionId: "D1.1",
        //   code: "SPONSOR_STRENGTH",
        //   weight: 0.35,
        //   childCriteria: [],
        //   aggregatedScore: d1_1_score,
        // },
        // ... etc
      ],
      aggregatedScore: aggregated,
      rating: this.scoreToRating(aggregated),
      probabilityOfDefault: this.getProbabilityOfDefault(
        this.scoreToRating(aggregated)
      ),
    });
  }

  private calculateD1_1_SponsorStrength(): number {
    const financial = this.scoreSponsorFinancial();
    const experience = this.scoreSponsorExperience();
    const technical = this.scoreSponsorTechnical();
    return financial * 0.4 + experience * 0.35 + technical * 0.25;
  }

  private scoreSponsorFinancial(): number {
    const rating = this.projectData.sponsor.rating;
    const liquidityRatio = this.projectData.sponsor.liquidityRatio ?? 0;

    if (rating === RatingScale.AAA || rating === RatingScale.AA)
      return 10;
    if (rating === RatingScale.A || rating === RatingScale.BBB)
      return 8;
    if (rating === RatingScale.BB) return 6;
    if (rating === RatingScale.B) return 4;
    if (liquidityRatio < 0.1) return 1; // CRITICAL
    return 3;
  }

  private scoreSponsorExperience(): number {
    const projects = this.projectData.sponsor.track_record_projects ?? 0;
    const successRate =
      this.projectData.sponsor.track_record_success_rate ?? 0;

    if (projects >= 10 && successRate >= 0.95) return 10;
    if (projects >= 5 && successRate >= 0.9) return 9;
    if (projects >= 2 && successRate >= 0.8) return 8;
    if (projects >= 1) return 6;
    return 2;
  }

  private scoreSponsorTechnical(): number {
    // Placeholder: would analyze team expertise, certifications
    // For now, return neutral score
    return 7;
  }

  private calculateD1_2_ProjectStructure(): number {
    // D1.2 analysis: SPV clarity, shareholder agreements, contractual cohesion
    // Placeholder calculation
    return 8;
  }

  private calculateD1_3_PermitsLand(): number {
    // D1.3 analysis: Permits obtained, land rights security
    // Placeholder calculation
    return 8.5;
  }

  /**
   * D2 - Host Country (10%)
   */
  private calculateD2_HostCountry(): number {
    // D2.1 - Regulatory Environment (35%)
    // D2.2 - FX & Repatriation Risk (35%)
    // D2.3 - Sovereign Support (30%)
    const score = 8.0; // Placeholder

    this.domainScores.set(DomainCode.D2, {
      domainId: DomainCode.D2,
      domainCode: "HOST_COUNTRY",
      domainName: "Host Country",
      weight: DOMAIN_WEIGHTS[DomainCode.D2],
      subCriteria: [],
      aggregatedScore: score,
      rating: this.scoreToRating(score),
      probabilityOfDefault: this.getProbabilityOfDefault(
        this.scoreToRating(score)
      ),
    });

    return score;
  }

  /**
   * D3 - Construction Phase (15%)
   */
  private calculateD3_ConstructionPhase(): number {
    // D3.1 - EPC Completion Risk (35%)
    // D3.2 - Interfaces & Execution Risk (35%)
    // D3.3 - Insurance & Risk Mitigation (30%)
    const score = 8.3; // Placeholder

    this.domainScores.set(DomainCode.D3, {
      domainId: DomainCode.D3,
      domainCode: "CONSTRUCTION_PHASE",
      domainName: "Construction Phase",
      weight: DOMAIN_WEIGHTS[DomainCode.D3],
      subCriteria: [],
      aggregatedScore: score,
      rating: this.scoreToRating(score),
      probabilityOfDefault: this.getProbabilityOfDefault(
        this.scoreToRating(score)
      ),
    });

    return score;
  }

  /**
   * D4 - Operation Phase (15%)
   */
  private calculateD4_OperationPhase(): number {
    // D4.1 - O&M Contract Quality (35%)
    // D4.2 - Technology Reliability (35%)
    // D4.3 - Maintenance & Resilience (30%)
    const score = 8.2; // Placeholder

    this.domainScores.set(DomainCode.D4, {
      domainId: DomainCode.D4,
      domainCode: "OPERATION_PHASE",
      domainName: "Operation Phase",
      weight: DOMAIN_WEIGHTS[DomainCode.D4],
      subCriteria: [],
      aggregatedScore: score,
      rating: this.scoreToRating(score),
      probabilityOfDefault: this.getProbabilityOfDefault(
        this.scoreToRating(score)
      ),
    });

    return score;
  }

  /**
   * D5 - Revenue & Market (15%) - CRITICAL
   */
  private calculateD5_RevenueMarket(): number {
    // D5.1 - Offtaker Quality (35%)
    const d5_1 = this.calculateD5_1_OfftakerQuality();

    // D5.2 - PPA Solidity (35%)
    const d5_2 = this.calculateD5_2_PPASolidity();

    // D5.3 - Market Stability (30%)
    const d5_3 = this.calculateD5_3_MarketStability();

    const score = d5_1 * 0.35 + d5_2 * 0.35 + d5_3 * 0.3;

    this.domainScores.set(DomainCode.D5, {
      domainId: DomainCode.D5,
      domainCode: "REVENUE_MARKET",
      domainName: "Revenue & Market",
      weight: DOMAIN_WEIGHTS[DomainCode.D5],
      subCriteria: [],
      aggregatedScore: score,
      rating: this.scoreToRating(score),
      probabilityOfDefault: this.getProbabilityOfDefault(
        this.scoreToRating(score)
      ),
    });

    return score;
  }

  private calculateD5_1_OfftakerQuality(): number {
    const rating = this.projectData.offtaker?.rating;

    if (rating === RatingScale.AAA || rating === RatingScale.AA)
      return 10;
    if (rating === RatingScale.A) return 9;
    if (rating === RatingScale.BBB) return 8;
    if (rating === RatingScale.BB) return 7;
    if (rating === RatingScale.B) return 5;
    if (rating === RatingScale.CCC) return 3;
    return 1;
  }

  private calculateD5_2_PPASolidity(): number {
    const ppaData = this.projectData.ppaData;
    if (!ppaData) return 1; // NO-GO: no PPA

    const duration = ppaData.duration ?? 0;
    const takeOrPayPercent = ppaData.takeOrPayPercent ?? 0;
    const indexation = ppaData.indexation?.type ?? "FIXED";

    let score = 7;

    // Duration penalty
    if (duration < 12) score -= 3;
    else if (duration < 15) score -= 1;

    // Take-or-pay bonus
    if (takeOrPayPercent >= 95) score += 1;
    else if (takeOrPayPercent >= 80) score += 0.5;
    else if (takeOrPayPercent < 40) score -= 3; // MALUS

    // Indexation bonus
    if (indexation === "CPI" || indexation === "HYBRID") score += 1.5;

    return Math.min(10, Math.max(1, score));
  }

  private calculateD5_3_MarketStability(): number {
    // Placeholder: would analyze market growth, concentration, etc.
    return 7.9;
  }

  /**
   * D6 - Financial Structure (15%)
   */
  private calculateD6_FinancialStructure(): number {
    // D6.1 - Leverage & Protections (30%)
    // D6.2 - Hedging & Risk Mgmt (25%)
    // D6.3 - Amortization (25%)
    // D6.4 - Covenants (20%)
    const score = 8.3; // Placeholder

    this.domainScores.set(DomainCode.D6, {
      domainId: DomainCode.D6,
      domainCode: "FINANCIAL_STRUCTURE",
      domainName: "Financial Structure",
      weight: DOMAIN_WEIGHTS[DomainCode.D6],
      subCriteria: [],
      aggregatedScore: score,
      rating: this.scoreToRating(score),
      probabilityOfDefault: this.getProbabilityOfDefault(
        this.scoreToRating(score)
      ),
    });

    return score;
  }

  /**
   * D7 - Financial Structure & Cash Flow (15%) - CRITICAL
   */
  private calculateD7_FinancialStructureCashFlow(): number {
    // D7.1 - Financial Structure (35%)
    // D7.2 - Cash Flow Predictability (30%)
    // D7.3 - Debt Service Capacity (35%) ← DSCR ANALYSIS

    const dscr = this.projectData.financial.dscr ?? 1.0;
    const dscrScore = this.scoreDSCR(dscr);

    const score = 8.5; // Simplified

    this.domainScores.set(DomainCode.D7, {
      domainId: DomainCode.D7,
      domainCode: "FINANCIAL_STRUCTURE_CASHFLOW",
      domainName: "Financial Structure & Cash Flow",
      weight: DOMAIN_WEIGHTS[DomainCode.D7],
      subCriteria: [],
      aggregatedScore: score,
      rating: this.scoreToRating(score),
      probabilityOfDefault: this.getProbabilityOfDefault(
        this.scoreToRating(score)
      ),
    });

    return score;
  }

  private scoreDSCR(dscr: number): number {
    if (dscr >= 1.4) return 10;
    if (dscr >= 1.3) return 9;
    if (dscr >= 1.25) return 8;
    if (dscr >= 1.2) return 7;
    if (dscr >= 1.15) return 6;
    if (dscr >= 1.1) return 5;
    if (dscr >= 1.05) return 3;
    return 1; // NOGO
  }

  /**
   * D8 - Legal & Documentation (10%)
   */
  private calculateD8_Legal(): number {
    // D8.1 - Contractual Framework (40%)
    // D8.2 - Security Package (35%)
    // D8.3 - Legal Risk Environment (25%)
    const score = 8.5; // Placeholder

    this.domainScores.set(DomainCode.D8, {
      domainId: DomainCode.D8,
      domainCode: "LEGAL_DOCUMENTATION",
      domainName: "Legal & Documentation",
      weight: DOMAIN_WEIGHTS[DomainCode.D8],
      subCriteria: [],
      aggregatedScore: score,
      rating: this.scoreToRating(score),
      probabilityOfDefault: this.getProbabilityOfDefault(
        this.scoreToRating(score)
      ),
    });

    return score;
  }

  /**
   * D9 - ESG & Climate (10%)
   */
  private calculateD9_ESGClimate(): number {
    // D9.1 - Environmental (25%)
    // D9.2 - Social (25%)
    // D9.3 - Governance (20%)
    // D9.4 - Climate Risk (30%)

    const climateRisk = this.projectData.esg?.climateRisk ?? "MEDIUM";
    let score = 8;

    if (climateRisk === "HIGH") score -= 2;
    if (climateRisk === "LOW") score += 1; // Positive adjustments for low risk

    this.domainScores.set(DomainCode.D9, {
      domainId: DomainCode.D9,
      domainCode: "ESG_CLIMATE",
      domainName: "ESG & Climate",
      weight: DOMAIN_WEIGHTS[DomainCode.D9],
      subCriteria: [],
      aggregatedScore: score,
      rating: this.scoreToRating(score),
      probabilityOfDefault: this.getProbabilityOfDefault(
        this.scoreToRating(score)
      ),
    });

    return score;
  }

  // ========================================================================
  // AGGREGATION & TRANSFORMATION
  // ========================================================================

  private aggregateGlobalScore(): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [domainCode, score] of this.domainScores) {
      const weight = DOMAIN_WEIGHTS[domainCode];
      weightedSum += score.aggregatedScore * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 5;
  }

  private scoreToRating(score: number): RatingScale {
    for (const [threshold, rating] of SCORE_TO_RATING_THRESHOLDS) {
      if (score >= threshold) return rating;
    }
    return RatingScale.D;
  }

  private getProbabilityOfDefault(rating: RatingScale): number {
    const thresholds: Record<RatingScale, number> = {
      [RatingScale.AAA]: 0.005,
      [RatingScale.AA]: 0.01,
      [RatingScale.A]: 0.015,
      [RatingScale.BBB]: 0.025,
      [RatingScale.BB]: 0.04,
      [RatingScale.B]: 0.065,
      [RatingScale.CCC]: 0.12,
      [RatingScale.D]: 0.25,
    };

    return thresholds[rating] ?? 0.15;
  }

  private validateInput(): void {
    if (!this.projectData.projectId)
      throw new Error("Project ID required");
    if (!this.projectData.projectName)
      throw new Error("Project name required");
  }

  private buildRejectionResult(): ScoringResult {
    return {
      evaluationId: `eval-${Date.now()}`,
      projectId: this.projectData.projectId,
      projectName: this.projectData.projectName,
      domains: {},
      globalScore: 0,
      normalizedScore: 0,
      rating: RatingScale.D,
      probabilityOfDefault: 1.0,
      triggeredNOGOs: this.triggeredNOGOs,
      appliedMALUS: [],
      malusTotal: 0,
      finalScore: 0,
      recommendation: "REJECT",
      calculatedAt: new Date(),
      version: "7.0",
    };
  }

  private getRecommendation(
    score: number,
    noGos: NOGORule[]
  ): "APPROVE" | "APPROVE_WITH_CONDITIONS" | "REJECT" {
    if (noGos.some((r) => r.triggered)) return "REJECT";
    if (score >= 7.0) return "APPROVE";
    if (score >= 6.0) return "APPROVE_WITH_CONDITIONS";
    return "REJECT";
  }
}

export default ScoringEngine;
