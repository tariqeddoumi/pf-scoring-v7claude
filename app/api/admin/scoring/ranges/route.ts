import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * POST /api/admin/scoring/ranges
 * Ajoute une plage numérique à un critère (table BP_PF_v7pp_scoring_ranges)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Accepte nodeId ou criterionId (compatibilité)
    const nodeId = body.nodeId || body.criterionId;
    const { minValue, maxValue, score, label } = body;

    if (!nodeId || minValue === undefined || maxValue === undefined || score === undefined) {
      return NextResponse.json(
        { error: "Champs requis manquants : nodeId, minValue, maxValue, score", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (minValue > maxValue) {
      return NextResponse.json(
        { error: "minValue doit être inférieur ou égal à maxValue", errorCode: "VALIDATION_ERROR" },
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
        { error: "Les plages ne peuvent être ajoutées qu'aux critères", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Calculer le prochain orderIndex
    const lastRange = await prisma.scoringNodeRange.findFirst({
      where: { nodeId },
      orderBy: { orderIndex: "desc" },
    });
    const orderIndex = (lastRange?.orderIndex ?? -1) + 1;

    const range = await prisma.scoringNodeRange.create({
      data: { nodeId, minValue, maxValue, score, label: label || null, orderIndex },
    });

    return NextResponse.json({ data: range }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/scoring/ranges:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/scoring/ranges?rangeId=xxx
 * Modifie une plage existante
 */
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rangeId = searchParams.get("rangeId");
    const body = await req.json();

    if (!rangeId) {
      return NextResponse.json(
        { error: "rangeId requis", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (body.minValue !== undefined && body.maxValue !== undefined && body.minValue > body.maxValue) {
      return NextResponse.json(
        { error: "minValue doit être inférieur ou égal à maxValue", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const range = await prisma.scoringNodeRange.update({
      where: { id: rangeId },
      data: {
        ...(body.minValue !== undefined && { minValue: body.minValue }),
        ...(body.maxValue !== undefined && { maxValue: body.maxValue }),
        ...(body.score !== undefined && { score: body.score }),
        ...(body.label !== undefined && { label: body.label }),
      },
    });

    return NextResponse.json({ data: range });
  } catch (error) {
    console.error("PUT /api/admin/scoring/ranges:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/scoring/ranges?rangeId=xxx
 * Supprime une plage
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rangeId = searchParams.get("rangeId");

    if (!rangeId) {
      return NextResponse.json(
        { error: "rangeId requis", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    await prisma.scoringNodeRange.delete({ where: { id: rangeId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/scoring/ranges:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
