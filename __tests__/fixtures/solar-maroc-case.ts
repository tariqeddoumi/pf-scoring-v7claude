/**
 * Solar Maroc Case Study - Test Fixture
 * Real-world project finance scoring example
 */

import { ProjectData } from "@/types/scoring-v7plus";

export const SOLAR_MAROC_FIXTURE: ProjectData = {
  projectId: "proj-solar-maroc-001",
  projectName: "Solar Farm Maroc - 50MW PV Project",
  sector: "Renewable Energy - Solar",
  description: "Utility-scale photovoltaic solar farm in Ouarzazate, Morocco",

  // ============================================================================
  // D1: PROJECT FUNDAMENTALS (20% weight)
  // ============================================================================
  projectFundamentals: {
    projectCost: 55_000_000, // MAD 55M (~$5.5M USD)
    projectCostStatus: "finalized",
    technologyMaturity: 9, // Proven solar PV technology
    projectCertifications: ["ISO 9001", "IEC 61215"],
    hasDetailedEngineering: true,
    engineeringCompleteness: 95,
  },

  // ============================================================================
  // D2: HOST COUNTRY (10% weight)
  // ============================================================================
  hostCountry: {
    country: "Morocco",
    countryCode: "MA",
    countryRating: "BBB", // S&P sovereign rating
    politicalRisk: "LOW",
    currencyRisk: "MEDIUM",
    transferRisk: "MEDIUM",
    naturalDisasterRisk: "LOW",
    conflictRisk: "LOW",
  },

  // ============================================================================
  // D3: CONSTRUCTION PHASE (15% weight)
  // ============================================================================
  construction: {
    epcContractorName: "Siemens Energy / Local Partner",
    epcContractorRating: "AAA",
    constructionPeriod: 18, // months
    completionDate: new Date("2025-12-31"),
    epcInsolvencyRisk: "LOW",
    epcGuarantees: true,
    guaranteeType: "Performance Bond + Parent Guarantee",
    guaranteeAmount: 2_750_000, // 5% of project cost
    constructionInsuranceInPlace: true,
  },

  // ============================================================================
  // D4: OPERATION PHASE (15% weight)
  // ============================================================================
  operation: {
    expectedProjectLife: 25, // years
    operatorName: "ONEE (Morocco) / EDF Renewables",
    operatorExperience: 20, // years in solar operations
    operatorFiability: 8, // 1-10 scale
    operationCost: 1_100_000, // MAD/year (2% of capex)
    maintenanceModel: "Full-service agreement with OEM",
    performanceGarantee: true,
    performanceGuaranteeLevel: 95, // 95% availability
  },

  // ============================================================================
  // D5: REVENUE & MARKET (15% weight)
  // ============================================================================
  revenue: {
    // PPA (Power Purchase Agreement) with ONEE
    hasPublicPPA: true,
    ppaType: "Government PPA",
    ppaTermYears: 20,
    ppaTakeOrPay: true,
    takeOrPayPercentage: 90, // 90% of contracted capacity
    ppaCounterparty: "ONEE",
    counterpartyRating: "AA", // Government entity
    ppaIndexation: true,
    indexationType: "CPI",
    ppaEscalation: 2.5, // % annual escalation

    // Offtaker information
    offtakerName: "ONEE",
    offtakerRating: "AA",
    offtakerLiquidityRatio: 1.45,
    offtakerLeverage: 0.65,

    // Market conditions
    electricityDemandGrowth: 3.5, // % CAGR
    marketStability: "STABLE",
    regulatoryStability: true,
    technologicalRisk: "LOW", // Solar is mature
  },

  // ============================================================================
  // D6 & D7: FINANCIAL STRUCTURE & DEBT SERVICE (15% + 15% weight)
  // ============================================================================
  financialStructure: {
    projectEquity: 11_000_000, // 20% equity
    projectDebt: 44_000_000, // 80% debt
    equityToDebtRatio: 0.25, // 25% equity, 75% debt
    debtStructure: "Senior Debt + Subordinated Debt",
    seniorDebtAmount: 33_000_000, // 75% of total debt
    seniorDebtRate: 5.5, // % p.a.
    seniorDebtTerm: 15, // years
    subordinatedDebtAmount: 11_000_000, // 25% of total debt
    subordinatedDebtRate: 8.5, // % p.a.
    subordinatedDebtTerm: 20, // years

    // Cash flow metrics
    estimatedAnnualRevenue: 7_700_000, // Based on 50MW @ capacity factor ~18%
    estimatedAnnualDebtService: 5_280_000, // DSRA sizing
    dscr: 1.45, // Debt Service Coverage Ratio (base case)
    dscrStressed: 1.30, // Under stress
    reserveFunds: true,
    dscaPercentage: 15, // Debt Service Reserve Account = 15% of annual DS

    // Sponsor strength
    sponsorName: "EDF Renewables Africa",
    sponsorRating: "AA",
    sponsorEquityContribution: true,
    sponsorGuarantees: false, // Non-recourse to sponsor
  },

  // ============================================================================
  // D8: LEGAL & DOCUMENTATION (10% weight)
  // ============================================================================
  legal: {
    projectAgreementQuality: 9, // 1-10 scale
    hasEnforcableContracts: true,
    contractsQuality: "HIGH",
    jurisdiction: "Morocco",
    riskOfLitigation: "LOW",
    insuranceStructure: "Comprehensive (property, liability, business interruption)",
    insuranceCoverage: "Full project coverage",
    insuranceCarrier: "AXA / Munich Re",
    insuranceRating: "AAA",
  },

  // ============================================================================
  // D9: ESG & CLIMATE (10% weight)
  // ============================================================================
  esg: {
    environmentalRating: "POSITIVE", // Renewable energy = positive environmental impact
    socialImpactScore: 8, // Community employment, skills transfer
    governanceScore: 8, // Strong sponsor governance
    climateRisk: "LOW", // Solar is climate-resilient technology
    carbonEmissionAvoidance: 45_000, // tCO2e per year avoided
    socialRisk: "LOW",
  },
};

/**
 * Expected scoring result for Solar Maroc
 * Based on methodology: Should achieve A rating, score ~8.08
 */
export const SOLAR_MAROC_EXPECTED = {
  rating: "A",
  finalScore: 8.08,
  recommendation: "APPROVE",
  probabilityOfDefault: 0.015,
  triggeredNOGOs: [] as string[], // No NO-GO rules should trigger
  appliedMALUS: [] as string[], // No MALUS should apply (excellent project)
};
