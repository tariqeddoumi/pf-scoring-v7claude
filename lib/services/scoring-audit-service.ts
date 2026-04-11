import prisma from "@/lib/prisma-client";

/**
 * Comprehensive audit trail service for scoring system
 */
export class ScoringAuditService {
  /**
   * Log model creation or modification
   */
  static async logModelChange(
    modelId: string,
    action: "CREATE" | "UPDATE" | "DELETE" | "PUBLISH" | "ARCHIVE",
    changedBy: string,
    details: any
  ) {
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringModel",
        entityId: modelId,
        modelId: modelId,
        action,
        changedBy,
        changedAt: new Date(),
        comment: JSON.stringify({
          action,
          timestamp: new Date().toISOString(),
          ...details,
        }),
      },
    });
  }

  /**
   * Log version status transition
   */
  static async logVersionTransition(
    versionId: string,
    modelId: string,
    fromStatus: string,
    toStatus: string,
    transitionedBy: string,
    reason?: string
  ) {
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringModelVersion",
        entityId: versionId,
        modelId,
        versionId,
        action: "STATUS_TRANSITION",
        changedBy: transitionedBy,
        changedAt: new Date(),
        oldValueJson: JSON.stringify({ status: fromStatus }),
        newValueJson: JSON.stringify({ status: toStatus }),
        comment: reason || `Transitioned from ${fromStatus} to ${toStatus}`,
      },
    });
  }

  /**
   * Log node changes
   */
  static async logNodeChange(
    nodeId: string,
    modelId: string,
    versionId: string,
    action: "CREATE" | "UPDATE" | "DELETE" | "REORDER",
    changedBy: string,
    oldValue?: any,
    newValue?: any
  ) {
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringNode",
        entityId: nodeId,
        modelId,
        versionId,
        action,
        changedBy,
        changedAt: new Date(),
        oldValueJson: oldValue ? JSON.stringify(oldValue) : null,
        newValueJson: newValue ? JSON.stringify(newValue) : null,
      },
    });
  }

  /**
   * Log evaluation answer changes
   */
  static async logAnswerChange(
    evaluationId: string,
    nodeId: string,
    modelId: string,
    action: "CREATE" | "UPDATE",
    changedBy: string,
    oldValue?: any,
    newValue?: any
  ) {
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringEvaluationAnswer",
        entityId: `${evaluationId}:${nodeId}`,
        modelId,
        evaluationId,
        action,
        changedBy,
        changedAt: new Date(),
        oldValueJson: oldValue ? JSON.stringify(oldValue) : null,
        newValueJson: newValue ? JSON.stringify(newValue) : null,
      },
    });
  }

  /**
   * Log evaluation status change
   */
  static async logEvaluationStatusChange(
    evaluationId: string,
    modelId: string,
    fromStatus: string,
    toStatus: string,
    changedBy: string,
    reason?: string
  ) {
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringEvaluation",
        entityId: evaluationId,
        modelId,
        evaluationId,
        action: "STATUS_CHANGE",
        changedBy,
        changedAt: new Date(),
        oldValueJson: JSON.stringify({ status: fromStatus }),
        newValueJson: JSON.stringify({ status: toStatus }),
        comment: reason || `Status changed from ${fromStatus} to ${toStatus}`,
      },
    });
  }

  /**
   * Log scoring calculation
   */
  static async logScoringCalculation(
    evaluationId: string,
    modelId: string,
    globalScore: number,
    nodeCount: number,
    rulesTriggered: number,
    calculatedBy: string
  ) {
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringEvaluation",
        entityId: evaluationId,
        modelId,
        evaluationId,
        action: "SCORING_CALCULATED",
        changedBy: calculatedBy,
        changedAt: new Date(),
        comment: JSON.stringify({
          globalScore,
          nodeCount,
          rulesTriggered,
          calculatedAt: new Date().toISOString(),
        }),
      },
    });
  }

  /**
   * Get audit trail for a model
   */
  static async getModelAuditTrail(modelId: string, limit: number = 100) {
    return prisma.scoringChangeLog.findMany({
      where: { modelId },
      orderBy: { changedAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get audit trail for an evaluation
   */
  static async getEvaluationAuditTrail(evaluationId: string) {
    return prisma.scoringChangeLog.findMany({
      where: { evaluationId },
      orderBy: { changedAt: "desc" },
    });
  }

  /**
   * Get audit trail for a version
   */
  static async getVersionAuditTrail(versionId: string) {
    return prisma.scoringChangeLog.findMany({
      where: { versionId },
      orderBy: { changedAt: "desc" },
    });
  }

  /**
   * Generate audit summary for a period
   */
  static async getAuditSummary(
    modelId: string,
    startDate: Date,
    endDate: Date
  ) {
    const logs = await prisma.scoringChangeLog.findMany({
      where: {
        modelId,
        changedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const actionCounts = logs.reduce(
      (acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const userActions = logs.reduce(
      (acc, log) => {
        if (!acc[log.changedBy]) {
          acc[log.changedBy] = [];
        }
        acc[log.changedBy].push(log.action);
        return acc;
      },
      {} as Record<string, string[]>
    );

    return {
      totalChanges: logs.length,
      actionCounts,
      userActions,
      firstChange: logs[logs.length - 1]?.changedAt,
      lastChange: logs[0]?.changedAt,
    };
  }

  /**
   * Export audit trail as CSV
   */
  static async exportAuditTrailAsCSV(
    modelId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const where: any = { modelId };

    if (startDate || endDate) {
      where.changedAt = {};
      if (startDate) where.changedAt.gte = startDate;
      if (endDate) where.changedAt.lte = endDate;
    }

    const logs = await prisma.scoringChangeLog.findMany({
      where,
      orderBy: { changedAt: "desc" },
    });

    // CSV headers
    let csv = "Timestamp,Entity Type,Entity ID,Action,Changed By,Comment\n";

    // CSV rows
    for (const log of logs) {
      const timestamp = log.changedAt.toISOString();
      const comment = (log.comment || "").replace(/"/g, '""');
      csv += `"${timestamp}","${log.entityType}","${log.entityId}","${log.action}","${log.changedBy}","${comment}"\n`;
    }

    return csv;
  }
}
