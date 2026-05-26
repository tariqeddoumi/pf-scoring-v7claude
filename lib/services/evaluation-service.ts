import prisma from "@/lib/prisma-client";
import {
  createEvaluationSchema,
  submitEvaluationSchema,
  validateEvaluationSchema,
  rejectEvaluationSchema,
} from "@/lib/validation-schemas";
import type { z } from "zod";

export class EvaluationService {
  /**
   * Create new evaluation (draft)
   */
  static async createEvaluation(
    data: z.infer<typeof createEvaluationSchema>,
    createdBy: string
  ) {
    const validated = createEvaluationSchema.parse(data);

    // Ensure project exists
    const project = await prisma.project.findUnique({
      where: { id: validated.projectId },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        projectId: validated.projectId,
        analystId: createdBy,
        scoringResult: (validated.scoringResult || {}) as Record<string, unknown>,
        finalScore: validated.finalScore || 0,
        rating: "D",
        recommendation: "APPROVE",
        probabilityOfDefault: 0,
        triggeredNOGOs: [],
        appliedMALUS: [],
        malusTotal: 0,
        status: "brouillon",
        version: "7.0",
      },
    });

    return evaluation;
  }

  /**
   * Get evaluation by ID
   */
  static async getEvaluationById(id: string, _userId?: string) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, nom: true, status: true },
        },
        analyst: {
          select: { id: true, email: true, nom: true, prenom: true },
        },
      },
    });

    return evaluation;
  }

  /**
   * Get all evaluations (paginated)
   */
  static async getAllEvaluations(
    page: number = 1,
    limit: number = 50,
    filters?: Record<string, unknown>
  ) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.analystId) where.analystId = filters.analystId;
    if (filters?.rating) where.rating = filters.rating;
    if (typeof filters?.isArchived === "boolean") where.isArchived = filters.isArchived;

    const [evaluations, total] = await Promise.all([
      prisma.evaluation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          project: { select: { nom: true } },
          analyst: { select: { nom: true, prenom: true } },
        },
      }),
      prisma.evaluation.count({ where }),
    ]);

    return {
      data: evaluations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Submit evaluation for validation
   */
  static async submitEvaluation(
    id: string,
    data: z.infer<typeof submitEvaluationSchema>,
    _submittedBy: string
  ) {
    const validated = submitEvaluationSchema.parse(data);

    const oldEval = await prisma.evaluation.findUnique({ where: { id } });

    if (!oldEval) {
      throw new Error("Evaluation not found");
    }

    if (oldEval.status !== "brouillon") {
      throw new Error("Can only submit draft evaluations");
    }

    const evaluation = await prisma.evaluation.update({
      where: { id },
      data: {
        status: "soumis",
        finalScore: validated.finalScore,
        rating: validated.rating,
        probabilityOfDefault: validated.probabilityOfDefault,
        triggeredNOGOs: validated.triggeredNOGOs as unknown[],
        appliedMALUS: validated.appliedMALUS as unknown[],
        malusTotal: validated.malusTotal,
        notes: validated.notes,
        updatedAt: new Date(),
      },
    });

    return evaluation;
  }

  /**
   * Validate evaluation (manager/admin)
   */
  static async validateEvaluation(
    id: string,
    data: z.infer<typeof validateEvaluationSchema>,
    _validatedBy: string
  ) {
    const validated = validateEvaluationSchema.parse(data);

    const oldEval = await prisma.evaluation.findUnique({ where: { id } });

    if (!oldEval) {
      throw new Error("Evaluation not found");
    }

    if (oldEval.status !== "soumis") {
      throw new Error("Can only validate submitted evaluations");
    }

    const evaluation = await prisma.evaluation.update({
      where: { id },
      data: {
        status: "valide",
        recommendation: validated.recommendation,
        notes: validated.notes,
        updatedAt: new Date(),
      },
    });

    // Update project status and score
    await prisma.project.update({
      where: { id: evaluation.projectId },
      data: {
        status: "approuve",
        scoreGlobal: evaluation.finalScore,
        grade: evaluation.rating,
      },
    });

    return evaluation;
  }

  /**
   * Reject evaluation (manager/admin)
   */
  static async rejectEvaluation(
    id: string,
    data: z.infer<typeof rejectEvaluationSchema>,
    _rejectedBy: string
  ) {
    const validated = rejectEvaluationSchema.parse(data);

    const oldEval = await prisma.evaluation.findUnique({ where: { id } });

    if (!oldEval) {
      throw new Error("Evaluation not found");
    }

    if (!["soumis", "valide"].includes(oldEval.status)) {
      throw new Error("Can only reject submitted or validated evaluations");
    }

    const evaluation = await prisma.evaluation.update({
      where: { id },
      data: {
        status: "rejete",
        notes: validated.notes,
        updatedAt: new Date(),
      },
    });

    // Update project status
    await prisma.project.update({
      where: { id: evaluation.projectId },
      data: { status: "rejete" },
    });

    return evaluation;
  }

  /**
   * Get evaluations by project
   */
  static async getEvaluationsByProject(projectId: string) {
    return prisma.evaluation.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get evaluations by analyst
   */
  static async getEvaluationsByAnalyst(
    analystId: string,
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;

    const [evaluations, total] = await Promise.all([
      prisma.evaluation.findMany({
        where: { analystId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.evaluation.count({ where: { analystId } }),
    ]);

    return {
      data: evaluations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create stress test result
   */
  static async createStressTest(
    evaluationId: string,
    scenarioData: Record<string, unknown>,
    _createdBy: string
  ) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    const stressTest = await prisma.stressTestScenarioResult.create({
      data: {
        evaluationId,
        scenarioId: scenarioData.scenarioId,
        scenarioName: scenarioData.scenarioName,
        dscrBase: scenarioData.dscrBase,
        dscrStress: scenarioData.dscrStress,
        llcrStress: scenarioData.llcrStress,
        status: scenarioData.status,
        margin: scenarioData.margin,
        notes: scenarioData.notes,
      },
    });

    return stressTest;
  }

  /**
   * Get stress test results
   */
  static async getStressTests(evaluationId: string) {
    return prisma.stressTestScenarioResult.findMany({
      where: { evaluationId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Update evaluation
   */
  static async updateEvaluation(
    id: string,
    data: any,
    updatedBy: string
  ) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    // Only draft evaluations can be fully edited
    if (evaluation.status !== "brouillon") {
      throw new Error("Can only edit draft evaluations");
    }

    const updatedEvaluation = await prisma.evaluation.update({
      where: { id },
      data: {
        finalScore: data.finalScore ?? evaluation.finalScore,
        rating: data.rating ?? evaluation.rating,
        recommendation: data.recommendation ?? evaluation.recommendation,
        probabilityOfDefault: data.probabilityOfDefault ?? evaluation.probabilityOfDefault,
        scoreFinancier: data.scoreFinancier ?? evaluation.scoreFinancier,
        scoreTechnique: data.scoreTechnique ?? evaluation.scoreTechnique,
        scoreMarche: data.scoreMarche ?? evaluation.scoreMarche,
        scoreEnvironnemental: data.scoreEnvironnemental ?? evaluation.scoreEnvironnemental,
        scoreSocial: data.scoreSocial ?? evaluation.scoreSocial,
        scoreGouvenance: data.scoreGouvenance ?? evaluation.scoreGouvenance,
        scoreJuridique: data.scoreJuridique ?? evaluation.scoreJuridique,
        scorePays: data.scorePays ?? evaluation.scorePays,
        malusTotal: data.malusTotal ?? evaluation.malusTotal,
        notes: data.notes ?? evaluation.notes,
        status: data.status ?? evaluation.status,
        triggeredNOGOs: data.triggeredNOGOs ?? evaluation.triggeredNOGOs,
        appliedMALUS: data.appliedMALUS ?? evaluation.appliedMALUS,
        updatedAt: new Date(),
      },
      include: {
        project: {
          select: { id: true, nom: true, status: true },
        },
        analyst: {
          select: { id: true, email: true, nom: true, prenom: true },
        },
      },
    });

    return updatedEvaluation;
  }

  /**
   * Delete evaluation
   */
  static async deleteEvaluation(id: string) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    await prisma.evaluation.delete({
      where: { id },
    });

    return { success: true, id };
  }

  /**
   * Archive evaluation
   */
  static async archiveEvaluation(id: string, archivedBy: string) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    const archivedEvaluation = await prisma.evaluation.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        archivedBy,
      },
      include: {
        project: {
          select: { id: true, nom: true, status: true },
        },
        analyst: {
          select: { id: true, email: true, nom: true, prenom: true },
        },
      },
    });

    return archivedEvaluation;
  }

  /**
   * Restore archived evaluation
   */
  static async restoreEvaluation(id: string) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    const restoredEvaluation = await prisma.evaluation.update({
      where: { id },
      data: {
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
      },
      include: {
        project: {
          select: { id: true, nom: true, status: true },
        },
        analyst: {
          select: { id: true, email: true, nom: true, prenom: true },
        },
      },
    });

    return restoredEvaluation;
  }
}
