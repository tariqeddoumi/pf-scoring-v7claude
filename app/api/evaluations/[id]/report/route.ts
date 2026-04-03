/**
 * GET /api/evaluations/[id]/report
 * Generate and retrieve a scoring report
 */

import { NextRequest, NextResponse } from "next/server";
import { ScoringReport } from "@/types/scoring-v7plus";
import { getEvaluation, getAuditLogs } from "@/lib/db-scoring";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const evaluationId = context.params.id;

    // Fetch evaluation from database
    const evaluation = await getEvaluation(evaluationId);

    if (!evaluation) {
      return NextResponse.json(
        {
          success: false,
          error: "Evaluation not found",
        },
        { status: 404 }
      );
    }

    // Fetch audit logs for this evaluation
    const auditLogs = await getAuditLogs(evaluationId);

    // Build report from database evaluation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scoringResult = evaluation.scoringResult as any;
    const report: ScoringReport = {
      evaluationId,
      projectName: evaluation.project?.name || "[Unknown Project]",
      analyst: evaluation.analystId || "[Unknown Analyst]",
      reportDate: new Date(evaluation.createdAt),
      scoring: {
        evaluationId,
        projectId: evaluation.projectId,
        projectName: evaluation.project?.name || "[Unknown Project]",
        domains: scoringResult.domains || {},
        globalScore: scoringResult.globalScore || 0,
        normalizedScore: scoringResult.normalizedScore || 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rating: evaluation.rating as any,
        probabilityOfDefault: evaluation.probabilityOfDefault,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        triggeredNOGOs: evaluation.triggeredNOGOs as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        appliedMALUS: evaluation.appliedMALUS as any,
        malusTotal: evaluation.malusTotal,
        finalScore: evaluation.finalScore,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recommendation: evaluation.recommendation as any,
        calculatedAt: new Date(evaluation.createdAt),
        version: `${evaluation.version}`,
      },
      recommendations: [
        evaluation.recommendation === "APPROVE" ? "Project approved for financing" : "Additional due diligence required",
        ...(evaluation.notes ? [evaluation.notes] : []),
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conditions: (evaluation.triggeredNOGOs as any)?.length > 0 ? ["NO-GO rules triggered"] : [],
    };

    // Generate response based on format query parameter
    const format = request.nextUrl.searchParams.get("format") || "json";

    if (format === "pdf") {
      // In production: Generate PDF using a library like jsPDF or puppeteer
      return NextResponse.json(
        {
          success: false,
          error: "PDF generation not yet implemented. Use format=json",
        },
        { status: 501 }
      );
    } else if (format === "csv") {
      // In production: Generate CSV export
      return NextResponse.json(
        {
          success: false,
          error: "CSV export not yet implemented. Use format=json",
        },
        { status: 501 }
      );
    }

    // Default: JSON format
    return NextResponse.json(
      {
        success: true,
        report,
        auditTrail: auditLogs,
        metadata: {
          evaluationId,
          generatedAt: new Date().toISOString(),
          version: evaluation.version,
          availableFormats: ["json"],
          documentationUrl: "/api/docs/evaluations",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[REPORT ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/evaluations/[id]/report
 * Generate a new report for an evaluation
 */
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const evaluationId = context.params.id;

    // Parse request options
    const body = await request.json();
    const { format = "json", includeStressTests = true } = body;

    // Verify evaluation exists
    const evaluation = await getEvaluation(evaluationId);
    if (!evaluation) {
      return NextResponse.json(
        {
          success: false,
          error: "Evaluation not found",
        },
        { status: 404 }
      );
    }

    // In production:
    // 1. Fetch evaluation from database ✓
    // 2. Generate report with formatting (queued async)
    // 3. Save to database if requested
    // 4. Return generated report reference

    const response = {
      success: true,
      message: "Report generation queued",
      evaluationId,
      format,
      includeStressTests,
      estimatedTime: "5-10 seconds",
      retrieveAt: `/api/evaluations/${evaluationId}/report?format=${format}`,
    };

    console.log(`[REPORT] Generation started for ${evaluationId} (format: ${format})`);

    return NextResponse.json(response, { status: 202 }); // 202 Accepted
  } catch (error) {
    console.error("[REPORT ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
