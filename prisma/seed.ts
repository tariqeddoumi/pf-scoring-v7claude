import prisma from "@/lib/prisma-client";

interface DomainData {
  code: string;
  label: string;
  shortLabel: string;
  description: string;
  weight: number;
  criteria: CriterionData[];
}

interface CriterionData {
  code: string;
  label: string;
  description: string;
  answerType: string;
  weight: number;
  options?: OptionData[];
  ranges?: RangeData[];
}

interface OptionData {
  code: string;
  label: string;
  value: string;
  score: number;
}

interface RangeData {
  label: string;
  minValue: number;
  maxValue: number;
  score: number;
}

const DOMAINS: DomainData[] = [
  {
    code: "D1",
    label: "Financial Risk",
    shortLabel: "Financier",
    description: "Assessment of financial structure and leverage",
    weight: 0.15,
    criteria: [
      {
        code: "D1_C1",
        label: "Leverage Ratio",
        description: "Debt to equity analysis",
        answerType: "NUMERIC_RANGE",
        weight: 0.25,
        ranges: [
          { label: "Very Low (<1.0)", minValue: 0, maxValue: 1.0, score: 90 },
          { label: "Low (1.0-1.5)", minValue: 1.0, maxValue: 1.5, score: 75 },
          { label: "Moderate (1.5-2.0)", minValue: 1.5, maxValue: 2.0, score: 60 },
          { label: "High (2.0-2.5)", minValue: 2.0, maxValue: 2.5, score: 40 },
          { label: "Very High (>2.5)", minValue: 2.5, maxValue: 999, score: 20 },
        ],
      },
      {
        code: "D1_C2",
        label: "Debt Service Coverage Ratio (DSCR)",
        description: "Ability to service debt from cash flow",
        answerType: "NUMERIC_RANGE",
        weight: 0.25,
        ranges: [
          { label: "Excellent (>1.5)", minValue: 1.5, maxValue: 999, score: 90 },
          { label: "Good (1.3-1.5)", minValue: 1.3, maxValue: 1.5, score: 75 },
          { label: "Fair (1.1-1.3)", minValue: 1.1, maxValue: 1.3, score: 60 },
          { label: "Weak (0.9-1.1)", minValue: 0.9, maxValue: 1.1, score: 40 },
          { label: "Poor (<0.9)", minValue: 0, maxValue: 0.9, score: 20 },
        ],
      },
      {
        code: "D1_C3",
        label: "Interest Coverage Ratio",
        description: "EBITDA/Interest expense",
        answerType: "NUMERIC_RANGE",
        weight: 0.2,
        ranges: [
          { label: "Excellent (>3.0)", minValue: 3.0, maxValue: 999, score: 90 },
          { label: "Good (2.0-3.0)", minValue: 2.0, maxValue: 3.0, score: 75 },
          { label: "Fair (1.5-2.0)", minValue: 1.5, maxValue: 2.0, score: 60 },
          { label: "Weak (1.0-1.5)", minValue: 1.0, maxValue: 1.5, score: 40 },
          { label: "Poor (<1.0)", minValue: 0, maxValue: 1.0, score: 20 },
        ],
      },
      {
        code: "D1_C4",
        label: "Reserve Adequacy",
        description: "Maintenance and debt service reserves",
        answerType: "OPTION_SINGLE",
        weight: 0.15,
        options: [
          { code: "OPT_EXC", label: "Excellent", value: "excellent", score: 90 },
          { code: "OPT_GOOD", label: "Good", value: "good", score: 75 },
          { code: "OPT_FAIR", label: "Fair", value: "fair", score: 50 },
          { code: "OPT_POOR", label: "Poor", value: "poor", score: 25 },
        ],
      },
      {
        code: "D1_C5",
        label: "Working Capital Management",
        description: "Cash flow management and working capital efficiency",
        answerType: "OPTION_SINGLE",
        weight: 0.15,
        options: [
          { code: "OPT_EXC", label: "Excellent", value: "excellent", score: 90 },
          { code: "OPT_GOOD", label: "Good", value: "good", score: 75 },
          { code: "OPT_FAIR", label: "Fair", value: "fair", score: 50 },
          { code: "OPT_POOR", label: "Poor", value: "poor", score: 25 },
        ],
      },
    ],
  },
  {
    code: "D2",
    label: "Technical Risk",
    shortLabel: "Technique",
    description: "Technical feasibility and operational capability",
    weight: 0.15,
    criteria: [
      {
        code: "D2_C1",
        label: "Technology Maturity",
        description: "Proven vs. emerging technology assessment",
        answerType: "OPTION_SINGLE",
        weight: 0.3,
        options: [
          { code: "OPT_PROVEN", label: "Proven Technology", value: "proven", score: 85 },
          { code: "OPT_MATURE", label: "Mature Technology", value: "mature", score: 70 },
          { code: "OPT_EMERGING", label: "Emerging Technology", value: "emerging", score: 45 },
          { code: "OPT_NOVEL", label: "Novel/Unproven", value: "novel", score: 20 },
        ],
      },
      {
        code: "D2_C2",
        label: "EPC Contractor Quality",
        description: "Track record and financial stability of EPC",
        answerType: "OPTION_SINGLE",
        weight: 0.25,
        options: [
          { code: "OPT_TIER1", label: "Tier 1 Contractor", value: "tier1", score: 85 },
          { code: "OPT_EXPERIENCED", label: "Experienced", value: "experienced", score: 70 },
          { code: "OPT_LIMITED", label: "Limited Track Record", value: "limited", score: 45 },
          { code: "OPT_UNPROVEN", label: "Unproven", value: "unproven", score: 20 },
        ],
      },
      {
        code: "D2_C3",
        label: "O&M Contractor Capability",
        description: "Operational and maintenance capability",
        answerType: "OPTION_SINGLE",
        weight: 0.2,
        options: [
          { code: "OPT_EXC", label: "Excellent", value: "excellent", score: 90 },
          { code: "OPT_GOOD", label: "Good", value: "good", score: 75 },
          { code: "OPT_FAIR", label: "Fair", value: "fair", score: 50 },
          { code: "OPT_POOR", label: "Poor", value: "poor", score: 25 },
        ],
      },
      {
        code: "D2_C4",
        label: "Plant Performance & Guarantees",
        description: "Performance guarantees and testing provisions",
        answerType: "OPTION_SINGLE",
        weight: 0.15,
        options: [
          { code: "OPT_STRONG", label: "Strong Guarantees", value: "strong", score: 85 },
          { code: "OPT_ADEQUATE", label: "Adequate", value: "adequate", score: 70 },
          { code: "OPT_LIMITED", label: "Limited", value: "limited", score: 45 },
          { code: "OPT_WEAK", label: "Weak", value: "weak", score: 25 },
        ],
      },
      {
        code: "D2_C5",
        label: "Supply Chain Risk",
        description: "Key equipment supply and logistics",
        answerType: "OPTION_SINGLE",
        weight: 0.1,
        options: [
          { code: "OPT_EXC", label: "Excellent", value: "excellent", score: 90 },
          { code: "OPT_GOOD", label: "Good", value: "good", score: 75 },
          { code: "OPT_FAIR", label: "Fair", value: "fair", score: 50 },
          { code: "OPT_POOR", label: "Poor", value: "poor", score: 25 },
        ],
      },
    ],
  },
  {
    code: "D3",
    label: "Market Risk",
    shortLabel: "Marché",
    description: "Market demand and competitive positioning",
    weight: 0.12,
    criteria: [
      {
        code: "D3_C1",
        label: "Offtake Agreements",
        description: "Quality and creditworthiness of off-taker",
        answerType: "OPTION_SINGLE",
        weight: 0.35,
        options: [
          { code: "OPT_SOVEREIGN", label: "Sovereign/AAA", value: "sovereign", score: 90 },
          { code: "OPT_STRONG", label: "Strong (A-BBB)", value: "strong", score: 75 },
          { code: "OPT_MODERATE", label: "Moderate (BB-B)", value: "moderate", score: 50 },
          { code: "OPT_WEAK", label: "Weak (<B)", value: "weak", score: 25 },
        ],
      },
      {
        code: "D3_C2",
        label: "Market Demand",
        description: "Long-term demand sustainability",
        answerType: "OPTION_SINGLE",
        weight: 0.25,
        options: [
          { code: "OPT_STRONG", label: "Strong & Growing", value: "strong", score: 90 },
          { code: "OPT_STABLE", label: "Stable", value: "stable", score: 75 },
          { code: "OPT_FLAT", label: "Flat", value: "flat", score: 50 },
          { code: "OPT_DECLINING", label: "Declining", value: "declining", score: 25 },
        ],
      },
      {
        code: "D3_C3",
        label: "Pricing Mechanism",
        description: "Price escalation and tariff review clauses",
        answerType: "OPTION_SINGLE",
        weight: 0.2,
        options: [
          { code: "OPT_INDEXED", label: "Indexed to CPI", value: "indexed", score: 85 },
          { code: "OPT_ESCALATED", label: "Fixed Escalation", value: "escalated", score: 70 },
          { code: "OPT_FIXED", label: "Fixed Price", value: "fixed", score: 45 },
          { code: "OPT_EXPOSED", label: "Exposed to Market", value: "exposed", score: 20 },
        ],
      },
      {
        code: "D3_C4",
        label: "Commodity Price Risk",
        description: "Exposure to commodity price fluctuations",
        answerType: "OPTION_SINGLE",
        weight: 0.2,
        options: [
          { code: "OPT_HEDGED", label: "Fully Hedged", value: "hedged", score: 90 },
          { code: "OPT_PARTIAL", label: "Partially Hedged", value: "partial", score: 70 },
          { code: "OPT_NONE", label: "No Hedge", value: "none", score: 40 },
          { code: "OPT_EXPOSED", label: "High Exposure", value: "exposed", score: 20 },
        ],
      },
    ],
  },
  {
    code: "D4",
    label: "Environmental & Social Risk",
    shortLabel: "E&S",
    description: "Environmental and social compliance",
    weight: 0.12,
    criteria: [
      {
        code: "D4_C1",
        label: "Environmental Compliance",
        description: "EIA, permit compliance, pollution control",
        answerType: "OPTION_SINGLE",
        weight: 0.4,
        options: [
          { code: "OPT_BEST", label: "Best Practice", value: "best", score: 90 },
          { code: "OPT_COMPLIANT", label: "Compliant", value: "compliant", score: 75 },
          { code: "OPT_ACCEPTABLE", label: "Acceptable", value: "acceptable", score: 50 },
          { code: "OPT_CONCERN", label: "Areas of Concern", value: "concern", score: 25 },
        ],
      },
      {
        code: "D4_C2",
        label: "Social Impact & Resettlement",
        description: "Social impact assessment and resettlement plan",
        answerType: "OPTION_SINGLE",
        weight: 0.3,
        options: [
          { code: "OPT_MINIMAL", label: "Minimal Impact", value: "minimal", score: 90 },
          { code: "OPT_LOW", label: "Low Impact", value: "low", score: 75 },
          { code: "OPT_MODERATE", label: "Moderate Impact", value: "moderate", score: 50 },
          { code: "OPT_HIGH", label: "High Impact", value: "high", score: 25 },
        ],
      },
      {
        code: "D4_C3",
        label: "Stakeholder Management",
        description: "Community relations and stakeholder engagement",
        answerType: "OPTION_SINGLE",
        weight: 0.3,
        options: [
          { code: "OPT_EXCELLENT", label: "Excellent Relations", value: "excellent", score: 90 },
          { code: "OPT_GOOD", label: "Good Relations", value: "good", score: 75 },
          { code: "OPT_FAIR", label: "Fair Relations", value: "fair", score: 50 },
          { code: "OPT_POOR", label: "Poor/Conflicted", value: "poor", score: 25 },
        ],
      },
    ],
  },
  {
    code: "D5",
    label: "Governance & Management Risk",
    shortLabel: "Gouvernance",
    description: "Management strength and governance quality",
    weight: 0.12,
    criteria: [
      {
        code: "D5_C1",
        label: "Sponsor Strength",
        description: "Financial strength and track record of sponsors",
        answerType: "OPTION_SINGLE",
        weight: 0.35,
        options: [
          { code: "OPT_STRONG", label: "Very Strong", value: "strong", score: 90 },
          { code: "OPT_GOOD", label: "Good", value: "good", score: 75 },
          { code: "OPT_MODERATE", label: "Moderate", value: "moderate", score: 50 },
          { code: "OPT_WEAK", label: "Weak", value: "weak", score: 25 },
        ],
      },
      {
        code: "D5_C2",
        label: "Board & Management",
        description: "Board composition and management experience",
        answerType: "OPTION_SINGLE",
        weight: 0.35,
        options: [
          { code: "OPT_EXCELLENT", label: "Excellent", value: "excellent", score: 90 },
          { code: "OPT_GOOD", label: "Good", value: "good", score: 75 },
          { code: "OPT_ADEQUATE", label: "Adequate", value: "adequate", score: 50 },
          { code: "OPT_LIMITED", label: "Limited Experience", value: "limited", score: 25 },
        ],
      },
      {
        code: "D5_C3",
        label: "Internal Controls",
        description: "Financial controls and reporting systems",
        answerType: "OPTION_SINGLE",
        weight: 0.3,
        options: [
          { code: "OPT_ROBUST", label: "Robust", value: "robust", score: 90 },
          { code: "OPT_GOOD", label: "Good", value: "good", score: 75 },
          { code: "OPT_ACCEPTABLE", label: "Acceptable", value: "acceptable", score: 50 },
          { code: "OPT_WEAK", label: "Weak", value: "weak", score: 25 },
        ],
      },
    ],
  },
  {
    code: "D6",
    label: "Legal & Regulatory Risk",
    shortLabel: "Juridique",
    description: "Legal structure and regulatory compliance",
    weight: 0.1,
    criteria: [
      {
        code: "D6_C1",
        label: "Legal Structure",
        description: "SPV structure and shareholder agreements",
        answerType: "OPTION_SINGLE",
        weight: 0.4,
        options: [
          { code: "OPT_SOUND", label: "Sound & Tested", value: "sound", score: 90 },
          { code: "OPT_SOLID", label: "Solid", value: "solid", score: 75 },
          { code: "OPT_ADEQUATE", label: "Adequate", value: "adequate", score: 50 },
          { code: "OPT_WEAK", label: "Weak Points", value: "weak", score: 25 },
        ],
      },
      {
        code: "D6_C2",
        label: "Regulatory Framework",
        description: "Stability and favorability of regulatory environment",
        answerType: "OPTION_SINGLE",
        weight: 0.35,
        options: [
          { code: "OPT_STABLE", label: "Stable & Favorable", value: "stable", score: 90 },
          { code: "OPT_FAVORABLE", label: "Favorable", value: "favorable", score: 75 },
          { code: "OPT_NEUTRAL", label: "Neutral", value: "neutral", score: 50 },
          { code: "OPT_UNCERTAIN", label: "Uncertain/Unfavorable", value: "uncertain", score: 25 },
        ],
      },
      {
        code: "D6_C3",
        label: "Permits & Licenses",
        description: "Completeness and validity of all permits",
        answerType: "OPTION_SINGLE",
        weight: 0.25,
        options: [
          { code: "OPT_COMPLETE", label: "Complete", value: "complete", score: 90 },
          { code: "OPT_MOSTLY", label: "Mostly Complete", value: "mostly", score: 75 },
          { code: "OPT_PARTIAL", label: "Partial", value: "partial", score: 50 },
          { code: "OPT_MISSING", label: "Key Permits Missing", value: "missing", score: 25 },
        ],
      },
    ],
  },
  {
    code: "D7",
    label: "Country & Political Risk",
    shortLabel: "Pays",
    description: "Country risk and political stability",
    weight: 0.12,
    criteria: [
      {
        code: "D7_C1",
        label: "Sovereign Risk",
        description: "Country credit rating and political stability",
        answerType: "OPTION_SINGLE",
        weight: 0.4,
        options: [
          { code: "OPT_STRONG", label: "Strong (AAA-A)", value: "strong", score: 90 },
          { code: "OPT_MODERATE", label: "Moderate (BBB)", value: "moderate", score: 75 },
          { code: "OPT_WEAK", label: "Weak (BB-B)", value: "weak", score: 50 },
          { code: "OPT_HIGH_RISK", label: "High Risk (<B)", value: "high_risk", score: 25 },
        ],
      },
      {
        code: "D7_C2",
        label: "Currency & Transfer Risk",
        description: "Foreign exchange exposure and convertibility",
        answerType: "OPTION_SINGLE",
        weight: 0.3,
        options: [
          { code: "OPT_HEDGED", label: "Fully Hedged", value: "hedged", score: 90 },
          { code: "OPT_PARTIAL", label: "Partially Hedged", value: "partial", score: 75 },
          { code: "OPT_EXPOSED", label: "Exposed", value: "exposed", score: 45 },
          { code: "OPT_HIGH", label: "High Risk", value: "high", score: 20 },
        ],
      },
      {
        code: "D7_C3",
        label: "Political Risk Insurance",
        description: "Availability and coverage of PRI",
        answerType: "OPTION_SINGLE",
        weight: 0.3,
        options: [
          { code: "OPT_AVAILABLE", label: "Available", value: "available", score: 90 },
          { code: "OPT_PARTIAL", label: "Partial Coverage", value: "partial", score: 70 },
          { code: "OPT_UNAVAILABLE", label: "Unavailable", value: "unavailable", score: 40 },
          { code: "OPT_NA", label: "Not Required", value: "na", score: 85 },
        ],
      },
    ],
  },
  {
    code: "D8",
    label: "Project Structure Risk",
    shortLabel: "Structure",
    description: "SPV structure and contractual arrangements",
    weight: 0.06,
    criteria: [
      {
        code: "D8_C1",
        label: "Financial Covenants",
        description: "Loan covenants and compliance monitoring",
        answerType: "OPTION_SINGLE",
        weight: 0.5,
        options: [
          { code: "OPT_STRONG", label: "Strong & Clear", value: "strong", score: 90 },
          { code: "OPT_ADEQUATE", label: "Adequate", value: "adequate", score: 75 },
          { code: "OPT_BASIC", label: "Basic", value: "basic", score: 50 },
          { code: "OPT_WEAK", label: "Weak/Vague", value: "weak", score: 25 },
        ],
      },
      {
        code: "D8_C2",
        label: "Force Majeure Provisions",
        description: "Adequate force majeure coverage and mitigation",
        answerType: "OPTION_SINGLE",
        weight: 0.5,
        options: [
          { code: "OPT_COMPREHENSIVE", label: "Comprehensive", value: "comprehensive", score: 90 },
          { code: "OPT_ADEQUATE", label: "Adequate", value: "adequate", score: 75 },
          { code: "OPT_BASIC", label: "Basic", value: "basic", score: 50 },
          { code: "OPT_LIMITED", label: "Limited", value: "limited", score: 25 },
        ],
      },
    ],
  },
  {
    code: "D9",
    label: "Financial Stress Test",
    shortLabel: "Stress",
    description: "Resilience under financial stress scenarios",
    weight: 0.06,
    criteria: [
      {
        code: "D9_C1",
        label: "Stress Scenario Testing",
        description: "DSCR under stress scenarios (±20% cash flow)",
        answerType: "NUMERIC_RANGE",
        weight: 0.6,
        ranges: [
          { label: "Excellent (>1.5)", minValue: 1.5, maxValue: 999, score: 90 },
          { label: "Good (1.3-1.5)", minValue: 1.3, maxValue: 1.5, score: 75 },
          { label: "Fair (1.1-1.3)", minValue: 1.1, maxValue: 1.3, score: 60 },
          { label: "Weak (0.9-1.1)", minValue: 0.9, maxValue: 1.1, score: 40 },
          { label: "Poor (<0.9)", minValue: 0, maxValue: 0.9, score: 20 },
        ],
      },
      {
        code: "D9_C2",
        label: "Scenario: Cost Overrun",
        description: "Resilience to 10-15% cost overrun",
        answerType: "NUMERIC_RANGE",
        weight: 0.4,
        ranges: [
          { label: "Excellent (>1.5)", minValue: 1.5, maxValue: 999, score: 90 },
          { label: "Good (1.3-1.5)", minValue: 1.3, maxValue: 1.5, score: 75 },
          { label: "Fair (1.1-1.3)", minValue: 1.1, maxValue: 1.3, score: 60 },
          { label: "Weak (0.9-1.1)", minValue: 0.9, maxValue: 1.1, score: 40 },
          { label: "Poor (<0.9)", minValue: 0, maxValue: 0.9, score: 20 },
        ],
      },
    ],
  },
];

