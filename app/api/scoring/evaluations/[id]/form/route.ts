import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { ModelLoader } from "@/lib/services/scoring";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";

/**
 * GET /api/scoring/evaluations/[id]/form
 * Fetch the questionnaire form for an evaluation:
 * - Model structure (tree of nodes)
 * - Current answers
 * - Binding info (optional - for UI to show where value comes from)
 */
async function handleGET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  user: AuthPayload
) {
  try {
    const { id } = await params;
    const evaluationId = id;

    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
      include: { project: true, version: true, model: true },
    });

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: "Evaluation not found", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Load model tree
    const tree = await ModelLoader.loadVersion(evaluation.modelVersionId);
    const nodeIds = Array.from(tree.nodesById.keys());

    // Load all answers
    const answers = await prisma.scoringEvaluationAnswer.findMany({
      where: { evaluationId },
    });

    // Options et plages : sans elles, l'atelier de saisie ne peut afficher ni les
    // listes de choix ni les bornes. Elles sont chargées ici pour qu'un seul appel
    // suffise à rouvrir une saisie en cours.
    const [allOptions, allRanges] = await Promise.all([
      prisma.scoringNodeOption.findMany({
        where: { nodeId: { in: nodeIds }, isActive: true },
        orderBy: { orderIndex: "asc" },
        select: { nodeId: true, value: true, code: true, label: true, score: true },
      }),
      prisma.scoringNodeRange.findMany({
        where: { nodeId: { in: nodeIds }, isActive: true },
        orderBy: { minValue: "asc" },
        select: { nodeId: true, minValue: true, maxValue: true, score: true, label: true },
      }),
    ]);

    const optionsByNode = new Map<string, Array<{ value: string; label: string; score: number }>>();
    for (const o of allOptions) {
      const list = optionsByNode.get(o.nodeId) ?? [];
      list.push({
        value: o.value ?? o.code ?? o.label,
        label: o.label,
        score: o.score ?? 0,
      });
      optionsByNode.set(o.nodeId, list);
    }

    const rangesByNode = new Map<
      string,
      Array<{ minValue: number; maxValue: number; score: number; label?: string }>
    >();
    for (const r of allRanges) {
      const list = rangesByNode.get(r.nodeId) ?? [];
      list.push({
        minValue: r.minValue,
        maxValue: r.maxValue,
        score: r.score ?? 0,
        label: r.label ?? undefined,
      });
      rangesByNode.set(r.nodeId, list);
    }

    // Load bindings (optional - for enriching UI)
    const bindingsByNode = new Map<
      string,
      {
        id: string;
        sourceEntity: string;
        sourcePath: string | null;
        bindingMode: string;
      }
    >();

    const bindings = await prisma.scoringNodeDataBinding.findMany({
      where: {
        nodeId: { in: Array.from(tree.nodesById.keys()) },
        isActive: true,
      },
    });

    for (const b of bindings) {
      bindingsByNode.set(b.nodeId, {
        id: b.id,
        sourceEntity: b.sourceEntity,
        sourcePath: b.sourcePath,
        bindingMode: b.bindingMode,
      });
    }

    // Build form structure
    const formNodes = Array.from(tree.nodesById.values())
      .filter((n) => n.depth === 0) // Start with roots
      .map((node) =>
        buildNodeForForm(node, tree, answers, bindingsByNode, optionsByNode, rangesByNode)
      );

    // Réponses à plat : l'atelier les consomme telles quelles pour reprendre
    // une saisie là où elle s'était arrêtée.
    const answersByNode: Record<
      string,
      {
        valueString?: string;
        valueNumber?: number;
        valueBoolean?: boolean;
        comment?: string;
      }
    > = {};
    for (const a of answers) {
      answersByNode[a.nodeId] = {
        valueString: a.valueString ?? undefined,
        valueNumber: a.valueNumber ?? undefined,
        valueBoolean: a.valueBoolean ?? undefined,
        comment: a.comment ?? undefined,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        evaluationId,
        projectId: evaluation.projectId,
        projectName: evaluation.project?.nom ?? "Projet",
        modelVersionId: evaluation.modelVersionId,
        modelCode: tree.modelCode,
        modelLabel: tree.modelLabel,
        status: evaluation.status,
        form: formNodes,
        answers: answersByNode,
      },
    });
  } catch (error) {
    console.error("GET /api/scoring/evaluations/[id]/form error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

function buildNodeForForm(
  node: any,
  tree: any,
  answers: any[],
  bindingsByNode: Map<string, any>,
  optionsByNode: Map<string, any[]>,
  rangesByNode: Map<string, any[]>
): any {
  const answer = answers.find((a) => a.nodeId === node.id);
  const binding = bindingsByNode.get(node.id);
  const children = (tree.childrenOf.get(node.id) || [])
    .map((childId: string) => {
      const child = tree.nodesById.get(childId);
      return buildNodeForForm(child, tree, answers, bindingsByNode, optionsByNode, rangesByNode);
    });

  return {
    id: node.id,
    code: node.code,
    label: node.label,
    description: node.description,
    depth: node.depth,
    nodeType: node.nodeType,
    isScored: node.isScored,
    isMandatory: node.isMandatory,
    answerType: node.answerType,
    weight: node.weight,
    options: optionsByNode.get(node.id),
    ranges: rangesByNode.get(node.id),
    answer: answer
      ? {
          id: answer.id,
          valueString: answer.valueString,
          valueNumber: answer.valueNumber,
          valueBoolean: answer.valueBoolean,
          valueDate: answer.valueDate,
          comment: answer.comment,
          isAutoFilled: answer.isAutoFilled,
          isOverridden: answer.isOverridden,
        }
      : null,
    binding: binding
      ? {
          id: binding.id,
          sourceEntity: binding.sourceEntity,
          sourcePath: binding.sourcePath,
          bindingMode: binding.bindingMode,
        }
      : null,
    children: children.filter((c: any) => c != null),
  };
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return withAuth(req, (r, user) => handleGET(r, ctx, user));
}
