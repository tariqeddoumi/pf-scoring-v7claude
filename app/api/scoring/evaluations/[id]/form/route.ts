import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { ModelLoader } from "@/lib/services/scoring";

/**
 * GET /api/scoring/evaluations/[id]/form
 * Fetch the questionnaire form for an evaluation:
 * - Model structure (tree of nodes)
 * - Current answers
 * - Binding info (optional - for UI to show where value comes from)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const evaluationId = params.id;

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

    // Load all answers
    const answers = await prisma.scoringEvaluationAnswer.findMany({
      where: { evaluationId },
    });

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
      .map((node) => buildNodeForForm(node, tree, answers, bindingsByNode));

    return NextResponse.json({
      success: true,
      data: {
        evaluationId,
        projectId: evaluation.projectId,
        modelCode: tree.modelCode,
        modelLabel: tree.modelLabel,
        status: evaluation.status,
        form: formNodes,
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
  bindingsByNode: Map<string, any>
): any {
  const answer = answers.find((a) => a.nodeId === node.id);
  const binding = bindingsByNode.get(node.id);
  const children = (tree.childrenOf.get(node.id) || [])
    .map((childId: string) => {
      const child = tree.nodesById.get(childId);
      return buildNodeForForm(child, tree, answers, bindingsByNode);
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
