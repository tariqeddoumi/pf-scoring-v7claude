/**
 * Integration Tests for API Endpoints
 */

import {
  SOLAR_MAROC_FIXTURE,
  SOLAR_MAROC_EXPECTED,
} from "../fixtures/solar-maroc-case";
import {
  ScoringRequestBody,
  ScoringResponseBody,
  StressTestRequestBody,
  StressTestResponseBody,
} from "@/types/scoring-v7plus";

/**
 * NOTE: These tests are designed to be run against a local Next.js dev server
 * Run with: npm run dev (in separate terminal)
 * Then: npm run test __tests__/integration
 */

const BASE_URL = "http://localhost:3000/api";

describe("API Endpoints - Scoring Calculation", () => {
  const evaluationId = "eval-test-001";

  it("POST /evaluations/[id]/score/calculate should calculate scoring", async () => {
    const requestBody: ScoringRequestBody = {
      projectData: SOLAR_MAROC_FIXTURE,
      analystName: "Test Analyst",
    };

    const response = await fetch(
      `${BASE_URL}/evaluations/${evaluationId}/score/calculate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    expect(response.status).toBe(200);

    const data: ScoringResponseBody = await response.json();
    expect(data.success).toBe(true);
    expect(data.result).toBeDefined();
    expect(data.result?.rating).toBeDefined();
    expect(data.result?.finalScore).toBeGreaterThan(0);
  });

  it("should handle invalid JSON gracefully", async () => {
    const response = await fetch(
      `${BASE_URL}/evaluations/eval-test-002/score/calculate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it("should reject incomplete project data", async () => {
    const incompleteData = {
      projectId: "incomplete-project",
      projectName: "Incomplete Project",
    };

    const requestBody: ScoringRequestBody = {
      projectData: incompleteData as any,
      analystName: "Test Analyst",
    };

    const response = await fetch(
      `${BASE_URL}/evaluations/eval-test-003/score/calculate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    // Should either succeed with warnings or fail
    expect([200, 400]).toContain(response.status);
  });
});

describe("API Endpoints - Stress Testing", () => {
  const evaluationId = "eval-test-004";

  it("POST /evaluations/[id]/stress-test should run all scenarios", async () => {
    const requestBody: StressTestRequestBody = {
      evaluationId,
      scenarios: [
        "REVENUE_DECLINE_10",
        "COST_INFLATION_5",
        "INTEREST_RATE_200BPS",
        "FX_DEPRECIATION_10",
        "COMBINED_PERFECT_STORM",
      ] as any,
    };

    const response = await fetch(
      `${BASE_URL}/evaluations/${evaluationId}/stress-test`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    expect(response.status).toBe(200);

    const data: StressTestResponseBody = await response.json();
    expect(data.success).toBe(true);
    expect(data.result).toBeDefined();
    expect(data.result?.scenarios).toBeDefined();
  });

  it("should require at least one scenario", async () => {
    const requestBody = {
      evaluationId,
      scenarios: [] as any[],
    };

    const response = await fetch(
      `${BASE_URL}/evaluations/${evaluationId}/stress-test`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("should return overall resilience rating", async () => {
    const requestBody: StressTestRequestBody = {
      evaluationId,
      scenarios: ["REVENUE_DECLINE_10", "COST_INFLATION_5"] as any,
    };

    const response = await fetch(
      `${BASE_URL}/evaluations/${evaluationId}/stress-test`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    expect(response.status).toBe(200);

    const data: StressTestResponseBody = await response.json();
    expect(data.result?.summary).toBeDefined();
    expect(data.result?.summary?.overallRating).toMatch(
      /RESILIENT|ADEQUATE|VULNERABLE|CRITICAL/
    );
  });
});

describe("API Endpoints - Report Retrieval", () => {
  const evaluationId = "eval-test-005";

  it("GET /evaluations/[id]/report should retrieve saved evaluation", async () => {
    const response = await fetch(
      `${BASE_URL}/evaluations/${evaluationId}/report`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    expect([200, 404]).toContain(response.status);

    const data = await response.json();
    if (response.status === 200) {
      expect(data.success).toBe(true);
      expect(data.report).toBeDefined();
    }
  });

  it("should support JSON format (default)", async () => {
    const response = await fetch(
      `${BASE_URL}/evaluations/${evaluationId}/report?format=json`,
      {
        method: "GET",
      }
    );

    expect([200, 404]).toContain(response.status);
    const contentType = response.headers.get("content-type");
    expect(contentType).toContain("application/json");
  });

  it("POST /evaluations/[id]/report should queue report generation", async () => {
    const response = await fetch(
      `${BASE_URL}/evaluations/${evaluationId}/report`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "json" }),
      }
    );

    expect(response.status).toBe(202); // 202 Accepted for async operation
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

describe("API Endpoints - End-to-End Flow", () => {
  const evalId = "eval-solar-maroc";

  it("should complete full evaluation workflow", async () => {
    // Step 1: Calculate scoring
    const calcRequest: ScoringRequestBody = {
      projectData: SOLAR_MAROC_FIXTURE,
      analystName: "Integration Test User",
    };

    const calcResponse = await fetch(
      `${BASE_URL}/evaluations/${evalId}/score/calculate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calcRequest),
      }
    );

    expect(calcResponse.status).toBe(200);
    const calcResult = await calcResponse.json();
    expect(calcResult.success).toBe(true);

    // Step 2: Run stress testing
    const stressRequest: StressTestRequestBody = {
      evaluationId: evalId,
      scenarios: [
        "REVENUE_DECLINE_10",
        "COST_INFLATION_5",
        "COMBINED_PERFECT_STORM",
      ] as any,
    };

    const stressResponse = await fetch(
      `${BASE_URL}/evaluations/${evalId}/stress-test`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stressRequest),
      }
    );

    expect(stressResponse.status).toBe(200);
    const stressResult = await stressResponse.json();
    expect(stressResult.success).toBe(true);

    // Step 3: Retrieve report
    const reportResponse = await fetch(
      `${BASE_URL}/evaluations/${evalId}/report`,
      {
        method: "GET",
      }
    );

    expect([200, 404]).toContain(reportResponse.status);
  });
});
