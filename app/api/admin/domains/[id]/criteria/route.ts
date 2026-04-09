import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma-client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const criteria = await prisma.scoreCriterion.findMany({
      where: { domainId: id },
      orderBy: { orderIndex: "asc" },
      include: {
        options: { orderBy: { orderIndex: "asc" } },
        ranges: { orderBy: { orderIndex: "asc" } },
      },
    });

    return NextResponse.json(criteria);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des critères" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: domainId } = await params;
    const body = await request.json();
    const { code, label, description, type, hardStopIfBelow, options, ranges } = body;

    if (!code || !label) {
      return NextResponse.json({ error: "Code et label requis" }, { status: 400 });
    }

    const maxOrder = await prisma.scoreCriterion.aggregate({
      where: { domainId },
      _max: { orderIndex: true },
    });

    const criterion = await prisma.scoreCriterion.create({
      data: {
        domainId,
        code,
        label,
        description: description || "",
        type: type || "OPTION",
        hardStopIfBelow: hardStopIfBelow ?? null,
        orderIndex: (maxOrder._max.orderIndex ?? 0) + 1,
        ...(options && options.length > 0 && {
          options: {
            create: options.map((opt: any, idx: number) => ({
              label: opt.label,
              score: opt.score,
              orderIndex: idx + 1,
            })),
          },
        }),
        ...(ranges && ranges.length > 0 && {
          ranges: {
            create: ranges.map((r: any, idx: number) => ({
              minValue: r.minValue,
              maxValue: r.maxValue,
              score: r.score,
              label: r.label || null,
              orderIndex: idx + 1,
            })),
          },
        }),
      },
      include: {
        options: { orderBy: { orderIndex: "asc" } },
        ranges: { orderBy: { orderIndex: "asc" } },
      },
    });

    return NextResponse.json(criterion, { status: 201 });
  } catch (error: any) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur lors de la création du critère" }, { status: 500 });
  }
}
