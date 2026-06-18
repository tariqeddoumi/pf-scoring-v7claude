import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/reference/sectors
 *
 * Lightweight sector reference list for populating form value-lists
 * (e.g. the project "Secteur" field). Returns active V9 sectors as
 * { code, label }. Storing the sector CODE on the project enables the
 * sectorial calibration to match reliably (see scoring/sectorial.ts).
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const sectors = await prisma.v9Sector.findMany({
        where: { isActive: true },
        orderBy: { orderIndex: "asc" },
        select: { code: true, label: true },
      });

      return NextResponse.json({ success: true, data: sectors });
    } catch (error) {
      console.error("[REFERENCE SECTORS GET]", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch sectors" },
        { status: 500 }
      );
    }
  });
}
