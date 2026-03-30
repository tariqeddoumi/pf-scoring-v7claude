import { NextResponse } from "next/server";

import prisma from "@/lib/prisma-client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { riskScore } = await request.json();

    // Validate risk score
    if (riskScore < 0 || riskScore > 100) {
      return NextResponse.json(
        { error: "Le score doit être entre 0 et 100" },
        { status: 400 }
      );
    }

    const country = await prisma.country.update({
      where: { id },
      data: { riskScore },
    });

    return NextResponse.json(country);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
