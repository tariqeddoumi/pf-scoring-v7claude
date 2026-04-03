# PF Scoring V7++ - API Documentation

## Overview

API REST pour le calcul de score Project Finance (PF) selon la méthodologie V7++. Évaluation complète en 9 domaines avec moteur de règles (NO-GO et MALUS) et scénarios de stress testing.

**Base URL**: `/api`

## Authentication

Toutes les requêtes API doivent inclure:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## Endpoints

### 1. POST `/evaluations/[id]/score/calculate`

Calcule le score PF global pour un projet.

#### Request

```typescript
{
  "projectData": {
    // Voir ProjectData interface
  },
  "analystName": "Prénom Nom",
  "includeStressTests": true  // optional
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "result": {
    "evaluationId": "eval-001",
    "projectId": "proj-001",
    "rating": "A",           // AAA | AA | A | BBB | BB | B | CCC | D
    "finalScore": 8.08,      // 1.0 - 10.0
    "recommendation": "APPROVE",
    "probabilityOfDefault": 0.015,
    "domains": {
      "D1": { /* domain score */ },
      "D2": { /* domain score */ },
      // ... D3 to D9
    },
    "triggeredNOGOs": [      // Array of NO-GO rules triggered
      {
        "ruleId": "NOGO_1A",
        "category": "Sponsor Risk",
        "description": "Sponsor rating below CCC"
      }
    ],
    "appliedMALUS": [        // Array of MALUS penalties
      {
        "ruleId": "MALUS_5A",
        "penaltyPoints": -5,
        "description": "DSCR < 1.25 without indexation"
      }
    ]
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid project data or missing required fields
- **422 Unprocessable Entity**: Data validation failed
- **500 Internal Server Error**: Calculation error

#### Example

```bash
curl -X POST http://localhost:3000/api/evaluations/eval-001/score/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "projectData": {
      "projectId": "proj-solar-maroc",
      "projectName": "Solar Farm 50MW",
      "sector": "Renewable Energy",
      "projectFundamentals": {
        "projectCost": 55000000,
        "technologyMaturity": 9
      }
      // ... complete ProjectData
    },
    "analystName": "Ahmed Ben Mohamed"
  }'
