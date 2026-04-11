import prisma from "@/lib/prisma-client";

export class ScoringVersionService {
  /**
   * Create a new version
   */
  static async createVersion(data: {
    modelId: string;
    versionNumber: number;
    label?: string;
    changeReason?: string;
    createdBy: string;
  }) {
    const version = await prisma.scoringModelVersion.create({
      data: {
        modelId: data.modelId,
        versionNumber: data.versionNumber,
        label: data.label || `v${data.versionNumber}`,
        status: "DRAFT",
        changeReason: data.changeReason,
        createdBy: data.createdBy,
        isPublished: false,
      },
      include: {
        nodes: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return version;
  }

  /**
   * Get version by ID
   */
  static async getVersionById(versionId: string) {
    return prisma.scoringModelVersion.findUnique({
      where: { id: versionId },
      include: {
        nodes: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });
  }

  /**
   * Get all versions for a model
   */
  static async getVersionsByModel(modelId: string) {
    return prisma.scoringModelVersion.findMany({
      where: { modelId },
      include: {
        nodes: {
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Transition version status through workflow
   */
  static async transitionStatus(
    versionId: string,
    targetStatus:
      | "DRAFT"
      | "IN_REVIEW"
      | "APPROVED"
      | "PUBLISHED"
      | "RETIRED"
      | "ARCHIVED",
    transitionedBy: string
  ) {
    const version = await prisma.scoringModelVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new Error("Version not found");
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["IN_REVIEW", "ARCHIVED"],
      IN_REVIEW: ["APPROVED", "DRAFT"],
      APPROVED: ["PUBLISHED", "IN_REVIEW"],
      PUBLISHED: ["RETIRED"],
      RETIRED: ["ARCHIVED"],
      ARCHIVED: [],
    };

    if (!validTransitions[version.status]?.includes(targetStatus)) {
      throw new Error(
        `Cannot transition from ${version.status} to ${targetStatus}`
      );
    }

    let updateData: any = {
      status: targetStatus,
      updatedAt: new Date(),
    };

    // Set validation metadata if transitioning to APPROVED
    if (targetStatus === "IN_REVIEW") {
      updateData.validatedBy = transitionedBy;
      updateData.validatedAt = new Date();
    }

    const updatedVersion = await prisma.scoringModelVersion.update({
      where: { id: versionId },
      data: updateData,
    });

    // Log the transition
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringModelVersion",
        entityId: versionId,
        modelId: version.modelId,
        versionId,
        action: "VERSION_STATUS_TRANSITION",
        changedBy: transitionedBy,
        changedAt: new Date(),
        oldValueJson: JSON.stringify({ status: version.status }),
        newValueJson: JSON.stringify({ status: targetStatus }),
      },
    });

    return updatedVersion;
  }

  /**
   * Publish a version (makes it the active version)
   */
  static async publishVersion(versionId: string, publishedBy: string) {
    const version = await prisma.scoringModelVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new Error("Version not found");
    }

    if (version.status !== "APPROVED") {
      throw new Error("Only approved versions can be published");
    }

    // Unpublish current published version if exists
    await prisma.scoringModelVersion.updateMany({
      where: {
        modelId: version.modelId,
        isPublished: true,
      },
      data: {
        isPublished: false,
      },
    });

    // Publish this version
    const published = await prisma.scoringModelVersion.update({
      where: { id: versionId },
      data: {
        status: "PUBLISHED",
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: publishedBy,
        updatedAt: new Date(),
      },
    });

    // Log publication
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringModelVersion",
        entityId: versionId,
        modelId: version.modelId,
        versionId,
        action: "VERSION_PUBLISHED",
        changedBy: publishedBy,
        changedAt: new Date(),
        comment: `Version ${version.versionNumber} published`,
      },
    });

    return published;
  }
}
