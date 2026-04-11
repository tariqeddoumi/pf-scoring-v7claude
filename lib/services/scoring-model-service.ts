import prisma from "@/lib/prisma-client";

export class ScoringModelService {
  /**
   * Create a new scoring model
   */
  static async createModel(data: {
    code: string;
    label: string;
    description?: string;
    versionNumber: number;
    createdBy: string;
  }) {
    const model = await prisma.scoringModel.create({
      data: {
        code: data.code,
        label: data.label,
        description: data.description,
        status: "DRAFT",
        isActive: true,
        ownerBusinessId: data.createdBy,
        versions: {
          create: {
            versionNumber: data.versionNumber,
            label: `v${data.versionNumber}`,
            status: "DRAFT",
            createdBy: data.createdBy,
            changeReason: "Initial version",
          },
        },
      },
      include: {
        versions: true,
      },
    });

    // Log change
    await this.logChange("CREATE", model.id, data.createdBy, {
      modelLabel: model.label,
    });

    return model;
  }

  /**
   * Get model by ID
   */
  static async getModelById(modelId: string) {
    return prisma.scoringModel.findUnique({
      where: { id: modelId },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  /**
   * List all models
   */
  static async listModels(filters?: {
    status?: "DRAFT" | "IN_VALIDATION" | "PUBLISHED" | "RETIRED" | "ARCHIVED";
    isActive?: boolean;
  }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return prisma.scoringModel.findMany({
      where,
      include: {
        versions: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Update model metadata
   */
  static async updateModel(
    modelId: string,
    data: {
      label?: string;
      description?: string;
      updatedBy: string;
    }
  ) {
    const model = await prisma.scoringModel.update({
      where: { id: modelId },
      data: {
        label: data.label,
        description: data.description,
        updatedAt: new Date(),
      },
    });

    await this.logChange("UPDATE", modelId, data.updatedBy, {
      changes: { label: data.label, description: data.description },
    });

    return model;
  }

  /**
   * Change model status
   */
  static async changeModelStatus(
    modelId: string,
    status: "DRAFT" | "IN_VALIDATION" | "PUBLISHED" | "RETIRED" | "ARCHIVED",
    changedBy: string
  ) {
    const model = await prisma.scoringModel.update({
      where: { id: modelId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    await this.logChange("STATUS_CHANGE", modelId, changedBy, {
      newStatus: status,
    });

    return model;
  }

  /**
   * Archive model (soft delete)
   */
  static async archiveModel(modelId: string, archivedBy: string) {
    const model = await prisma.scoringModel.update({
      where: { id: modelId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    await this.logChange("ARCHIVE", modelId, archivedBy, {
      archived: true,
    });

    return model;
  }

  /**
   * Log changes to audit trail
   */
  private static async logChange(
    action: string,
    modelId: string,
    userId: string,
    details: any
  ) {
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringModel",
        entityId: modelId,
        modelId: modelId,
        action,
        changedBy: userId,
        changedAt: new Date(),
        comment: JSON.stringify(details),
      },
    });
  }
}
