/**
 * POST /api/evaluations/[id]/stress-test
 * Run stress testing scenarios on a project
 */

import { NextRequest, NextResponse } from "next/server";
import {
  StressTestRequestBody,
  StressTestResponseBody,
  StressScenario,
  StressTestScenario,
  ScoringStatus,
  StressTestResult,
} from "@/types/scoring-v7plus";
import { saveStressTestResults, logScoringAction } from "@/lib/db-scoring";

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse<StressTestResponseBody>> {
  try {
    const evaluationId = context.params.id;

    // Parse request
    let body: StressTestRequestBody;
    try {
      body = (await request.json()) as StressTestRequestBody;
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON body",
        },
        { status: 400 }
      );
    }

    const { scenarios } = body;

    // Validate scenarios
    if (!scenarios || scenarios.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one stress scenario must be provided",
        },
        { status: 400 }
      );
    }

    // Calculate stress results
    // In real implementation, would retrieve base case from evaluationId
    // For now, using placeholder values
    const baseCase = {
      dscr: 1.45,
      llcr: 1.55,
      revenue: 100.0,
      debtService: 69.0,
    };

    const stressResults: StressTestScenario[] = [];
    let allPass = true;
    const vulnerableScenarios: string[] = [];

    // Scenario 1: Revenue Decline -10%
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (scenarios.includes("REVENUE_DECLINE_10" as any)) {
      const revenueStress = baseCase.revenue * 0.9;
      const dscrStress = revenueStress / baseCase.debtService;
      const passed = dscrStress > 1.25;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stressResults.push({
        scenarioId: "REVENUE_DECLINE_10" as any,
        name: "Revenue Decline -10%",
        description: "Market downturn / demand reduction / offtaker issues",
        assumption: "Revenue decreases by 10%",
        revenueMultiplier: 0.9,
        dscrBase: baseCase.dscr,
        dscrStress,
        status: passed ? ScoringStatus.PASS : ScoringStatus.FAIL,
        margin: dscrStress - 1.25,
        notes: passed ? "Passed with margin" : "Below threshold",
      });

      if (!passed) {
        allPass = false;
        vulnerableScenarios.push("Revenue Decline -10%");
      }
    }

    // Scenario 2: Cost Inflation +5%
    if (scenarios.includes("COST_INFLATION_5" as any)) {
      const costMultiplier = 1.05;
      const additionalCost = baseCase.debtService * 0.05;
      const revenueStress = baseCase.revenue - additionalCost;
      const dscrStress = revenueStress / baseCase.debtService;
      const passed = dscrStress > 1.2;

      stressResults.push({
        scenarioId: "COST_INFLATION_5" as any,
        name: "Cost Inflation +5%",
        description: "Operating cost increase",
        assumption: "OPEX increases by 5%",
        costMultiplier,
        dscrBase: baseCase.dscr,
        dscrStress,
        status: passed ? ScoringStatus.PASS : ScoringStatus.FAIL,
        margin: dscrStress - 1.2,
        notes: passed ? "Passed with margin" : "Below threshold",
      });

      if (!passed) {
        allPass = false;
        vulnerableScenarios.push("Cost Inflation +5%");
      }
    }

    // Scenario 3: Interest Rate +200bps
    if (scenarios.includes("INTEREST_RATE_200BPS" as any)) {
      const rateIncrease = 0.02;
      const additionalInterest = baseCase.debtService * rateIncrease * 0.5; // Rough estimate
      const newDebtService = baseCase.debtService + additionalInterest;
      const dscrStress = baseCase.revenue / newDebtService;
      const passed = dscrStress > 1.25;

      stressResults.push({
        scenarioId: "INTEREST_RATE_200BPS" as any,
        name: "Interest Rate +200bps",
        description: "Rate increase (floating debt)",
        assumption: "Interest rates increase by 2%",
        interestRateIncreaseBps: 200,
        dscrBase: baseCase.dscr,
        dscrStress,
        status: passed ? ScoringStatus.PASS : ScoringStatus.FAIL,
        margin: dscrStress - 1.25,
        notes: passed ? "Passed with margin" : "Marginal",
      });

      if (!passed) {
        allPass = false;
        vulnerableScenarios.push("Interest Rate +200bps");
      }
    }

    // Scenario 4: FX Depreciation -10%
    if (scenarios.includes("FX_DEPRECIATION_10" as any)) {
      const fxDepreciation = 0.1;
      const revenueStress = baseCase.revenue * (1 - fxDepreciation);
      const dscrStress = revenueStress / baseCase.debtService;
      const passed = dscrStress > 1.25;

      stressResults.push({
        scenarioId: "FX_DEPRECIATION_10" as any,
        name: "FX Depreciation -10%",
        description: "Local currency weakness",
        assumption: "Currency depreciates by 10%",
        fxDepreciation,
        dscrBase: baseCase.dscr,
        dscrStress,
        status: passed ? ScoringStatus.PASS : ScoringStatus.FAIL,
        margin: dscrStress - 1.25,
        notes: passed ? "Passed" : "Risk if unhedged",
      });

      if (!passed) {
        allPass = false;
        vulnerableScenarios.push("FX Depreciation -10%");
      }
    }

    // Combined Perfect Storm: Revenue -8% + Cost +3% + Rate +150bps
    let perfectStormResult: StressTestScenario | undefined;
    if (scenarios.includes("COMBINED_PERFECT_STORM" as any)) {
      const revenueStress = baseCase.revenue * 0.92;
      const costStress = baseCase.debtService * 1.03;
      const dscrStress = revenueStress / costStress;
      const passed = dscrStress > 1.1;

      perfectStormResult = {
        scenarioId: "COMBINED_PERFECT_STORM" as any,
        name: "Perfect Storm: -8% Revenue, +3% Cost, +150bps Rate",
        description: "Combined extreme stress",
        assumption: "Multiple simultaneous shocks",
        dscrBase: baseCase.dscr,
        dscrStress,
        status: passed ? ScoringStatus.MARGINAL : ScoringStatus.CRITICAL,
        margin: dscrStress - 1.1,
        notes: "Extreme scenario - refinancing risk flagged",
      };

      if (dscrStress < 1.1) {
        allPass = false;
        vulnerableScenarios.push("Perfect Storm (CRITICAL)");
      }
    }

    // Determine overall rating
    const overallRating =
      allPass && vulnerableScenarios.length === 0
        ? "RESILIENT"
        : allPass && vulnerableScenarios.length <= 1
          ? "ADEQUATE"
          : vulnerableScenarios.length <= 2
            ? "VULNERABLE"
            : "CRITICAL";

    const result: StressTestResult = {
      evaluationId,
      baseCase,
      scenarios: stressResults,
      perfectStorm: perfectStormResult,
      summary: {
        allPass,
        vulnerableScenarios,
        criticalRisks: vulnerableScenarios.filter((s) =>
          s.includes("CRITICAL")
        ),
        overallRating: overallRating as any,
      },
    };

    // Save stress test results to database
    try {
      const analystId = body.analystId || "unknown";

      await saveStressTestResults(evaluationId, result);

      // Log stress test action
      await logScoringAction(
        analystId,
        "STRESS_TEST",
        `Stress test completed: ${overallRating} resilience (${result.summary.vulnerableScenarios.length} vulnerable scenarios)`,
        undefined,
        evaluationId
      );
    } catch (dbError) {
      console.error("[DB ERROR] Failed to save stress test results:", dbError);
      // Continue anyway - return the calculated result
    }

    console.log(
      `[STRESS TEST] Evaluation ${evaluationId}: ${overallRating} resilience`
    );

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error) {
    console.error("[STRESS TEST ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
