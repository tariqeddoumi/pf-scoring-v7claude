/**
 * Configuration du Modèle de Scoring PF V7++
 * Structure globale des 9 domaines + critères + poids
 */

export const SCORING_MODEL_V7 = {
  version: "7.0",
  label: "Project Finance Scoring Model V7++",
  dateEffect: "2026-04-02",
  totalWeight: 100,
  domains: [
    {
      id: "D1",
      code: "PROJECT_FUNDAMENTALS",
      label: "Project Fundamentals",
      weight: 10, // %
      description: "Sponsor strength, project structure, permits & land",
      subdomains: [
        {
          id: "D1.1",
          code: "SPONSOR_STRENGTH",
          label: "Sponsor Strength",
          weight: 0.35, // 35% of D1
          criteria: [
            {
              id: "D1.1.1",
              code: "FINANCIAL_SOLIDITY",
              label: "Sponsor Financial Solidity",
              weight: 0.4,
              type: "QUALITATIVE",
              scale: {
                min: 2,
                max: 10,
                step: 0.5,
                levels: [
                  { value: 10, label: "Sponsor IG - Very solid balance sheet" },
                  { value: 8, label: "Solid sponsor - Non-IG" },
                  { value: 6, label: "Moderate sponsor" },
                  { value: 4, label: "Fragile sponsor" },
                ],
              },
              redFlagThreshold: 4,
              noGoThreshold: 2,
              source:
                "Financial statements, Credit rating, Internal bank database",
            },
            {
              id: "D1.1.2",
              code: "SECTOR_EXPERIENCE",
              label: "Sponsor Sector Experience",
              weight: 0.3,
              type: "QUALITATIVE",
              scale: {
                min: 2,
                max: 10,
                step: 0.5,
                levels: [
                  { value: 10, label: ">10 similar projects delivered" },
                  { value: 8, label: "Solid experience" },
                  { value: 6, label: "Limited experience" },
                  { value: 4, label: "No experience" },
                ],
              },
              redFlagThreshold: 4,
              noGoThreshold: 2,
            },
            {
              id: "D1.1.3",
              code: "SPONSOR_ENGAGEMENT",
              label: "Sponsor Engagement & Commitment",
              weight: 0.3,
              type: "QUALITATIVE",
              scale: {
                min: 2,
                max: 10,
                step: 0.5,
                levels: [
                  { value: 10, label: ">30% equity + long-term commitment" },
                  { value: 8, label: "Good engagement" },
                  { value: 6, label: "Low involvement" },
                  { value: 4, label: "Passive sponsor" },
                ],
              },
              redFlagThreshold: 4,
              noGoThreshold: 2,
            },
          ],
        },
        {
          id: "D1.2",
          code: "PROJECT_STRUCTURE",
          label: "Project Structure & Contracts",
          weight: 0.35, // 35% of D1
          criteria: [
            {
              id: "D1.2.1",
              code: "SPV_STRUCTURE",
              label: "SPV Structure & Ring-Fencing",
              weight: 0.3,
              type: "QUALITATIVE",
              scale: {
                min: 2,
                max: 10,
                step: 0.5,
                levels: [
                  { value: 10, label: "Clean SPV - Fully ring-fenced" },
                  { value: 8, label: "Correct structure" },
                  { value: 6, label: "Complex structure" },
                  { value: 4, label: "No SPV / Mixed activities" },
                ],
              },
              redFlagThreshold: 4,
              noGoThreshold: 2,
            },
            {
              id: "D1.2.2",
              code: "KEY_CONTRACTS",
              label: "Key Project Contracts",
              weight: 0.4,
              type: "QUALITATIVE",
              scale: {
                min: 2,
                max: 10,
                step: 0.5,
                levels: [
                  { value: 10, label: "Solid, balanced contracts" },
                  { value: 8, label: "Correct contracts" },
                  { value: 6, label: "Incomplete contracts" },
                  { value: 4, label: "Missing contracts" },
                ],
              },
              redFlagThreshold: 4,
              noGoThreshold: 2,
            },
            {
              id: "D1.2.3",
              code: "RISK_ALLOCATION",
              label: "Risk Allocation",
              weight: 0.3,
              type: "QUALITATIVE",
              scale: {
                min: 2,
                max: 10,
                step: 0.5,
                levels: [
                  { value: 10, label: "Well-allocated risks" },
                  { value: 8, label: "Correct allocation" },
                  { value: 6, label: "Some imbalances" },
                  { value: 4, label: "Poorly allocated" },
                ],
              },
              redFlagThreshold: 4,
              noGoThreshold: 2,
            },
          ],
        },
        {
          id: "D1.3",
          code: "PERMITS_LAND",
          label: "Permits & Land",
          weight: 0.3, // 30% of D1
          criteria: [
            {
              id: "D1.3.1",
              code: "PERMITS_AUTHORIZATIONS",
              label: "Permits & Authorizations",
              weight: 0.4,
              type: "QUALITATIVE",
              scale: {
                min: 2,
                max: 10,
                step: 0.5,
                levels: [
                  { value: 10, label: "All permits obtained" },
                  { value: 8, label: "Permits well-advanced" },
                  { value: 6, label: "Partial permits" },
                  { value: 4, label: "Permits missing" },
                ],
              },
              redFlagThreshold: 4,
              noGoThreshold: 2,
            },
            {
              id: "D1.3.2",
              code: "LAND_SECURITY",
              label: "Land Security",
              weight: 0.4,
              type: "QUALITATIVE",
              scale: {
                min: 2,
                max: 10,
                step: 0.5,
                levels: [
                  { value: 10, label: "Ownership or long-term lease secured" },
                  { value: 8, label: "Secured with conditions" },
                  { value: 6, label: "Some uncertainties" },
                  { value: 4, label: "Land not secured" },
                ],
              },
              redFlagThreshold: 4,
              noGoThreshold: 2,
            },
            {
              id: "D1.3.3",
              code: "SOCIAL_ENV_RISK",
              label: "Social & Environmental Risk",
              weight: 0.2,
              type: "QUALITATIVE",
              scale: {
                min: 2,
                max: 10,
                step: 0.5,
                levels: [
                  { value: 10, label: "Strong acceptance" },
                  { value: 8, label: "Moderate risks" },
                  { value: 6, label: "Some contestation" },
                  { value: 4, label: "Strong opposition" },
                ],
              },
              redFlagThreshold: 4,
              noGoThreshold: 2,
            },
          ],
        },
      ],
    },
    // D2-D9 à ajouter au fur et à mesure
    {
      id: "D2",
      code: "HOST_COUNTRY",
      label: "Host Country",
      weight: 10,
      description: "Regulatory environment, FX, sovereign support",
      subdomains: [], // À remplir avec domaine 2 complet
    },
    {
      id: "D3",
      code: "CONSTRUCTION_PHASE",
      label: "Construction Phase",
      weight: 15,
      description: "EPC, completion risk, insurance",
      subdomains: [],
    },
    {
      id: "D4",
      code: "MARKET_RISK",
      label: "Market Risk",
      weight: 10,
      description: "Revenue stability, offtake, market exposure",
      subdomains: [],
    },
    {
      id: "D5",
      code: "OPERATIONAL_RISK",
      label: "Operational Risk",
      weight: 10,
      description: "O&M, technology reliability, maintenance",
      subdomains: [],
    },
    {
      id: "D6",
      code: "COUNTERPARTY_RISK",
      label: "Counterparty Risk",
      weight: 10,
      description: "EPC contractor, O&M operator, offtaker quality",
      subdomains: [],
    },
    {
      id: "D7",
      code: "FINANCIAL_STRUCTURE",
      label: "Financial Structure & Cash Flow",
      weight: 15,
      description: "DSCR, LLCR, leverage, hedging",
      subdomains: [],
    },
    {
      id: "D8",
      code: "LEGAL_DOCUMENTATION",
      label: "Legal & Documentation",
      weight: 10,
      description: "Security package, covenants, step-in rights",
      subdomains: [],
    },
    {
      id: "D9",
      code: "ESG_CLIMATE",
      label: "ESG & Climate",
      weight: 10,
      description: "Environmental, social, governance, climate risk",
      subdomains: [],
    },
  ],
};

