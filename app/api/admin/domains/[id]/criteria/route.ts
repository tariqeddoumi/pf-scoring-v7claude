import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
