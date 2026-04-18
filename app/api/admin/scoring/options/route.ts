import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * POST /api/admin/scoring/options
 * Ajoute une option à un critère (table BP_PF_v7pp_scoring_options)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Accepte nodeId ou criterionId (compatibilité)
    const nodeId = body.nodeId || body.criterionId;
    const { label, score } = body;

    if (!nodeId || !label || score === undefined) {
      return NextResponse.json(
        { error: "Champs requis manquants : nodeId, label, score", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Vérifier que le nœud existe
    const criterion = await prisma.scoringNode.findUnique({ where: { id: nodeId } });

    if (!criterion) {
      return NextResponse.json(
        { error: "Critère introuvable", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (criterion.nodeType !== "CRITERION") {
      return NextResponse.json(
        { error: "Les options ne peuvent être ajoutées qu'aux critères", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Calculer le prochain orderIndex
    const lastOption = await prisma.scoringNodeOption.findFirst({
      where: { nodeId },
      orderBy: { orderIndex: "desc" },
    });
    const orderIndex = (lastOption?.orderIndex ?? -1) + 1;

    const option = await prisma.scoringNodeOption.create({
      data: { nodeId, label, score, orderIndex },
    });

    return NextResponse.json({ data: option }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/scoring/options:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/scoring/options?optionId=xxx
 * Modifie une option existante
 */
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const optionId = searchParams.get("optionId");
    const body = await req.json();

    if (!optionId) {
      return NextResponse.json(
        { error: "optionId requis", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const option = await prisma.scoringNodeOption.update({
      where: { id: optionId },
      data: {
        ...(body.label !== undefined && { label: body.label }),
        ...(body.score !== undefined && { score: body.score }),
      },
    });

    return NextResponse.json({ data: option });
  } catch (error) {
    console.error("PUT /api/admin/scoring/options:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/scoring/options?optionId=xxx
 * Supprime une option
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const optionId = searchParams.get("optionId");

    if (!optionId) {
      return NextResponse.json(
        { error: "optionId requis", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    await prisma.scoringNodeOption.delete({ where: { id: optionId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/scoring/options:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
