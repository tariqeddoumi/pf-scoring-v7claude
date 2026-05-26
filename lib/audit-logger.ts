/**
 * Centralized Audit Logger for Phase 6 Backend
 * Tracks all data modifications with user context for compliance and debugging
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type EntityType =
  | "user"
  | "project"
  | "evaluation"
  | "scoring"
  | "config";
export type ActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "READ"
  | "VALIDATE"
  | "REJECT"
  | "SUBMIT"
  | "CALCULATE";

export interface AuditEntry {
  id?: string;
  entityType: EntityType;
  entityId: string;
  userId: string;
  action: ActionType;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress: string;
  sessionId: string;
  timestamp?: Date;
  status: "success" | "failure";
  errorMessage?: string;
  changeDetails?: string;
}

export interface AuditQueryOptions {
  entityType?: EntityType;
  entityId?: string;
  userId?: string;
  action?: ActionType;
  dateFrom?: Date;
  dateTo?: Date;
  status?: "success" | "failure";
  limit?: number;
  offset?: number;
}

/**
 * Centralized audit logging service
 * All data modifications are logged for compliance and debugging
 */
export class AuditLogger {
  /**
   * Log a generic audit action
   */
  async logAction(entry: AuditEntry): Promise<void> {
    try {
      const changeDetails = this.generateChangeDetails(
        entry.oldValues,
        entry.newValues
      );

      await prisma.scoringAuditLog.create({
        data: {
          evaluationId: entry.entityId, // Using evaluationId as primary FK
          userId: entry.userId,
          action: entry.action,
          changes: {
            entityType: entry.entityType,
            oldValues: entry.oldValues || {},
            newValues: entry.newValues || {},
            ipAddress: entry.ipAddress,
            sessionId: entry.sessionId,
            status: entry.status,
            errorMessage: entry.errorMessage,
            changeDetails,
          },
          timestamp: entry.timestamp || new Date(),
        },
      });
    } catch (error) {
      console.error("[AUDIT] Failed to log action:", error);
      // Don't throw - audit failures shouldn't break application flow
    }
  }

  /**
   * Log a CREATE action
   */
  async logCreate(
    userId: string,
    entityType: EntityType,
    entityId: string,
    newValues: Record<string, unknown>,
    ipAddress: string,
    sessionId: string
  ): Promise<void> {
    await this.logAction({
      entityType,
      entityId,
      userId,
      action: "CREATE",
      newValues,
      ipAddress,
      sessionId,
      status: "success",
    });
  }

  /**
   * Log an UPDATE action with before/after values
   */
  async logUpdate(
    userId: string,
    entityType: EntityType,
    entityId: string,
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>,
    ipAddress: string,
    sessionId: string
  ): Promise<void> {
    await this.logAction({
      entityType,
      entityId,
      userId,
      action: "UPDATE",
      oldValues,
      newValues,
      ipAddress,
      sessionId,
      status: "success",
    });
  }

  /**
   * Log a DELETE action
   */
  async logDelete(
    userId: string,
    entityType: EntityType,
    entityId: string,
    oldValues: Record<string, unknown>,
    ipAddress: string,
    sessionId: string
  ): Promise<void> {
    await this.logAction({
      entityType,
      entityId,
      userId,
      action: "DELETE",
      oldValues,
      ipAddress,
      sessionId,
      status: "success",
    });
  }

  /**
   * Log a READ action (for sensitive data access)
   */
  async logRead(
    userId: string,
    entityType: EntityType,
    entityId: string,
    ipAddress: string,
    sessionId: string
  ): Promise<void> {
    await this.logAction({
      entityType,
      entityId,
      userId,
      action: "READ",
      ipAddress,
      sessionId,
      status: "success",
    });
  }

  /**
   * Log an VALIDATE action
   */
  async logValidate(
    userId: string,
    entityId: string,
    ipAddress: string,
    sessionId: string
  ): Promise<void> {
    await this.logAction({
      entityType: "evaluation",
      entityId,
      userId,
      action: "VALIDATE",
      ipAddress,
      sessionId,
      status: "success",
    });
  }

