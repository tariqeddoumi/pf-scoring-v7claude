/**
 * PF Scoring V7++ - TypeScript Type Definitions
 * Complete type system for Project Finance scoring model
 * Strict TypeScript mode required
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum DomainCode {
  D1 = "D1", // Project Fundamentals
  D2 = "D2", // Host Country
  D3 = "D3", // Construction Phase
  D4 = "D4", // Operation Phase
  D5 = "D5", // Revenue & Market
  D6 = "D6", // Financial Structure
  D7 = "D7", // Financial Structure & Cash Flow
  D8 = "D8", // Legal & Documentation
  D9 = "D9", // ESG & Climate
}

export enum RatingScale {
  AAA = "AAA",
  AA = "AA",
  A = "A",
  BBB = "BBB",
  BB = "BB",
  B = "B",
  CCC = "CCC",
  D = "D",
}

export enum ScoringStatus {
  PASS = "PASS",
  CAUTION = "CAUTION",
  MARGINAL = "MARGINAL",
  FAIL = "FAIL",
  CRITICAL = "CRITICAL",
}

export enum RuleCategory {
  NO_GO = "NO_GO",
  MALUS = "MALUS",
  WARNING = "WARNING",
}

export enum RuleSeverity {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export enum StressScenario {
  REVENUE_DECLINE_10 = "REVENUE_DECLINE_10",
  COST_INFLATION_5 = "COST_INFLATION_5",
  CONSTRUCTION_DELAY_6M = "CONSTRUCTION_DELAY_6M",
  INTEREST_RATE_200BPS = "INTEREST_RATE_200BPS",
  FX_DEPRECIATION_10 = "FX_DEPRECIATION_10",
  MARKET_DECAY_2_CAGR = "MARKET_DECAY_2_CAGR",
  COMBINED_PERFECT_STORM = "COMBINED_PERFECT_STORM",
}

export enum DataCompletenesStatus {
  COMPLETE = "COMPLETE",
  PARTIAL = "PARTIAL",
  MISSING = "MISSING",
}

export enum EvaluationStatus {
  draft = "draft",
  in_progress = "in_progress",
  completed = "completed",
  reviewed = "reviewed",
  archived = "archived",
}

// ============================================================================
// DOMAIN & CRITERION TYPES
// ============================================================================

/**
 * Base scoring unit: a criterion that gets a 1-10 score
 */
export interface CriterionScore {
  criterionId: string; // e.g., "D1.1.1" (domain.subdomain.criterion)
  code: string; // e.g., "SPONSOR_STRENGTH"
  weight: number; // 0.0 to 1.0
  score: number; // 1.0 to 10.0
  justification?: string; // Analyst notes
  redFlagsTriggered?: string[]; // e.g., ["NOGO_1A", "MALUS_5B"]
}

/**
 * Aggregated sub-criterion score (D1.1, D1.2, etc.)
 */
export interface SubCriterionScore {
  subCriterionId: string; // e.g., "D1.1"
  code: string; // e.g., "SPONSOR_STRENGTH"
  weight: number;
  childCriteria: CriterionScore[];
  aggregatedScore: number; // Weighted average of children
}

/**
 * Domain-level score (D1, D2, etc.)
 */
export interface DomainScore {
  domainId: DomainCode;
  domainCode: string; // "PROJECT_FUNDAMENTALS"
  domainName: string; // "Project Fundamentals"
  weight: number; // 0.20 for D1, 0.10 for D2, etc.
  subCriteria: SubCriterionScore[];
  aggregatedScore: number; // Weighted average of sub-criteria
  rating: RatingScale;
  probabilityOfDefault: number; // e.g., 0.015 for A rating
}

// ============================================================================
// GLOBAL SCORING RESULT
// ============================================================================

export interface ScoringResult {
  evaluationId: string;
  projectId: string;
  projectName: string;

  // Domain scores (all 9)
  domains: {
    [key in DomainCode]?: DomainScore;
  };

