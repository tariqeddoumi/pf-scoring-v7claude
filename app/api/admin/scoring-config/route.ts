import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma-client";

/**
 * GET /api/admin/scoring-config
 * Returns all domain weights + system config thresholds
 */
export async function GET() {
  try {
    const [domains, configs] = await Promise.all([
      prisma.scoreDomain.findMany({
        orderBy: { orderIndex: "asc" },
        select: { id: true, code: true, label: true, description: true, weight: true, isActive: true, orderIndex: true },
      }),
      prisma.systemConfig.findMany({
        where: { key: { in: ["NOGO_DSCR", "NOGO_EQUITY", "NOGO_LEVERAGE"] } },
      }),
    ]);

    const thresholds: Record<string, number> = {};
    for (const c of configs) {
      thresholds[c.key] = parseFloat(c.value);
    }

    return NextResponse.json({
      domains,
      noGoThresholds: {
        dscr: thresholds.NOGO_DSCR ?? 1.1,
        equity: thresholds.NOGO_EQUITY ?? 20,
        leverage: thresholds.NOGO_LEVERAGE ?? 95,
      },
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/scoring-config
 * Bulk update domain weights and thresholds
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { domains, noGoThresholds } = body;

    // Update domain weights in a transaction
    if (domains && Array.isArray(domains)) {
      await prisma.$transaction(
        domains.map((d: { id: string; weight: number }) =>
          prisma.scoreDomain.update({
            where: { id: d.id },
            data: { weight: d.weight },
          })
        )
      );
    }

    // Update NO-GO thresholds via SystemConfig
    if (noGoThresholds) {
      const upserts = [
        { key: "NOGO_DSCR", value: String(noGoThresholds.dscr), description: "DSCR minimum threshold" },
        { key: "NOGO_EQUITY", value: String(noGoThresholds.equity), description: "Minimum equity percentage" },
        { key: "NOGO_LEVERAGE", value: String(noGoThresholds.leverage), description: "Maximum leverage percentage" },
      ];

      for (const { key, value, description } of upserts) {
        await prisma.systemConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value, description },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Configuration sauvegardée" });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 });
  }
}
