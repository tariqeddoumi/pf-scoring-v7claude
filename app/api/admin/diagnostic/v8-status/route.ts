import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromCookie } from "@/lib/auth";
import prisma from "@/lib/prisma-client";

/**
 * Vérifie si V8 est activé (tables V8 existent et contiennent des données)
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const token = getTokenFromCookie(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json(
        { error: "Non authentifié", errorCode: "AUTH_003" },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user || user.role !== "system_admin") {
      return NextResponse.json(
        { error: "Accès refusé", errorCode: "AUTH_004" },
        { status: 403 }
      );
    }

    // Compter les secteurs V8
    const v8SectorCount = await prisma.v8Sector.count();

    // Compter les règles V8
    const v8RuleCount = await prisma.v8IntegrationRule.count();

    // V8 est considéré comme activé s'il y a au moins 1 secteur configuré
    const enabled = v8SectorCount > 0;

    // Récupérer les détails
    const sectors = enabled
      ? await prisma.v8Sector.findMany({
          select: {
            code: true,
            label: true,
            isActive: true,
          },
          take: 5,
        })
      : [];

    return NextResponse.json({
      enabled,
      v8SectorCount,
      v8RuleCount,
      sectors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[V8-STATUS] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification", errorCode: "SRV_001" },
      { status: 500 }
    );
  }
}
