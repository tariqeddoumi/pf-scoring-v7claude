import prisma from "@/lib/prisma-client";
import {
  createEvaluationSchema,
  submitEvaluationSchema,
  validateEvaluationSchema,
  rejectEvaluationSchema,
  updateEvaluationSchema,
} from "@/lib/validation-schemas";
import type { z } from "zod";
import { ScoringEngineV8 } from "@/lib/services/scoring/scoring-engine-v8";
import { motifsRefusDecisionFavorable, motifsRefusSoumission } from "@/lib/services/scoring/decision-guard";
import { ouvrirCircuit } from "@/lib/services/scoring/circuit";

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

/**
 * Champs joints à la liste des évaluations.
 *
 * Elle ne portait que le nom du projet et celui de l'analyste : la liste ne pouvait
 * donc afficher ni le client, ni le montant, ni l'avancement d'un brouillon —
 * autant de repères pour décider par quel dossier commencer. Le décompte des réponses
 * renseignées vient du même appel, sans requête supplémentaire par ligne.
 */
const LIST_INCLUDE = {
  project: {
    select: { id: true, nom: true, montant: true, secteur: true, client: { select: { id: true, nom: true } } },
  },
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
        // le score vient du moteur, jamais de la requête de création
        finalScore: null,
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

    // Avancement de la saisie : nombre de réponses portant une valeur, rapporté au
    // nombre de critères notés du modèle. Les réponses sont créées vides à l'ouverture
    // de l'évaluation — les compter toutes donnerait 84 dès le premier instant.
    // Une seule requête groupée pour toute la page, jamais une par ligne.
    const ids = evaluations.map((e) => e.id);
    const renseignees = ids.length
      ? await prisma.scoringEvaluationAnswer.groupBy({
          by: ["evaluationId"],
          where: {
            evaluationId: { in: ids },
            OR: [
              { valueString: { not: null } },
              { valueNumber: { not: null } },
              { valueBoolean: { not: null } },
              { valueDate: { not: null } },
            ],
          },
          _count: { _all: true },
        })
      : [];
    const parEvaluation = new Map(
      renseignees.map((r) => [r.evaluationId, r._count._all])
    );

    const totauxParVersion = new Map<string, number>();
    for (const versionId of new Set(evaluations.map((e) => e.modelVersionId))) {
      totauxParVersion.set(
        versionId,
        await prisma.scoringNode.count({
          where: { versionId, isActive: true, isScored: true },
        })
      );
    }

    return {
      data: evaluations.map((e) => ({
        ...e,
        avancement: {
          repondues: parEvaluation.get(e.id) ?? 0,
          total: totauxParVersion.get(e.modelVersionId) ?? 0,
        },
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Soumission (route historique /api/evaluations/submit).
   *
   * Elle reprenait score, note, PD et malus fournis par le navigateur (9,9 et AAA
   * acceptés sans aucun calcul). Le schéma est désormais strict — seules des notes
   * sont admises — et la note est recalculée par le moteur avant la soumission.
   */
  static async submitEvaluation(
    id: string,
    data: z.infer<typeof submitEvaluationSchema>,
    submittedBy: string
  ) {
    const validated = submitEvaluationSchema.parse(data);

    const current = await prisma.scoringEvaluation.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) throw new Error("Evaluation not found");
    if (current.status !== "brouillon") {
      throw new Error("Can only submit draft evaluations");
    }

    // Calcul serveur exclusivement : score, note, malus et trace viennent du moteur.
    const trace = await ScoringEngineV8.scoreEvaluation(id);
    await ScoringEngineV8.persistTrace(trace, submittedBy);
    const motifs = motifsRefusSoumission(trace.traceJson);
    if (motifs.length > 0) throw new Error(`Soumission refusée : ${motifs.join(" ")}`);

    const [evaluation] = await prisma.$transaction([
      prisma.scoringEvaluation.update({
        where: { id },
        data: {
          status: "soumis",
          submittedAt: new Date(),
          ...(validated.notes !== undefined ? { notes: validated.notes } : {}),
        },
        include: EVALUATION_INCLUDE,
      }),
      ouvrirCircuit(id, submittedBy),
    ]);
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringEvaluation",
        entityId: id,
        evaluationId: id,
        action: "SUBMIT",
        newValueJson: JSON.stringify({ status: "soumis", finalScore: trace.finalScore, rating: trace.rating }),
        changedBy: submittedBy,
        comment: "Évaluation soumise (note recalculée par le moteur)",
      },
    });
    return evaluation;
  }

  /**
   * Validation (route historique /api/evaluations/validate).
   *
   * Une recommandation REJECT mettait le projet « approuvé », et rien n'empêchait de
   * valider un dossier frappé d'une règle rédhibitoire ou sa propre analyse. Un REJECT
   * rejette désormais le dossier ; une validation favorable passe par decision-guard.
   */
  static async validateEvaluation(
    id: string,
    data: z.infer<typeof validateEvaluationSchema>,
    validatedBy: string
  ) {
    const validated = validateEvaluationSchema.parse(data);

    if (validated.recommendation === "REJECT") {
      return this.rejectEvaluation(
        id,
        { reason: "Recommandation de rejet lors de la validation", notes: validated.notes },
        validatedBy
      );
    }

    const current = await prisma.scoringEvaluation.findUnique({
      where: { id },
      select: { status: true, finalScore: true, summaryJson: true, analystId: true },
    });
    if (!current) throw new Error("Evaluation not found");
    if (current.status !== "soumis") {
      throw new Error("Can only validate submitted evaluations");
    }
    const circuit = await prisma.scoringWorkflow.findUnique({
      where: { evaluationId: id },
      select: { submittedBy: true },
    });
    const motifs = motifsRefusDecisionFavorable({
      evaluation: { ...current, status: String(current.status) },
      decideurId: validatedBy,
      soumisPar: circuit?.submittedBy,
    });
    if (motifs.length > 0) {
      throw new Error(`Validation refusée : ${motifs.join(" ")}`);
    }

    const recommendation = validated.recommendation ?? "APPROVE";
    const evaluation = await prisma.scoringEvaluation.update({
      where: { id },
      data: {
        status: "valide",
        validatedAt: new Date(),
        recommendation,
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
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringEvaluation",
        entityId: id,
        evaluationId: id,
        action: "VALIDATE",
        newValueJson: JSON.stringify({ status: "valide", recommendation }),
        changedBy: validatedBy,
        comment: "Évaluation validée",
      },
    });
    // le circuit de validation suit la décision (même état partout)
    await prisma.scoringWorkflow.updateMany({
      where: { evaluationId: id, status: { notIn: ["APPROVED", "REJECTED"] } },
      data: { status: "APPROVED", approvedAt: new Date(), approvedBy: validatedBy },
    });

    return evaluation;
  }

  static async rejectEvaluation(
    id: string,
    data: z.infer<typeof rejectEvaluationSchema>,
    rejectedBy: string
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
    await prisma.scoringChangeLog.create({
      data: {
        entityType: "ScoringEvaluation",
        entityId: id,
        evaluationId: id,
        action: "REJECT",
        newValueJson: JSON.stringify({ status: "rejete", reason: validated.reason ?? null }),
        changedBy: rejectedBy,
        comment: "Évaluation rejetée",
      },
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

  /**
   * Mise à jour libre (PUT /api/evaluations/[id]) : notes uniquement.
   *
   * La route reprenait finalScore, rating et status d'un corps quelconque, ce qui
   * permettait d'écrire une note ou un statut final sans moteur ni transition. Toute
   * propriété de résultat ou de statut est rejetée explicitement.
   */
  static async updateEvaluation(id: string, data: unknown, _updatedBy: string) {
    const validated = updateEvaluationSchema.parse(data);

    const current = await prisma.scoringEvaluation.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) throw new Error("Evaluation not found");
    if (current.status !== "brouillon") {
      throw new Error("Can only edit draft evaluations");
    }

    return prisma.scoringEvaluation.update({
      where: { id },
      data: { ...(validated.notes !== undefined ? { notes: validated.notes } : {}) },
      include: EVALUATION_INCLUDE,
    });
  }

  /**
   * Suppression physique réservée aux brouillons. Une évaluation soumise, validée ou
   * rejetée est une pièce du dossier de crédit : elle s'archive, elle ne s'efface pas.
   */
  static async deleteEvaluation(id: string) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!evaluation) throw new Error("Evaluation not found");
    if (String(evaluation.status) !== "brouillon") {
      throw new Error("Seule une évaluation en brouillon peut être supprimée ; archivez les autres.");
    }

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
