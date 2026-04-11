import prisma from "@/lib/prisma-client";
import { ScoringNodeType, ScoringAnswerType } from "@prisma/client";

export class ScoringNodeService {
  /**
   * Create a new node in a version
   */
  static async createNode(data: {
    versionId: string;
    nodeType: ScoringNodeType;
    code: string;
    label: string;
    description?: string;
    parentNodeId?: string;
    depth?: number;
    weight?: number;
    answerType?: ScoringAnswerType;
    scoringMethod?: string;
    aggregationMethod?: string;
    createdBy: string;
  }) {
    // Get max order for siblings
    let maxOrderIndex = 0;
    if (data.parentNodeId) {
      const maxOrderResult = await prisma.scoringNode.aggregate({
        where: { parentNodeId: data.parentNodeId, versionId: data.versionId },
        _max: { orderIndex: true },
      });
      maxOrderIndex = (maxOrderResult._max.orderIndex || -1) + 1;
    }

    const version = await prisma.scoringModelVersion.findUnique({
      where: { id: data.versionId },
    });

    if (!version) {
      throw new Error("Version not found");
    }

    const node = await prisma.scoringNode.create({
      data: {
        versionId: data.versionId,
        nodeType: data.nodeType,
        code: data.code,
        label: data.label,
        description: data.description,
        parentNodeId: data.parentNodeId,
        depth: data.depth ?? 0,
        orderIndex: maxOrderIndex,
        weight: data.weight,
        answerType: data.answerType,
        scoringMethod: data.scoringMethod,
        aggregationMethod: data.aggregationMethod,
        isActive: true,
      },
      include: {
        options: true,
        ranges: true,
        childNodes: true,
      },
    });

    // Log creation
    await this.logNodeChange("CREATE", version.modelId, data.createdBy, {
      nodeId: node.id,
      nodeLabel: node.label,
    });

    return node;
  }

  /**
   * Get node by ID
   */
  static async getNodeById(nodeId: string) {
    return prisma.scoringNode.findUnique({
      where: { id: nodeId },
      include: {
        options: {
          orderBy: { orderIndex: "asc" },
        },
        ranges: {
          orderBy: { orderIndex: "asc" },
        },
        formulas: true,
        rules: true,
        applicabilityRules: true,
        documentRequirements: true,
        childNodes: {
          orderBy: { orderIndex: "asc" },
        },
        parentNode: true,
      },
    });
  }

  /**
   * Get all nodes in a version
   */
  static async getNodesByVersion(versionId: string) {
    return prisma.scoringNode.findMany({
      where: { versionId },
      include: {
        options: true,
        ranges: true,
        childNodes: {
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: [{ parentNodeId: "asc" }, { orderIndex: "asc" }],
    });
  }

  /**
   * Update node
   */
  static async updateNode(
    nodeId: string,
    data: {
      label?: string;
      description?: string;
      weight?: number;
      answerType?: ScoringAnswerType;
      scoringMethod?: string;
      aggregationMethod?: string;
      updatedBy: string;
    }
  ) {
    const node = await prisma.scoringNode.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      throw new Error("Node not found");
    }

    const updated = await prisma.scoringNode.update({
      where: { id: nodeId },
      data: {
        label: data.label,
        description: data.description,
        weight: data.weight,
        answerType: data.answerType,
        scoringMethod: data.scoringMethod,
        aggregationMethod: data.aggregationMethod,
        updatedAt: new Date(),
      },
    });

    await this.logNodeChange("UPDATE", node.id, data.updatedBy, {
      nodeId,
      changes: data,
    });

    return updated;
  }

  /**
   * Reorder nodes (change order within same parent)
   */
  static async reorderNode(
    nodeId: string,
    newOrderIndex: number,
    reorderedBy: string
  ) {
    const node = await prisma.scoringNode.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      throw new Error("Node not found");
    }

    // Get all siblings
    const siblings = await prisma.scoringNode.findMany({
      where: {
        parentNodeId: node.parentNodeId,
        versionId: node.versionId,
      },
      orderBy: { orderIndex: "asc" },
    });

    if (newOrderIndex < 0 || newOrderIndex >= siblings.length) {
      throw new Error("Invalid order");
    }

    // Reorder siblings
    const oldOrder = node.orderIndex;
    if (newOrderIndex < oldOrder) {
      // Moving up: increment siblings between new and old order
      await prisma.scoringNode.updateMany({
        where: {
          parentNodeId: node.parentNodeId,
          versionId: node.versionId,
          orderIndex: {
            gte: newOrderIndex,
            lt: oldOrder,
          },
        },
        data: {
          orderIndex: {
            increment: 1,
          },
        },
      });
    } else if (newOrderIndex > oldOrder) {
      // Moving down: decrement siblings between old and new order
      await prisma.scoringNode.updateMany({
        where: {
          parentNodeId: node.parentNodeId,
          versionId: node.versionId,
          orderIndex: {
            gt: oldOrder,
            lte: newOrderIndex,
          },
        },
        data: {
          orderIndex: {
            decrement: 1,
          },
        },
      });
    }

    const updated = await prisma.scoringNode.update({
      where: { id: nodeId },
      data: { orderIndex: newOrderIndex },
    });

    await this.logNodeChange("REORDER", node.id, reorderedBy, {
      nodeId,
      oldOrder,
      newOrder: newOrderIndex,
    });

    return updated;
  }

