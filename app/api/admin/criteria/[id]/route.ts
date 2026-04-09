import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma-client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, label, description, type, isActive, hardStopIfBelow, orderIndex, options, ranges } = body;

    // Update criterion fields
    const criterion = await prisma.scoreCriterion.update({
      where: { id },
      data: {
        ...(code !== undefined && { code }),
        ...(label !== undefined && { label }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive }),
        ...(hardStopIfBelow !== undefined && { hardStopIfBelow }),
        ...(orderIndex !== undefined && { orderIndex }),
      },
    });

    // Replace options if provided
    if (options !== undefined) {
      await prisma.scoreOption.deleteMany({ where: { criterionId: id } });
      if (options.length > 0) {
        await prisma.scoreOption.createMany({
          data: options.map((opt: any, idx: number) => ({
            criterionId: id,
            label: opt.label,
            score: opt.score,
            orderIndex: idx + 1,
          })),
        });
      }
    }

    // Replace ranges if provided
    if (ranges !== undefined) {
      await prisma.scoreRange.deleteMany({ where: { criterionId: id } });
      if (ranges.length > 0) {
        await prisma.scoreRange.createMany({
          data: ranges.map((r: any, idx: number) => ({
            criterionId: id,
            minValue: r.minValue,
            maxValue: r.maxValue,
            score: r.score,
            label: r.label || null,
            orderIndex: idx + 1,
          })),
        });
      }
    }

    // Return the updated criterion with options and ranges
    const updated = await prisma.scoreCriterion.findUnique({
      where: { id },
      include: {
        options: { orderBy: { orderIndex: "asc" } },
        ranges: { orderBy: { orderIndex: "asc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Erreur:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Critère non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.scoreCriterion.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Critère supprimé" });
  } catch (error: any) {
    console.error("Erreur:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Critère non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
