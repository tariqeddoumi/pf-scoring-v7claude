import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const domain = await prisma.scoreDomain.findUnique({
      where: { id },
      include: {
        criteria: {
          orderBy: { orderIndex: "asc" },
          include: {
            options: { orderBy: { orderIndex: "asc" } },
            ranges: { orderBy: { orderIndex: "asc" } },
          },
        },
      },
    });

    if (!domain) {
      return NextResponse.json({ error: "Domaine non trouvé" }, { status: 404 });
    }

    return NextResponse.json(domain);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, label, description, weight, isActive, orderIndex } = body;

    const domain = await prisma.scoreDomain.update({
      where: { id },
      data: {
        ...(code !== undefined && { code }),
        ...(label !== undefined && { label }),
        ...(description !== undefined && { description }),
        ...(weight !== undefined && { weight }),
        ...(isActive !== undefined && { isActive }),
        ...(orderIndex !== undefined && { orderIndex }),
      },
    });

    return NextResponse.json(domain);
  } catch (error: any) {
    console.error("Erreur:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Domaine non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.scoreDomain.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Domaine supprimé" });
  } catch (error: any) {
    console.error("Erreur:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Domaine non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
