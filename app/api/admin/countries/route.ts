import { NextResponse } from "next/server";

import prisma from "@/lib/prisma-client";

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { label: "asc" },
    });

    return NextResponse.json(countries);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des pays" },
      { status: 500 }
    );
  }
}