```

---

### 2. POST `/evaluations/[id]/stress-test`

Exécute 6 scénarios de stress testing.

#### Request

```typescript
{
  "evaluationId": "eval-001",
  "scenarios": [
    "REVENUE_DECLINE_10",
    "COST_INFLATION_5",
    "INTEREST_RATE_200BPS",
    "FX_DEPRECIATION_10",
    "MARKET_DECAY_2_CAGR",
    "COMBINED_PERFECT_STORM"
  ],
  "projectId": "proj-001",      // optional
  "analystId": "analyst-001"    // optional
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "result": {
    "evaluationId": "eval-001",
    "baseCase": {
      "dscr": 1.45,
      "revenue": 7700000,
      "debtService": 5280000
    },
    "scenarios": [
      {
        "scenarioId": "REVENUE_DECLINE_10",
        "name": "Revenue Decline -10%",
        "description": "Market downturn scenario",
        "dscrBase": 1.45,
        "dscrStress": 1.305,  // 90% of revenue
        "status": "PASS",      // PASS | MARGINAL | FAIL
        "margin": 0.055,       // Margin vs threshold
        "notes": "Passed with margin"
      }
      // ... other scenarios
    ],
    "summary": {
      "allPass": true,
      "vulnerableScenarios": [],
      "criticalRisks": [],
      "overallRating": "RESILIENT"  // RESILIENT | ADEQUATE | VULNERABLE | CRITICAL
    }
  }
}
```

#### Scenario Details

| Scenario | Impact | Threshold |
|----------|--------|-----------|
| REVENUE_DECLINE_10 | Revenue × 0.90 | DSCR > 1.25 |
| COST_INFLATION_5 | Cost × 1.05 | DSCR > 1.20 |
| INTEREST_RATE_200BPS | Rate + 2% | DSCR > 1.25 |
| FX_DEPRECIATION_10 | Revenue × 0.90 | DSCR > 1.25 |
| MARKET_DECAY_2_CAGR | Growth -2% | DSCR > 1.30 |
| COMBINED_PERFECT_STORM | Multi-shock | DSCR > 1.10 |

---

### 3. GET `/evaluations/[id]/report`

Récupère le rapport d'évaluation sauvegardé.

#### Query Parameters

```
?format=json|pdf|csv  (default: json)
?includeStressTests=true|false
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "report": {
    "evaluationId": "eval-001",
    "projectName": "Solar Farm Maroc 50MW",
    "analyst": "Ahmed Ben Mohamed",
    "reportDate": "2026-04-03T10:30:00Z",
    "scoring": {
      // Full ScoringResult
    },
    "stressTest": {
      // Full StressTestResult
    },
    "recommendations": [
      "Project approved for financing",
      "Monitor offtaker credit quality",
      "Ensure DSCR maintained above 1.25x"
    ],
    "conditions": [
      "NO-GO rules triggered",
      "Additional due diligence required"
    ]
  },
  "auditTrail": [
    {
      "id": "log-001",
      "action": "CALCULATE",
      "timestamp": "2026-04-03T10:30:00Z",
      "analyst": "Ahmed Ben Mohamed",
      "changes": { /* what changed */ }
    }
  ],
  "metadata": {
    "evaluationId": "eval-001",
    "generatedAt": "2026-04-03T10:35:00Z",
    "version": "7.0"
  }
}
```

#### Error Responses

- **404 Not Found**: Evaluation not found
- **501 Not Implemented**: PDF/CSV export not yet implemented

---

### 4. POST `/evaluations/[id]/report`

Queue report generation asynchronously.

#### Request

```typescript
{
  "format": "json|pdf|csv",
  "includeStressTests": true
}
```

#### Response (202 Accepted)

```typescript
{
  "success": true,
  "message": "Report generation queued",
  "evaluationId": "eval-001",
  "format": "json",
  "estimatedTime": "5-10 seconds",
  "retrieveAt": "/api/evaluations/eval-001/report?format=json"
}
```

---

## Data Models

### ProjectData

Complete project information structured in 9 domains:

```typescript
interface ProjectData {
  projectId: string;
  projectName: string;
  sector: string;
  description: string;

  // D1: Project Fundamentals (20%)
  projectFundamentals: {
    projectCost: number;
    technologyMaturity: number;
    hasDetailedEngineering: boolean;
    // ...
  };

  // D2: Host Country (10%)
  hostCountry: {
    country: string;
    countryRating: RatingScale;
    politicalRisk: "LOW" | "MEDIUM" | "HIGH";
    // ...
  };

  // D3: Construction Phase (15%)
  construction: {
    epcContractorName: string;
    epcContractorRating: RatingScale;
    constructionPeriod: number;
    // ...
  };

  // D4: Operation Phase (15%)
  operation: {
    expectedProjectLife: number;
    operatorFiability: number;
    operatorExperience: number;
    // ...
  };

  // D5: Revenue & Market (15%)
  revenue: {
    hasPublicPPA: boolean;
    ppaTermYears: number;
    ppaCounterparty: string;
    // ...
  };

  // D6 & D7: Financial Structure & Debt Service (30%)
  financialStructure: {
    projectEquity: number;
    projectDebt: number;
    dscr: number;
    seniorDebtRate: number;
    seniorDebtTerm: number;
    // ...
  };

  // D8: Legal & Documentation (10%)
  legal: {
    hasEnforcableContracts: boolean;
    contractsQuality: "LOW" | "MEDIUM" | "HIGH";
    // ...
  };