  /**
   * Delete node (cascade delete children)
   */
  static async deleteNode(nodeId: string, deletedBy: string) {
    const node = await prisma.scoringNode.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      throw new Error("Node not found");
    }

    // Delete all descendants
    const deleteDescendants = async (parentId: string) => {
      const children = await prisma.scoringNode.findMany({
        where: { parentNodeId: parentId },
      });

      for (const child of children) {
        await deleteDescendants(child.id);
      }

      await prisma.scoringNode.deleteMany({
        where: { parentNodeId: parentId },
      });
    };

    await deleteDescendants(nodeId);

    // Delete node itself
    await prisma.scoringNode.delete({
      where: { id: nodeId },
    });

    await this.logNodeChange("DELETE", node.id, deletedBy, {
      nodeId,
      nodeLabel: node.label,
    });

    return { success: true };
  }

  /**
   * Add scoring option to a node
   */
  static async addNodeOption(data: {
    nodeId: string;
    label: string;
    value?: string;
    score?: number;
    createdBy: string;
  }) {
    const node = await prisma.scoringNode.findUnique({
      where: { id: data.nodeId },
    });

    if (!node) {
      throw new Error("Node not found");
    }

    const maxOrder = await prisma.scoringNodeOption.aggregate({
      where: { nodeId: data.nodeId },
      _max: { orderIndex: true },
    });

    const option = await prisma.scoringNodeOption.create({
      data: {
        nodeId: data.nodeId,
        label: data.label,
        value: data.value,
        score: data.score,
        orderIndex: (maxOrder._max.orderIndex || -1) + 1,
        isActive: true,
      },
    });

    return option;
  }

  /**
   * Add scoring range to a node
   */
  static async addNodeRange(data: {
    nodeId: string;
    label?: string;
    minValue: number;
    maxValue: number;
    score?: number;
    createdBy: string;
  }) {
    const node = await prisma.scoringNode.findUnique({
      where: { id: data.nodeId },
    });

    if (!node) {
      throw new Error("Node not found");
    }

    const maxOrder = await prisma.scoringNodeRange.aggregate({
      where: { nodeId: data.nodeId },
      _max: { orderIndex: true },
    });

    const range = await prisma.scoringNodeRange.create({
      data: {
        nodeId: data.nodeId,
        label: data.label,
        minValue: data.minValue,
        maxValue: data.maxValue,
        score: data.score,
        orderIndex: (maxOrder._max.orderIndex || -1) + 1,
        isActive: true,
      },
    });

    return range;
  }

  /**
   * Add rule to a node
   */
  static async addNodeRule(data: {
    nodeId: string;
    versionId: string;
    ruleType: string;
    code: string;
    label: string;
    description?: string;
    conditionExpression?: string;
    severity?: string;
    actionType?: string;
    createdBy: string;
  }) {
    const rule = await prisma.scoringNodeRule.create({
      data: {
        nodeId: data.nodeId,
        versionId: data.versionId,
        ruleType: data.ruleType as any,
        code: data.code,
        label: data.label,
        description: data.description,
        conditionExpression: data.conditionExpression || "",
        severity: data.severity || "MEDIUM",
        actionType: data.actionType || "BLOCK",
        orderIndex: 0,
        isActive: true,
      },
    });

    return rule;
  }

  /**
   * Add applicability rule to a node
   */
  static async addApplicabilityRule(data: {
    nodeId: string;
    effectType: string;
    conditionExpression?: string;
    createdBy: string;
  }) {
    const rule = await prisma.scoringNodeApplicabilityRule.create({
      data: {
        nodeId: data.nodeId,
        conditionExpression: data.conditionExpression || "",
        effectType: data.effectType as any,
        isActive: true,
      },
    });

    return rule;
  }

  /**
   * Log node changes
   */
  private static async logNodeChange(
    action: string,
    nodeId: string,
    userId: string,
    details: any
  ) {
    // Get the node to find the model and version
    const node = await prisma.scoringNode.findUnique({
      where: { id: nodeId },
      select: { versionId: true },
    });

    if (!node) return;

    const version = await prisma.scoringModelVersion.findUnique({
      where: { id: node.versionId },
      select: { modelId: true },
    });

    if (!version) return;

    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringNode",
        entityId: nodeId,
        modelId: version.modelId,
        versionId: node.versionId,
        action: `NODE_${action}`,
        changedBy: userId,
        changedAt: new Date(),
        comment: JSON.stringify(details),
      },
    });
  }
}
