import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ScoringWorkflowService {
  /**
   * Get all workflows with optional filtering
   */
  static async getAllWorkflows(filters?: {
    status?: string;
    evaluationId?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const whereClause: any = {};
    if (filters?.status) whereClause.status = filters.status;
    if (filters?.evaluationId) whereClause.evaluationId = filters.evaluationId;

    const [workflows, total] = await Promise.all([
      prisma.scoringWorkflow.findMany({
        where: whereClause,
        include: {
          evaluation: {
            include: {
              project: true,
              analyst: {
                select: { id: true, email: true, nom: true, prenom: true }
              }
            }
          },
          steps: { orderBy: { stepNumber: 'asc' } },
          decisions: { take: 1, orderBy: { decidedAt: 'desc' } },
          approvals: { where: { status: 'PENDING' } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.scoringWorkflow.count({ where: whereClause })
    ]);

    return { workflows, total };
  }

  /**
   * Get a single workflow with full details
   */
  static async getWorkflowById(id: string) {
    return prisma.scoringWorkflow.findUnique({
      where: { id },
      include: {
        evaluation: {
          include: {
            project: true,
            analyst: {
              select: { id: true, email: true, nom: true, prenom: true }
            },
            answers: true,
            nodeResults: true
          }
        },
        steps: { orderBy: { stepNumber: 'asc' } },
        decisions: {
          include: {
            decidedByUser: {
              select: { id: true, email: true, nom: true, prenom: true }
            }
          },
          orderBy: { decidedAt: 'desc' }
        },
        approvals: {
          include: {
            approvedByUser: {
              select: { id: true, email: true, nom: true, prenom: true }
            }
          }
        },
        comments: {
          include: {
            createdByUser: {
              select: { id: true, email: true, nom: true, prenom: true }
            },
            replies: {
              include: {
                createdByUser: {
                  select: { id: true, email: true, nom: true, prenom: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  /**
   * Create a decision on a workflow
   */
  static async createDecision(
    workflowId: string,
    data: {
      decisionType: string;
      riskRating: string;
      justification: string;
      recommendation?: string;
      hasConditions?: boolean;
      conditionsJson?: string;
      requiresHigherApproval?: boolean;
      decidedBy: string;
    }
  ) {
    const workflow = await prisma.scoringWorkflow.findUnique({
      where: { id: workflowId }
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Create decision
    const decision = await prisma.scoringDecision.create({
      data: {
        workflowId,
        ...data,
        decidedAt: new Date()
      },
      include: {
        decidedByUser: {
          select: { id: true, email: true, nom: true, prenom: true }
        }
      }
    });

    // Update workflow status
    let newStatus = workflow.status;
    if (data.decisionType === 'APPROVE' || data.decisionType === 'APPROVE_WITH_CONDITIONS') {
      newStatus = 'APPROVED';
    } else if (data.decisionType === 'REJECT') {
      newStatus = 'REJECTED';
    }

    await prisma.scoringWorkflow.update({
      where: { id: workflowId },
      data: {
        status: newStatus,
        approvedAt: newStatus === 'APPROVED' ? new Date() : undefined,
        approvedBy: newStatus === 'APPROVED' ? data.decidedBy : undefined,
        rejectedAt: newStatus === 'REJECTED' ? new Date() : undefined,
        rejectedBy: newStatus === 'REJECTED' ? data.decidedBy : undefined
      }
    });

    return decision;
  }

  /**
   * Add a comment to a workflow
   */
  static async addComment(
    workflowId: string,
    data: {
      content: string;
      commentType?: string;
      isInternal?: boolean;
      createdBy: string;
      parentCommentId?: string;
    }
  ) {
    const workflow = await prisma.scoringWorkflow.findUnique({
      where: { id: workflowId }
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    return prisma.scoringComment.create({
      data: {
        workflowId,
        ...data,
        commentType: data.commentType || 'GENERAL',
        isInternal: data.isInternal || false,
        createdAt: new Date()
      },
      include: {
        createdByUser: {
          select: { id: true, email: true, nom: true, prenom: true }
        }
      }
    });
  }

  /**
   * Create an override for a node in an evaluation
   */
  static async createOverride(data: {
    evaluationId: string;
    nodeId: string;
    originalValue?: string;
    originalScore?: number;
    overriddenValue?: string;
    overriddenScore?: number;
    reason: string;
    justification?: string;
    riskLevel: string;
    overriddenBy: string;
  }) {
    return prisma.scoringOverride.create({
      data: {
        ...data,
        status: 'PENDING',
        overriddenAt: new Date()
      },
      include: {
        evaluation: {
          select: { id: true, finalScore: true }
        },
        node: {
          select: { id: true, label: true }
        },
        overriddenByUser: {
          select: { id: true, email: true, nom: true, prenom: true }
        }
      }
    });
  }

  /**
   * Approve or reject an override
   */
  static async updateOverride(
    id: string,
    status: string,
    approvedBy?: string
  ) {
    return prisma.scoringOverride.update({
      where: { id },
      data: {
        status,
        approvedBy: status === 'APPROVED' ? approvedBy : undefined,
        approvedAt: status === 'APPROVED' ? new Date() : undefined
      },
      include: {
        evaluation: {
          select: { id: true }
        },
        node: {
          select: { id: true, label: true }
        },
        overriddenByUser: {
          select: { id: true, email: true, nom: true, prenom: true }
        },
        approvedByUser: {
          select: { id: true, email: true, nom: true, prenom: true }
        }
      }
    });
  }

  /**
   * Upload a document for an evaluation
   */
  static async uploadDocument(data: {
    evaluationId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    storagePath: string;
    documentType: string;
    nodeId?: string;
    isRequired?: boolean;
    description?: string;
    notes?: string;
    uploadedBy: string;
  }) {
    return prisma.scoringDocument.create({
      data: {
        ...data,
        isRequired: data.isRequired || false,
        uploadedAt: new Date()
      },
      include: {
        evaluation: {
          select: { id: true }
        },
        uploadedByUser: {
          select: { id: true, email: true, nom: true, prenom: true }
        }
      }
    });
  }

  /**
   * Verify a document
   */
  static async verifyDocument(
    id: string,
    verifiedBy: string
  ) {
    return prisma.scoringDocument.update({
      where: { id },
      data: {
        verifiedBy,
        verifiedAt: new Date()
      },
      include: {
        uploadedByUser: {
          select: { id: true, email: true, nom: true, prenom: true }
        },
        verifiedByUser: {
          select: { id: true, email: true, nom: true, prenom: true }
        }
      }
    });
  }
}