  // Global metrics
  globalScore: number; // 1.0 to 10.0
  normalizedScore: number; // After normalization (pondérations sum to 135%)
  rating: RatingScale;
  probabilityOfDefault: number;

  // Rules applied
  triggeredNOGOs: NOGORule[];
  appliedMALUS: MALUSRule[];
  malusTotal: number; // Total penalty points

  // Final adjusted score
  finalScore: number; // globalScore - malusTotal

  // Recommendation
  recommendation: "APPROVE" | "APPROVE_WITH_CONDITIONS" | "REJECT";
  conditions?: string[];
  justification?: string;

  // Metadata
  calculatedAt: Date;
  analystName?: string;
  version: string; // "7.0"
}

// ============================================================================
// RULES ENGINE
// ============================================================================

/**
 * NO-GO Rule: automatic rejection if triggered
 */
export interface NOGORule {
  ruleId: string; // e.g., "NOGO_1A"
  category: string; // "Sponsor", "Country", "Construction", etc.
  condition: string; // Description of condition
  severity: RuleSeverity.CRITICAL;
  description: string;
  workaround?: string;
  triggered: boolean;
  evidence?: string; // What data triggered it
}

/**
 * MALUS Rule: score reduction if triggered
 */
export interface MALUSRule {
  ruleId: string; // e.g., "MALUS_5A"
  domain: DomainCode;
  condition: string;
  penaltyPoints: number; // Negative, e.g., -5
  triggerLevel: string;
  mitigation?: string;
  triggered: boolean;
  evidence?: string;
}

// ============================================================================
// STRESS TESTING
// ============================================================================

export interface StressTestScenario {
  scenarioId: StressScenario;
  name: string;
  description: string;
  assumption: string;

  // Input assumptions
  revenueMultiplier?: number; // 0.90 for -10%
  costMultiplier?: number; // 1.05 for +5%
  delayMonths?: number; // 6 for +6m
  interestRateIncreaseBps?: number; // 200 for +200bps
  fxDepreciation?: number; // 0.10 for -10%
  marketDecayCAGR?: number; // -0.02 for -2%

  // Results
  dscrBase?: number;
  dscrStress?: number;
  llcrStress?: number;
  status: ScoringStatus;
  margin?: number; // DSCR - threshold
  notes?: string;
}

export interface StressTestResult {
  evaluationId: string;
  baseCase: {
    dscr: number;
    llcr: number;
    revenue: number;
    debtService: number;
  };
  scenarios: StressTestScenario[];
  perfectStorm?: StressTestScenario;
  summary: {
    allPass: boolean;
    vulnerableScenarios: string[];
    criticalRisks: string[];
    overallRating: "RESILIENT" | "ADEQUATE" | "VULNERABLE" | "CRITICAL";
  };
}

// ============================================================================
// PROJECT INPUT DATA
// ============================================================================

export interface ProjectData {
  projectId: string;
  projectName: string;
  location: string;
  sector: string; // "Energy", "Water", "Transport", "Telecom", etc.
  startDate: Date;
  projectLife: number; // years

  // Sponsor data
  sponsor: {
    name: string;
    countryOfIncorporation: string;
    rating?: RatingScale;
    liquidityRatio?: number;
    equityPercent?: number;
    track_record_projects?: number;
    track_record_success_rate?: number;
  };

  // Offtaker data (if applicable)
  offtaker?: {
    name: string;
    type: "PUBLIC_UTILITY" | "CORPORATE" | "GOVERNMENT" | "OTHER";
    rating?: RatingScale;
    creditRating?: string;
    concentrationPercent?: number;
  };

  // PPA/Revenue contract data
  ppaData?: {
    duration: number; // years
    tariff: number;
    currencyISO: string; // "EUR", "MAD", "USD"
    takeOrPayPercent?: number;
    indexation?: {
      type: "FIXED" | "CPI" | "HYBRID";
      baseRate?: number; // annual escalation if fixed
      indexationFormula?: string;
    };
  };

