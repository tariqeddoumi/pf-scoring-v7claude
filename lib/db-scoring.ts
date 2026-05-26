/**
 * Database Layer for PF Scoring V7++ Evaluations
 * Handles saving and retrieving evaluations from Supabase
 */

import { PrismaClient } from "@prisma/client";
import {
  ScoringResult,
  StressTestResult,
  Evaluation,
  EvaluationStatus,
} from "@/types/scoring-v7plus";

const prisma = new PrismaClient();

// ============================================================================
// EVALUATION OPERATIONS
// ============================================================================

/**
 * Save a new evaluation to the database
 */
export async function saveEvaluation(
  projectId: string,
  analystId: string,
  scoringResult: ScoringResult,
  stressTestResult?: StressTestResult
): Promise<Evaluation> {
  try {
    // Create evaluation record
    const evaluation = await prisma.evaluation.create({
      data: {
        projectId,
        analystId,
        scoringResult: scoringResult as any, // Store as JSON
        stressTestResult: stressTestResult as any, // Store as JSON if provided
        rating: scoringResult.rating,
        finalScore: scoringResult.finalScore,
        recommendation: scoringResult.recommendation,
        probabilityOfDefault: scoringResult.probabilityOfDefault,
        triggeredNOGOs: scoringResult.triggeredNOGOs as any,
        appliedMALUS: scoringResult.appliedMALUS as any,
        malusTotal: scoringResult.malusTotal,
        status: "valide" as any,
        version: "7.0",
      },
    });

    return evaluation as unknown as Evaluation;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieve an evaluation by ID
 */
export async function getEvaluation(
  evaluationId: string
): Promise<Evaluation | null> {
  try {
    return (await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        project: true,
        analyst: true,
      },
    })) as unknown as Evaluation | null;
  } catch (error) {
    throw error;
  }
}

/**
 * List evaluations for a project
 */
export async function getProjectEvaluations(
  projectId: string,
  limit: number = 10,
  offset: number = 0
): Promise<Evaluation[]> {
  try {
    return (await prisma.evaluation.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    })) as unknown as Evaluation[];
  } catch (error) {
    throw error;
  }
}

/**
 * Update evaluation status
 */
export async function updateEvaluationStatus(
  evaluationId: string,
  status: EvaluationStatus,
  notes?: string
): Promise<Evaluation> {
  try {
    return (await prisma.evaluation.update({
      where: { id: evaluationId },
      data: {
        status: status as any,
        notes,
        updatedAt: new Date(),
      },
    })) as unknown as Evaluation;
  } catch (error) {
    throw error;
  }
}

/**
 * Get latest evaluation for a project
 */
export async function getLatestEvaluation(
  projectId: string
): Promise<Evaluation | null> {
  try {
    return (await prisma.evaluation.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    })) as unknown as Evaluation | null;
  } catch (error) {
    throw error;
  }
}

/**
 * Save stress test results for an evaluation
 */
export async function saveStressTestResults(
  evaluationId: string,
  stressTestResult: StressTestResult
): Promise<unknown> {
  try {
    // Update evaluation with stress test results
    const evaluation = await prisma.evaluation.update({
      where: { id: evaluationId },
      data: {
        stressTestResult: stressTestResult as any,
      },
    });

    // Save individual scenario results
    if (stressTestResult.scenarios) {
      for (const scenario of stressTestResult.scenarios) {
        await prisma.stressTestScenarioResult.create({
          data: {
            evaluationId,
            scenarioId: scenario.scenarioId as string,
            scenarioName: scenario.name,
            dscrBase: scenario.dscrBase || 0,
            dscrStress: scenario.dscrStress || 0,
            status: scenario.status,
            margin: scenario.margin || 0,
            notes: scenario.notes,
          },
        });
      }
    }

    return evaluation;
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log a scoring action to audit trail
 */
export async function logScoringAction(
  userId: string,
  action: "CALCULATE" | "RECALCULATE" | "STRESS_TEST",
  details?: string,
  changes?: unknown,
  evaluationId?: string
): Promise<void> {
  try {
    await prisma.scoringAuditLog.create({
      data: {
        evaluationId: evaluationId || "",
        userId,
        action,
        changes: changes as any,
      },
    });
  } catch {
    // Don't throw - logging failure shouldn't break the flow
  }
}

/**
 * Get audit logs for an evaluation
 */
export async function getAuditLogs(): Promise<unknown[]> {
  try {
    // Note: This requires evaluationId to be linked in ScoringAuditLog
    // For now, retrieve all logs and filter by user
    return (await prisma.scoringAuditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 50,
    })) as unknown as unknown[];
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

/**
 * Get evaluation statistics for a project
 */
export async function getProjectEvaluationStats(projectId: string): Promise<{
  totalEvaluations: number;
  averageScore: number;
  ratingDistribution: Record<string, number>;
  lastEvaluation: Evaluation | null;
}> {
  try {
    const evaluations = (await prisma.evaluation.findMany({
      where: { projectId },
    })) as unknown as any[];

    if (evaluations.length === 0) {
      return {
        totalEvaluations: 0,
        averageScore: 0,
        ratingDistribution: {},
        lastEvaluation: null,
      };
    }

    // Calculate average score
    const avgScore =
      evaluations.reduce((sum, e: any) => sum + e.finalScore, 0) /
      evaluations.length;

    // Rating distribution
    const ratingDist: Record<string, number> = {};
    evaluations.forEach((e: any) => {
      ratingDist[e.rating] = (ratingDist[e.rating] || 0) + 1;
    });

    return {
      totalEvaluations: evaluations.length,
      averageScore: Math.round(avgScore * 100) / 100,
      ratingDistribution: ratingDist,
      lastEvaluation: evaluations[0] as Evaluation,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Export evaluations to CSV
 */
export async function exportEvaluationsToCSV(
  projectId: string
): Promise<string> {
  try {
    const evaluations = (await prisma.evaluation.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    })) as unknown as any[];

    if (evaluations.length === 0) {
      return "No evaluations found";
    }

    // CSV header
    const headers = [
      "ID",
      "Created",
      "Rating",
      "Score",
      "Recommendation",
      "PD",
      "NO-GOs",
      "MALUS",
    ];

    // CSV rows
    const rows = evaluations.map((e: any) => [
      e.id,
      e.createdAt.toISOString().split("T")[0],
      e.rating,
      e.finalScore.toFixed(2),
      e.recommendation,
      (e.probabilityOfDefault * 100).toFixed(1) + "%",
      e.triggeredNOGOs?.length || 0,
      e.malusTotal.toFixed(1),
    ]);

    // Format CSV
    const csv =
      [headers, ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join(
        "\n"
      ) + "\n";

    return csv;
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// CLEANUP & MAINTENANCE
// ============================================================================

/**
 * Delete old evaluations (keep only recent ones)
 */
export async function deleteOldEvaluations(
  daysToKeep: number = 90
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.evaluation.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    throw error;
  }
}

/**
 * Disconnect Prisma client
 */
export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}

const dbScoring = {
  saveEvaluation,
  getEvaluation,
  getProjectEvaluations,
  updateEvaluationStatus,
  getLatestEvaluation,
  saveStressTestResults,
  logScoringAction,
  getAuditLogs,
  getProjectEvaluationStats,
  exportEvaluationsToCSV,
  deleteOldEvaluations,
  disconnect,
};

export default dbScoring;