async function main() {
  console.log("🌱 Starting database seed: PF_V7PP Scoring Model...\n");

  try {
    // Get or create a system user for seeding
    let seedUser = await prisma.user.findFirst({
      where: { email: "system@pf-scoring.local" },
    });

    if (!seedUser) {
      seedUser = await prisma.user.create({
        data: {
          email: "system@pf-scoring.local",
          nom: "System",
          prenom: "Seed",
          role: "admin",
          password: "",
        },
      });
    }

    // Create or update the ScoringModel
    console.log("📦 Creating ScoringModel (PF_V7PP)...");
    const model = await prisma.scoringModel.upsert({
      where: { code: "PF_V7PP" },
      update: {
        label: "PF V7++ - Project Finance Standard Model",
        description: "Comprehensive scoring model for project finance evaluations with 9 domains",
        status: "PUBLISHED",
        isActive: true,
      },
      create: {
        code: "PF_V7PP",
        label: "PF V7++ - Project Finance Standard Model",
        description: "Comprehensive scoring model for project finance evaluations with 9 domains",
        businessSegment: "Project Finance",
        projectType: "Standard",
        status: "PUBLISHED",
        isActive: true,
        ownerBusinessId: seedUser.id,
      },
    });
    console.log(`✅ ScoringModel: ${model.id}\n`);

    // Create or update the ScoringModelVersion
    console.log("📋 Creating ScoringModelVersion...");
    const version = await prisma.scoringModelVersion.upsert({
      where: { modelId_versionNumber: { modelId: model.id, versionNumber: 1 } },
      update: {
        label: "V1 - Initial Release",
        status: "PUBLISHED",
        isPublished: true,
        changeReason: "Initial scoring model for PF evaluations",
        releaseNotes: "Standard model with 9 domains and hierarchical criteria",
      },
      create: {
        modelId: model.id,
        versionNumber: 1,
        label: "V1 - Initial Release",
        status: "PUBLISHED",
        isPublished: true,
        changeReason: "Initial scoring model for PF evaluations",
        releaseNotes: "Standard model with 9 domains and hierarchical criteria",
        createdBy: seedUser.id,
        validatedBy: seedUser.id,
        publishedBy: seedUser.id,
        validatedAt: new Date(),
        publishedAt: new Date(),
      },
    });
    console.log(`✅ ScoringModelVersion: ${version.id}\n`);

    // Create domains, criteria, options, and ranges
    console.log("🏗️  Creating 9 Domains with Criteria, Options, and Ranges...");
    let domainCount = 0;
    let criterionCount = 0;
    let optionCount = 0;
    let rangeCount = 0;

    for (const domainData of DOMAINS) {
      // Create domain node
      const domainNode = await prisma.scoringNode.upsert({
        where: { versionId_code: { versionId: version.id, code: domainData.code } },
        update: {
          label: domainData.label,
          shortLabel: domainData.shortLabel,
          description: domainData.description,
          weight: domainData.weight,
        },
        create: {
          versionId: version.id,
          parentNodeId: null,
          nodeType: "DOMAIN",
          code: domainData.code,
          label: domainData.label,
          shortLabel: domainData.shortLabel,
          description: domainData.description,
          displayPath: domainData.code,
          depth: 0,
          orderIndex: DOMAINS.indexOf(domainData),
          isActive: true,
          isTerminal: false,
          isScored: false,
          isMandatory: true,
          allowsChildren: true,
          weight: domainData.weight,
          weightMode: "RELATIVE",
          aggregationMethod: "AVERAGE",
        },
      });
      domainCount++;

      // Create criteria under this domain
      for (let critIndex = 0; critIndex < domainData.criteria.length; critIndex++) {
        const critData = domainData.criteria[critIndex];

        const criterionNode = await prisma.scoringNode.upsert({
          where: { versionId_code: { versionId: version.id, code: critData.code } },
          update: {
            label: critData.label,
            description: critData.description,
            weight: critData.weight,
            answerType: critData.answerType as any,
          },
          create: {
            versionId: version.id,
            parentNodeId: domainNode.id,
            nodeType: "CRITERION",
            code: critData.code,
            label: critData.label,
            description: critData.description,
            displayPath: `${domainData.code}/${critData.code}`,
            depth: 1,
            orderIndex: critIndex,
            isActive: true,
            isTerminal: !critData.options && !critData.ranges,
            isScored: true,
            isMandatory: false,
            allowsChildren: false,
            weight: critData.weight,
            weightMode: "RELATIVE",
            aggregationMethod: "FIRST",
            answerType: critData.answerType as any,
          },
        });
        criterionCount++;

        // Add options if they exist
        if (critData.options && critData.options.length > 0) {
          for (let optIndex = 0; optIndex < critData.options.length; optIndex++) {
            const optData = critData.options[optIndex];
            await prisma.scoringNodeOption.upsert({
              where: { nodeId_code: { nodeId: criterionNode.id, code: optData.code } },
              update: {
                label: optData.label,
                value: optData.value,
                score: optData.score,
                orderIndex: optIndex,
              },
              create: {
                nodeId: criterionNode.id,
                code: optData.code,
                label: optData.label,
                value: optData.value,
                score: optData.score,
                orderIndex: optIndex,
                isActive: true,
              },
            });
            optionCount++;
          }
        }

        // Add ranges if they exist
        if (critData.ranges && critData.ranges.length > 0) {
          for (let rangeIndex = 0; rangeIndex < critData.ranges.length; rangeIndex++) {
            const rangeData = critData.ranges[rangeIndex];
            // Use a unique hash for the upsert key
            const rangeKey = `${criterionNode.id}_${rangeData.minValue}_${rangeData.maxValue}`;
            const existingRange = await prisma.scoringNodeRange.findFirst({
              where: {
                nodeId: criterionNode.id,
                minValue: rangeData.minValue,
                maxValue: rangeData.maxValue,
              },
            });

            if (!existingRange) {
              await prisma.scoringNodeRange.create({
                data: {
                  nodeId: criterionNode.id,
                  label: rangeData.label,
                  minValue: rangeData.minValue,
                  maxValue: rangeData.maxValue,
                  minIncluded: true,
                  maxIncluded: true,
                  score: rangeData.score,
                  orderIndex: rangeIndex,
                  isActive: true,
                },
              });
            } else {
              await prisma.scoringNodeRange.update({
                where: { id: existingRange.id },
                data: {
                  label: rangeData.label,
                  score: rangeData.score,
                  orderIndex: rangeIndex,
                },
              });
            }
            rangeCount++;
          }
        }
      }
    }

    console.log(`✅ Domains created: ${domainCount}`);
    console.log(`✅ Criteria created: ${criterionCount}`);
    console.log(`✅ Options created: ${optionCount}`);
    console.log(`✅ Ranges created: ${rangeCount}\n`);

    // Summary
    console.log("=".repeat(60));
    console.log("🎉 Seed completed successfully!");
    console.log("=".repeat(60));
    console.log(`
📊 PF_V7PP Scoring Model Summary:
   • Model ID: ${model.id}
   • Model Code: ${model.code}
   • Model Version ID: ${version.id}
   • Version Status: Published ✅
   • Domains: ${domainCount}
   • Criteria: ${criterionCount}
   • Options: ${optionCount}
   • Ranges: ${rangeCount}

✨ The model is now ready for evaluations!
   To use it: Evaluations will automatically load this published version
   `);

  } catch (error) {
    console.error("❌ Error during seed:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