  /**
   * Log a REJECT action
   */
  async logReject(
    userId: string,
    entityId: string,
    reason: string,
    ipAddress: string,
    sessionId: string
  ): Promise<void> {
    await this.logAction({
      entityType: "evaluation",
      entityId,
      userId,
      action: "REJECT",
      newValues: { reason },
      ipAddress,
      sessionId,
      status: "success",
    });
  }

  /**
   * Log a SUBMIT action
   */
  async logSubmit(
    userId: string,
    entityId: string,
    ipAddress: string,
    sessionId: string
  ): Promise<void> {
    await this.logAction({
      entityType: "evaluation",
      entityId,
      userId,
      action: "SUBMIT",
      ipAddress,
      sessionId,
      status: "success",
    });
  }

  /**
   * Log a CALCULATE action (scoring calculation)
   */
  async logCalculate(
    userId: string,
    entityId: string,
    calculationResult: Record<string, unknown>,
    ipAddress: string,
    sessionId: string
  ): Promise<void> {
    await this.logAction({
      entityType: "scoring",
      entityId,
      userId,
      action: "CALCULATE",
      newValues: calculationResult,
      ipAddress,
      sessionId,
      status: "success",
    });
  }

  /**
   * Log a failed action
   */
  async logFailure(
    userId: string,
    entityType: EntityType,
    entityId: string,
    action: ActionType,
    errorMessage: string,
    ipAddress: string,
    sessionId: string
  ): Promise<void> {
    await this.logAction({
      entityType,
      entityId,
      userId,
      action,
      ipAddress,
      sessionId,
      status: "failure",
      errorMessage,
    });
  }

  /**
   * Get audit trail for an entity
   */
  async getAuditTrail(
    entityId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<unknown[]> {
    try {
      const limit = options?.limit || 100;
      const offset = options?.offset || 0;

      const logs = await prisma.scoringAuditLog.findMany({
        where: {
          evaluationId: entityId,
        },
        orderBy: {
          timestamp: "desc",
        },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nom: true,
              prenom: true,
            },
          },
        },
      });

      return logs as unknown as unknown[];
    } catch (error) {
      console.error("[AUDIT] Failed to retrieve audit trail:", error);
      return [];
    }
  }

  /**
   * Query audit logs with filters
   */
  async queryAuditLogs(
    options: AuditQueryOptions
  ): Promise<{ entries: unknown[]; total: number }> {
    try {
      const limit = options.limit || 50;
      const offset = options.offset || 0;

      const where: Record<string, unknown> = {};

      if (options.entityId) {
        where.evaluationId = options.entityId;
      }
      if (options.userId) {
        where.userId = options.userId;
      }
      if (options.action) {
        where.action = options.action;
      }

      const entries = await prisma.scoringAuditLog.findMany({
        where,
        orderBy: {
          timestamp: "desc",
        },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nom: true,
              prenom: true,
            },
          },
        },
      });

      const total = await prisma.scoringAuditLog.count({ where });

      return { entries, total };
    } catch (error) {
      console.error("[AUDIT] Failed to query audit logs:", error);
      return { entries: [], total: 0 };
    }
  }

  /**
   * Generate human-readable change details
   */
  private generateChangeDetails(
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): string {
    if (!oldValues && !newValues) {
      return "";
    }

    const changes: string[] = [];

    if (newValues && !oldValues) {
      // CREATE action
      Object.entries(newValues).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          changes.push(`Created ${key}: ${this.formatValue(value)}`);
        }
      });
    } else if (oldValues && newValues) {
      // UPDATE action
      Object.keys(newValues).forEach((key) => {
        const oldValue = oldValues[key];
        const newValue = newValues[key];

        if (oldValue !== newValue) {
          changes.push(
            `Changed ${key} from ${this.formatValue(oldValue)} to ${this.formatValue(newValue)}`
          );
        }
      });
    } else if (oldValues && !newValues) {
      // DELETE action
      Object.entries(oldValues).forEach(([key, value]) => {
        changes.push(`Deleted ${key}: ${this.formatValue(value)}`);
      });
    }

    return changes.join("; ");
  }

  /**
   * Format value for display
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return "null";
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    if (typeof value === "object") {
      return JSON.stringify(value).substring(0, 100);
    }
    return String(value).substring(0, 100);
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
