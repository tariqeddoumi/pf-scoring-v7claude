import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isActive, weight } = await request.json();

    const domain = await prisma.scoreDomain.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(weight !== undefined && { weight }),
      },
    });

    return NextResponse.json(domain);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