/**
 * NO-GO RULES ENGINE
 * Conditions bloquantes automatiques
 */
export const NO_GO_RULES = [
  {
    id: "NOGO_1",
    label: "DSCR < 1.1",
    type: "FINANCIAL",
    severity: "CRITICAL",
    description: "Debt Service Coverage Ratio below 1.1",
    condition: { field: "dscr", operator: "<", value: 1.1 },
    action: "BLOCK",
  },
  {
    id: "NOGO_2",
    label: "Missing EPC Contract",
    type: "LEGAL",
    severity: "CRITICAL",
    description: "Absence of structured EPC contract",
    condition: { field: "epc_status", operator: "==", value: "MISSING" },
    action: "BLOCK",
  },
  {
    id: "NOGO_3",
    label: "Missing PPA/Offtake",
    type: "COMMERCIAL",
    severity: "CRITICAL",
    description: "Absence of Power Purchase Agreement or offtake contract",
    condition: { field: "ppa_status", operator: "==", value: "MISSING" },
    action: "BLOCK",
  },
  {
    id: "NOGO_4",
    label: "Critical Sovereign Risk",
    type: "COUNTRY",
    severity: "CRITICAL",
    description: "Host country in critical risk category",
    condition: { field: "country_risk", operator: "==", value: "CRITICAL" },
    action: "BLOCK",
  },
  {
    id: "NOGO_5",
    label: "No Security Package",
    type: "LEGAL",
    severity: "CRITICAL",
    description: "Absence of minimal security package",
    condition: {
      field: "security_package_completeness",
      operator: "<",
      value: 0.6,
    },
    action: "BLOCK",
  },
];