  // Financial data
  financial: {
    totalCapex: number;
    debtAmount: number;
    equityAmount: number;
    annualOpex?: number;
    annualRevenue?: number;
    debtService?: number;
    dscr?: number;
    llcr?: number;
    debtTenor?: number; // years
  };

  // Technical data
  technology?: {
    trl?: number; // 1-9 (Technology Readiness Level)
    type?: string;
    proven?: boolean;
  };

  // Country/Regulatory
  hostCountry: {
    countryCode: string; // "MA" for Morocco
    regulatoryFramework?: string;
    politicalRiskRating?: string;
    fxRisk?: string;
  };

  // ESG data
  esg?: {
    environmentalImpact?: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
    carbonIntensity?: number; // tCO2e/year
    socialRisk?: "LOW" | "MEDIUM" | "HIGH";
    climateRisk?: "LOW" | "MEDIUM" | "HIGH";
  };
}

// ============================================================================
// VALIDATION & COMPLETENESS
// ============================================================================

export interface DataCompletenessCheck {
  projectId: string;
  overall: DataCompletenesStatus;
  byDomain: {
    [key in DomainCode]?: DataCompletenesStatus;
  };
  missingFields: string[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  value: unknown;
  message: string;
  severity: "ERROR" | "WARNING";
}

// ============================================================================
// COMPLEX INDICATORS (CALCULATED)
// ============================================================================

export interface OfftakerHealthIndex {
  score: number; // 0-10
  rating: RatingScale;
  components: {
    financialRating: number;
    liquidityRatio: number;
    leverageInverse: number;
    sectorStability: number;
  };
}

export interface PPARobustnessScore {
  score: number; // 0-10
  components: {
    duration: number;
    takeOrPayStrength: number;
    indexationCoverage: number;
    penaltyEnforceability: number;
  };
}

export interface MarketResilienceIndex {
  score: number; // 0-10
  components: {
    growthTrajectory: number;
    diversificationScore: number;
    regulatoryStability: number;
    technologyMaturity: number;
  };
}

// ============================================================================
// API REQUEST/RESPONSE
// ============================================================================

export interface ScoringRequestBody {
  projectData: ProjectData;
  includeStressTests?: boolean;
  stressScenarios?: StressScenario[];
  analystName?: string;
}

export interface ScoringResponseBody {
  success: boolean;
  error?: string;
  result?: ScoringResult;
  stressTest?: StressTestResult;
}

export interface StressTestRequestBody {
  evaluationId: string;
  scenarios: StressScenario[];
  projectId?: string;
  analystId?: string;
}

export interface StressTestResponseBody {
  success: boolean;
  error?: string;
  result?: StressTestResult;
}

// ============================================================================
// REPORTING
// ============================================================================

export interface ScoringReport {
  evaluationId: string;
  projectName: string;
  analyst: string;
  reportDate: Date;
  scoring: ScoringResult;
  stressTest?: StressTestResult;
  recommendations: string[];
  conditions: string[];
  nextReviewDate?: Date;
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface EvaluationRecord {
  id: string;
  projectId: string;
  projectName: string;
  scoringResult: ScoringResult;
  stressTestResult?: StressTestResult;
  analystsName?: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

export interface Evaluation {
  id: string;
  projectId: string;
  analystId: string;
  scoringResult: any; // JSON
  stressTestResult?: any; // JSON
  rating: string;
  finalScore: number;
  recommendation: string;
  probabilityOfDefault: number;
  triggeredNOGOs: any;
  appliedMALUS: any;
  malusTotal: number;
  notes?: string;
  status: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: string;
    nom: string;
    name?: string;
  };
  analyst?: {
    id: string;
    email: string;
  };
}

export interface ScoringAuditLog {
  id: string;
  evaluationId: string;
  action: "CREATE" | "UPDATE" | "RECALCULATE" | "STRESS_TEST";
  timestamp: Date;
  analyst: string;
  changes?: Record<string, unknown>;
}
