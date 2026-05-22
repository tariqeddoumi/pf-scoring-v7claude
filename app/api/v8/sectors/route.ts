import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const sectors = await prisma.v8Sector.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
      include: {
        domainWeights: { orderBy: { domainCode: "asc" } },
        stressTests: { orderBy: { orderIndex: "asc" } },
        redFlags: { orderBy: { orderIndex: "asc" } },
        domainImpacts: { orderBy: { domainCode: "asc" } },
      },
    });

    return NextResponse.json({ sectors });
  } catch (error) {
    console.error("[GET /api/v8/sectors]", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des secteurs" },
      { status: 500 }
    );
  }
}
