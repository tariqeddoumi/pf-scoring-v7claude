import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const scorings = await prisma.scoring.findMany({
      where: { projectId: id },
      orderBy: { dateCalcul: "desc" },
    });

    return NextResponse.json(scorings);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des scores" },
      { status: 500 }
    );
  }
}
