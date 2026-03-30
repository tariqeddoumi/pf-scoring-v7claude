import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const domains = await prisma.scoreDomain.findMany({
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json(domains);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des domaines" },
      { status: 500 }
    );
  }
}