/**
 * MALUS RULES (Score Adjustments)
 * Réductions automatiques du score
 */
export const MALUS_RULES = [
  {
    id: "MALUS_1",
    label: "DSRA < 3 months",
    value: -5,
    condition: { field: "dsra_months", operator: "<", value: 3 },
  },
  {
    id: "MALUS_2",
    label: "Non-turnkey EPC",
    value: -3,
    condition: { field: "epc_type", operator: "!=", value: "TURNKEY" },
  },
  {
    id: "MALUS_3",
    label: "Immature Technology",
    value: -5,
    condition: { field: "technology_maturity", operator: "<", value: 6 },
  },
  {
    id: "MALUS_4",
    label: "High Sponsor Dependency",
    value: -3,
    condition: { field: "sponsor_dependency", operator: ">", value: 0.8 },
  },
  {
    id: "MALUS_5",
    label: "FX not hedged",
    value: -4,
    condition: { field: "fx_hedged", operator: "==", value: false },
  },
];

/**
 * SCORE TO RATING MAPPING
 */
export const SCORE_TO_RATING = [
  { minScore: 8.5, maxScore: 10, rating: "AAA", risk: "VERY_LOW", pd: 0.005 },
  { minScore: 7.5, maxScore: 8.5, rating: "AA", risk: "LOW", pd: 0.01 },
  { minScore: 6.5, maxScore: 7.5, rating: "A", risk: "MODERATE", pd: 0.025 },
  { minScore: 5.5, maxScore: 6.5, rating: "BBB", risk: "ACCEPTABLE", pd: 0.05 },
  { minScore: 4.5, maxScore: 5.5, rating: "BB", risk: "RISKY", pd: 0.1 },
  { minScore: 3.5, maxScore: 4.5, rating: "B", risk: "VERY_RISKY", pd: 0.2 },
  { minScore: 0, maxScore: 3.5, rating: "CCC", risk: "CRITICAL", pd: 0.35 },
];

/**
 * CREDIT DECISION MATRIX
 */
export const CREDIT_DECISION_MATRIX = {
  AAA: { decision: "AUTO_ACCEPT", conditions: null },
  AA: { decision: "AUTO_ACCEPT", conditions: "minimal" },
  A: { decision: "ACCEPT_WITH_CONDITIONS", conditions: "standard" },
  BBB: { decision: "ACCEPT_WITH_CONDITIONS", conditions: "strict" },
  BB: { decision: "DEEP_ANALYSIS_REQUIRED", conditions: "very_strict" },
  B: { decision: "REJECT_UNLESS_EXCEPTION", conditions: "exception" },
  CCC: { decision: "AUTO_REJECT", conditions: null },
};

/**
 * RED FLAGS DETECTION
 */
export const RED_FLAGS = [
  { id: "RF_1", label: "Weak Sponsor", severity: "HIGH" },
  { id: "RF_2", label: "Inexperienced EPC", severity: "HIGH" },
  { id: "RF_3", label: "FX Not Covered", severity: "MEDIUM" },
  { id: "RF_4", label: "Immature Technology", severity: "HIGH" },
  { id: "RF_5", label: "Critical Refinancing Risk", severity: "CRITICAL" },
  { id: "RF_6", label: "Weak Offtaker", severity: "MEDIUM" },
  { id: "RF_7", label: "Missing Key Contracts", severity: "CRITICAL" },
  { id: "RF_8", label: "Weak Security Package", severity: "MEDIUM" },
  { id: "RF_9", label: "Environmental Concerns", severity: "MEDIUM" },
  { id: "RF_10", label: "Social Opposition", severity: "MEDIUM" },
];

/**
 * HEATMAP COLOR MAPPING
 */
export const HEATMAP_COLORS = {
  8: { color: "#10b981", level: "LOW_RISK" }, // Green
  6: { color: "#f59e0b", level: "MODERATE_RISK" }, // Orange
  4: { color: "#ef4444", level: "HIGH_RISK" }, // Red
  2: { color: "#7f1d1d", level: "CRITICAL_RISK" }, // Dark Red
};

/**
 * Type helpers
 */
export type ScoringDomain = (typeof SCORING_MODEL_V7.domains)[0];
export type ScoringSubdomain = ScoringDomain["subdomains"][0];
export type ScoringCriterion = ScoringSubdomain["criteria"][0];
export type NoGoRule = (typeof NO_GO_RULES)[0];
export type MalusRule = (typeof MALUS_RULES)[0];
export type ScoreRating = (typeof SCORE_TO_RATING)[0];
