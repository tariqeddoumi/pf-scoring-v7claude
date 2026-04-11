import { NextResponse } from "next/server";

import prisma from "@/lib/prisma-client";

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "COUNTRY_RISK_MODE" },
    });

    const mode = config?.value ?? "AUTO_ASSIGN";

    return NextResponse.json({ mode });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la configuration" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { mode } = await request.json();

    if (!["AUTO_ASSIGN", "MANUAL"].includes(mode)) {
      return NextResponse.json({ error: "Mode invalide" }, { status: 400 });
    }

    await prisma.systemConfig.upsert({
      where: { key: "COUNTRY_RISK_MODE" },
      update: { value: mode },
      create: {
        key: "COUNTRY_RISK_MODE",
        value: mode,
        description: "Country risk assignment mode",
      },
    });

    return NextResponse.json({ mode });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
