import prisma from "@/lib/prisma-client";
import {
  createEvaluationSchema,
  submitEvaluationSchema,
  validateEvaluationSchema,
  rejectEvaluationSchema,
} from "@/lib/validation-schemas";
import type { z } from "zod";

/**
 * Service des évaluations — unifié sur le modèle ScoringEvaluation.
 *
 * Il existait deux tables d'évaluation : Evaluation (BP_PF_v7pp_evaluations) et
 * ScoringEvaluation (BP_PF_v7pp_scoring_evaluations). Le parcours de saisie écrivait
 * dans la seconde tandis que la liste et la fiche lisaient la première, si bien qu'une
 * évaluation terminée renvoyait « non trouvée » et n'apparaissait jamais dans la liste.
 *
 * ScoringEvaluation est retenue comme table unique : elle porte la version de modèle
 * utilisée (donc la reproductibilité de la note), les réponses, les résultats par nœud,
 * la trace de calcul et le circuit de validation. La table héritée ne portait qu'un blob
 * de résultat et huit scores de domaine figés dans le schéma.
 */

const EVALUATION_INCLUDE = {
  project: { select: { id: true, nom: true, status: true } },
  analyst: { select: { id: true, email: true, nom: true, prenom: true } },
  version: { select: { id: true, versionNumber: true, status: true } },
} as const;

const LIST_INCLUDE = {
  project: { select: { nom: true } },
  analyst: { select: { nom: true, prenom: true } },
} as const;

/**
 * Résout la version de modèle à utiliser pour une nouvelle évaluation.
 * Une évaluation sans version de modèle ne serait pas reproductible : on refuse
 * plutôt que de rattacher silencieusement à une version arbitraire.
 */
async function resolvePublishedVersion() {
  const version = await prisma.scoringModelVersion.findFirst({
    where: { isPublished: true, status: "PUBLISHED" },
    orderBy: { versionNumber: "desc" },
    select: { id: true, modelId: true },
  });

  if (!version) {
    throw new Error(
      "Aucune version de modèle publiée : impossible de créer une évaluation reproductible"
    );
  }
  return version;
}

/** Sérialise les scores de domaine et le résultat détaillé dans summaryJson. */
function buildSummaryJson(
  existing: string | null | undefined,
  patch: Record<string, unknown>
): string | undefined {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return undefined;

  let base: Record<string, unknown> = {};
  if (existing) {
    try {
      base = JSON.parse(existing) as Record<string, unknown>;
    } catch {
      base = {};
    }
  }
  return JSON.stringify({ ...base, ...Object.fromEntries(entries) });
}

export class EvaluationService {
  /** Crée une évaluation à l'état brouillon, rattachée à la version publiée. */
  static async createEvaluation(
    data: z.infer<typeof createEvaluationSchema>,
    createdBy: string
  ) {
    const validated = createEvaluationSchema.parse(data);

    const project = await prisma.project.findUnique({
      where: { id: validated.projectId },
      select: { id: true },
    });
    if (!project) {
      throw new Error("Project not found");
    }

    const version = await resolvePublishedVersion();

    return prisma.scoringEvaluation.create({
      data: {
        projectId: validated.projectId,
        modelId: version.modelId,
        modelVersionId: version.id,
        analystId: createdBy,
        status: "brouillon",
        finalScore: validated.finalScore ?? null,
        malusTotal: 0,
        notes: validated.notes ?? null,
        summaryJson: buildSummaryJson(null, {
          scoringResult: validated.scoringResult,
          stressTestResult: validated.stressTestResult,
        }),
      },
      include: EVALUATION_INCLUDE,
    });
  }