  // D9: ESG & Climate (10%)
  esg: {
    environmentalRating: string;
    socialRisk: "LOW" | "MEDIUM" | "HIGH";
    climateRisk: "LOW" | "MEDIUM" | "HIGH";
    // ...
  };
}
```

### ScoringResult

Result of scoring calculation:

```typescript
interface ScoringResult {
  evaluationId: string;
  projectId: string;
  rating: RatingScale;        // AAA | AA | A | BBB | BB | B | CCC | D
  finalScore: number;          // 1.0 - 10.0
  recommendation: string;      // APPROVE | APPROVE_WITH_CONDITIONS | REJECT
  probabilityOfDefault: number; // 0.0 - 1.0
  domains: Map<DomainCode, DomainScore>;
  triggeredNOGOs: NOGORule[];
  appliedMALUS: MALUSRule[];
}
```

---

## Rating Scale Mapping

| Rating | Score | PD | Risk Level |
|--------|-------|----|----|
| AAA | 9.5-10.0 | 0.005 | Minimal |
| AA | 9.0-9.5 | 0.010 | Very Low |
| A | 8.0-8.95 | 0.015 | Low |
| BBB | 7.0-7.95 | 0.030 | Moderate |
| BB | 6.0-6.95 | 0.075 | Medium |
| B | 5.0-5.95 | 0.150 | High |
| CCC | 3.0-4.95 | 0.250 | Very High |
| D | <3.0 | 0.500+ | Default |

---

## Rules Engine

### NO-GO Rules (21 total)

Automatic rejection triggers:

- **NOGO_1**: Sponsor Risk (3 rules)
  - NOGO_1A: Sponsor rating < CCC
  - NOGO_1B: Sponsor insolvency
  - NOGO_1C: Sponsor liquidity < 0.1x

- **NOGO_2**: Country Risk (2 rules)
  - NOGO_2A: Active conflict/war
  - NOGO_2B: Expropriation risk

- **NOGO_3**: Construction Risk (3 rules)
  - NOGO_3A: EPC contractor insolvency
  - NOGO_3B: Failed project history
  - NOGO_3C: No cost guarantee

- **NOGO_5**: Revenue Risk (5 rules)
  - NOGO_5A: No PPA/contract
  - NOGO_5B: Offtaker insolvency
  - NOGO_5C: Mono-client > 85%
  - NOGO_5D: Market decline > 3%
  - NOGO_5E: Tariff + 20%

- **NOGO_6**: Financial Risk (3 rules)
  - NOGO_6A: DSCR < 1.10
  - NOGO_6B: No DSRA
  - NOGO_6C: Leverage > 85%

- **NOGO_8**: Legal Risk (3 rules)
  - NOGO_8A: Missing contracts
  - NOGO_8B: Non-enforceable
  - NOGO_8C: Active litigation

- **NOGO_9**: ESG Risk (2 rules)
  - NOGO_9A: Social conflict
  - NOGO_9B: Environmental non-compliance

### MALUS Rules (19+ total)

Penalty scoring deductions (-1 to -5 points):

- MALUS_5A: DSCR < 1.25 without indexation = -5 pts
- MALUS_5B: Take-or-pay < 40% = -4 pts
- MALUS_5C: Offtaker rating < BBB = -3 pts
- MALUS_6A: Leverage > 75% = -4 pts
- MALUS_6B: No DSCA or < 6 months = -2 pts
- ... (19+ total rules)

---

## Error Handling

All endpoints return consistent error format:

```typescript
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { /* additional context */ }
}
```

Common error codes:
- `INVALID_INPUT`: Malformed request
- `VALIDATION_FAILED`: Data validation error
- `MISSING_FIELD`: Required field missing
- `CALCULATION_ERROR`: Scoring calculation failed
- `NOT_FOUND`: Resource not found

---

## Rate Limiting

- **100 requests/minute** per API key
- **1000 requests/day** per user

---

## Versioning

API version: **7.0**
Methodology: **PF Scoring V7++**

Future versions will support:
- PDF report generation
- CSV export
- Advanced filtering and querying
- Comparative analysis across projects
