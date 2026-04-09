import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma-client";

export async function GET(request: NextRequest) {
  try {
    const includeDetails = request.nextUrl.searchParams.get("include") === "full";

    const domains = await prisma.scoreDomain.findMany({
      orderBy: { orderIndex: "asc" },
      ...(includeDetails && {
        include: {
          criteria: {
            orderBy: { orderIndex: "asc" },
            include: {
              options: { orderBy: { orderIndex: "asc" } },
              ranges: { orderBy: { orderIndex: "asc" } },
            },
          },
        },
      }),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, label, description, weight, orderIndex } = body;

    if (!code || !label) {
      return NextResponse.json({ error: "Code et label requis" }, { status: 400 });
    }

    const maxOrder = await prisma.scoreDomain.aggregate({ _max: { orderIndex: true } });
    const domain = await prisma.scoreDomain.create({
      data: {
        code,
        label,
        description: description || "",
        weight: weight ?? 10,
        orderIndex: orderIndex ?? (maxOrder._max.orderIndex ?? 0) + 1,
      },
    });

    return NextResponse.json(domain, { status: 201 });
  } catch (error: any) {
    console.error("Erreur:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Un domaine avec ce code existe déjà" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur lors de la création du domaine" }, { status: 500 });
  }
}