  /**
   * Fiche d'évaluation, avec les scores par domaine tels qu'ils ont été réellement
   * calculés et persistés (nœuds racine de la trace). Ils ne sont plus lus dans huit
   * colonnes figées : le nombre de domaines est une donnée du référentiel.
   */
  static async getEvaluationById(id: string, _userId?: string) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id },
      include: EVALUATION_INCLUDE,
    });
    if (!evaluation) return null;

    const nodeResults = await prisma.scoringEvaluationNodeResult.findMany({
      where: { evaluationId: id, node: { depth: 0 } },
      select: {
        rawScore: true,
        normalizedScore: true,
        node: { select: { code: true, label: true, weight: true, orderIndex: true } },
      },
    });

    const domainScores = nodeResults
      .sort((a, b) => (a.node.orderIndex ?? 0) - (b.node.orderIndex ?? 0))
      .map((r) => ({
        code: r.node.code,
        label: r.node.label,
        weight: r.node.weight,
        score: r.rawScore,
        normalizedScore: r.normalizedScore,
      }));

    return { ...evaluation, domainScores };
  }

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
      prisma.scoringEvaluation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: LIST_INCLUDE,
      }),
      prisma.scoringEvaluation.count({ where }),
    ]);

    return {
      data: evaluations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async submitEvaluation(
    id: string,
    data: z.infer<typeof submitEvaluationSchema>,
    _submittedBy: string
  ) {
    const validated = submitEvaluationSchema.parse(data);

    const current = await prisma.scoringEvaluation.findUnique({
      where: { id },
      select: { status: true, summaryJson: true },
    });
    if (!current) throw new Error("Evaluation not found");
    if (current.status !== "brouillon") {
      throw new Error("Can only submit draft evaluations");
    }

    return prisma.scoringEvaluation.update({
      where: { id },
      data: {
        status: "soumis",
        submittedAt: new Date(),
        finalScore: validated.finalScore,
        rating: validated.rating,
        probabilityOfDefault: validated.probabilityOfDefault,
        malusTotal: validated.malusTotal,
        notes: validated.notes,
        triggeredRulesJson: validated.triggeredNOGOs
          ? JSON.stringify(validated.triggeredNOGOs)
          : undefined,
        summaryJson: buildSummaryJson(current.summaryJson, {
          appliedMALUS: validated.appliedMALUS,
        }),
      },
      include: EVALUATION_INCLUDE,
    });
  }

  static async validateEvaluation(
    id: string,
    data: z.infer<typeof validateEvaluationSchema>,
    _validatedBy: string
  ) {
    const validated = validateEvaluationSchema.parse(data);

    const current = await prisma.scoringEvaluation.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) throw new Error("Evaluation not found");
    if (current.status !== "soumis") {
      throw new Error("Can only validate submitted evaluations");
    }

    const evaluation = await prisma.scoringEvaluation.update({
      where: { id },
      data: {
        status: "valide",
        validatedAt: new Date(),
        recommendation: validated.recommendation,
        notes: validated.notes,
      },
      include: EVALUATION_INCLUDE,
    });

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

  static async rejectEvaluation(
    id: string,
    data: z.infer<typeof rejectEvaluationSchema>,
    _rejectedBy: string
  ) {
    const validated = rejectEvaluationSchema.parse(data);

    const current = await prisma.scoringEvaluation.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) throw new Error("Evaluation not found");
    if (!["soumis", "valide"].includes(current.status)) {
      throw new Error("Can only reject submitted or validated evaluations");
    }

    const evaluation = await prisma.scoringEvaluation.update({
      where: { id },
      data: {
        status: "rejete",
        rejectedAt: new Date(),
        rejectionReason: validated.reason ?? null,
        notes: validated.notes,
      },
      include: EVALUATION_INCLUDE,
    });

    await prisma.project.update({
      where: { id: evaluation.projectId },
      data: { status: "rejete" },
    });

    return evaluation;
  }

  static async getEvaluationsByProject(projectId: string) {
    return prisma.scoringEvaluation.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: LIST_INCLUDE,
    });
  }

  static async getEvaluationsByAnalyst(
    analystId: string,
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;

    const [evaluations, total] = await Promise.all([
      prisma.scoringEvaluation.findMany({
        where: { analystId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: LIST_INCLUDE,
      }),
      prisma.scoringEvaluation.count({ where: { analystId } }),
    ]);

    return {
      data: evaluations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async createStressTest(
    evaluationId: string,
    scenarioData: Record<string, unknown>,
    _createdBy: string
  ) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
      select: { id: true },
    });
    if (!evaluation) throw new Error("Evaluation not found");

    return prisma.stressTestScenarioResult.create({
      data: {
        evaluationId,
        scenarioId: scenarioData.scenarioId as string,
        scenarioName: scenarioData.scenarioName as string,
        dscrBase: scenarioData.dscrBase as number,
        dscrStress: scenarioData.dscrStress as number,
        llcrStress: scenarioData.llcrStress as number,
        status: scenarioData.status as string,
        margin: (scenarioData.margin as number | null | undefined) ?? 0,
        notes: (scenarioData.notes as string | null | undefined) || null,
      },
    });
  }

  static async getStressTests(evaluationId: string) {
    return prisma.stressTestScenarioResult.findMany({
      where: { evaluationId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateEvaluation(id: string, data: any, _updatedBy: string) {
    const current = await prisma.scoringEvaluation.findUnique({
      where: { id },
      select: { status: true, summaryJson: true },
    });
    if (!current) throw new Error("Evaluation not found");
    if (current.status !== "brouillon") {
      throw new Error("Can only edit draft evaluations");
    }

    return prisma.scoringEvaluation.update({
      where: { id },
      data: {
        finalScore: data.finalScore ?? undefined,
        rating: data.rating ?? undefined,
        recommendation: data.recommendation ?? undefined,
        probabilityOfDefault: data.probabilityOfDefault ?? undefined,
        malusTotal: data.malusTotal ?? undefined,
        notes: data.notes ?? undefined,
        status: data.status ?? undefined,
        triggeredRulesJson: data.triggeredNOGOs
          ? JSON.stringify(data.triggeredNOGOs)
          : undefined,
        // Les scores par domaine ne sont plus des colonnes : le modèle a neuf domaines
        // paramétrables, pas huit champs figés. Ils sont conservés dans summaryJson.
        summaryJson: buildSummaryJson(current.summaryJson, {
          scoreFinancier: data.scoreFinancier,
          scoreTechnique: data.scoreTechnique,
          scoreMarche: data.scoreMarche,
          scoreEnvironnemental: data.scoreEnvironnemental,
          scoreSocial: data.scoreSocial,
          scoreGouvernance: data.scoreGouvenance ?? data.scoreGouvernance,
          scoreJuridique: data.scoreJuridique,
          scorePays: data.scorePays,
          appliedMALUS: data.appliedMALUS,
        }),
      },
      include: EVALUATION_INCLUDE,
    });
  }

  static async deleteEvaluation(id: string) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!evaluation) throw new Error("Evaluation not found");

    await prisma.scoringEvaluation.delete({ where: { id } });
    return { success: true, id };
  }

  static async archiveEvaluation(id: string, archivedBy: string) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!evaluation) throw new Error("Evaluation not found");

    return prisma.scoringEvaluation.update({
      where: { id },
      data: { isArchived: true, archivedAt: new Date(), archivedBy },
      include: EVALUATION_INCLUDE,
    });
  }

  static async restoreEvaluation(id: string) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!evaluation) throw new Error("Evaluation not found");

    return prisma.scoringEvaluation.update({
      where: { id },
      data: { isArchived: false, archivedAt: null, archivedBy: null },
      include: EVALUATION_INCLUDE,
    });
  }
}
