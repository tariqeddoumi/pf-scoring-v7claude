import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromCookie } from "@/lib/auth";
import prisma from "@/lib/prisma-client";
import { isSectorialEnabled } from "@/lib/services/scoring-config-service";

/**
 * État réel du calibrage sectoriel : interrupteur applicatif, référentiel lu par le
 * moteur (V9), et rappel du référentiel hérité (V8) que plus aucun calcul n'utilise.
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

    // Le calibrage sectoriel est gouverné par SCORING_SECTORIAL_ENABLED, et le moteur
    // lit les tables V9. Ce diagnostic déduisait l'activation du seul fait que la table
    // V8 contenait des lignes : il annonçait « actif » alors que l'interrupteur était
    // fermé et que la table observée n'entrait dans aucun calcul.
    const actif = await isSectorialEnabled();

    const [v9SectorCount, v9WeightCount, v8SectorCount, v8RuleCount] =
      await Promise.all([
        prisma.v9Sector.count({ where: { isActive: true } }),
        prisma.v9SectorDomainWeight.count(),
        prisma.v8Sector.count(),
        prisma.v8IntegrationRule.count(),
      ]);

    const sectors = await prisma.v9Sector.findMany({
      select: { code: true, label: true, isActive: true },
      orderBy: [{ orderIndex: "asc" }, { code: "asc" }],
      take: 5,
    });

    return NextResponse.json({
      enabled: actif,
      appliedByEngine: actif && v9SectorCount > 0,
      explanation: actif
        ? v9SectorCount > 0
          ? "Le calibrage sectoriel est actif et appliqué au calcul."
          : "Le calibrage est activé mais aucun secteur actif n'est configuré : aucun ajustement n'est appliqué."
        : "Le calibrage sectoriel est désactivé (SCORING_SECTORIAL_ENABLED). Les facteurs configurés n'entrent dans aucun calcul.",
      v9SectorCount,
      v9WeightCount,
      // Référentiel hérité, conservé pour mémoire : il porte des poids absolus là où
      // le moteur attend des facteurs, et aucun calcul ne le lit.
      legacyV8: { sectorCount: v8SectorCount, ruleCount: v8RuleCount, readByEngine: false },
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
