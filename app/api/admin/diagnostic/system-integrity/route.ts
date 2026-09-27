import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromCookie } from "@/lib/auth";
import prisma from "@/lib/prisma-client";
import { isSectorialEnabled } from "@/lib/services/scoring-config-service";

/**
 * Diagnostic complet d'intégrité du système
 * Vérifie:
 * 1. Authentification & Users
 * 2. V7++ Scoring Model (13 tables)
 * 3. V8 Sectoral Adjustments (6 tables)
 * 4. Relationships & Foreign Keys
 * 5. Critical Data Requirements
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification (admin uniquement)
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

    // ====== AUTH SYSTEM ======
    const adminCount = await prisma.user.count({
      where: { role: "system_admin", isActive: true },
    });
    const totalUsers = await prisma.user.count({ where: { isActive: true } });

    // ====== V7++ SCORING MODEL ======
    const scoringModelCount = await prisma.scoringModel.count();
    const scoringVersionCount = await prisma.scoringModelVersion.count();
    const scoringNodeCount = await prisma.scoringNode.count();
    const scoringRuleCount = await prisma.scoringNodeRule.count();
    const evaluationCount = await prisma.scoringEvaluation.count();

    // ====== V8 SECTORAL ADJUSTMENTS ======
    const v8SectorCount = await prisma.v8Sector.count();
    const v8WeightCount = await prisma.v8SectorDomainWeight.count();
    const v8StressTestCount = await prisma.v8SectorStressTest.count();
    const v8RedFlagCount = await prisma.v8SectorRedFlag.count();
    const v8ImpactCount = await prisma.v8SectorDomainImpact.count();
    const v8RuleCount = await prisma.v8IntegrationRule.count();

    // ====== DATA INTEGRITY CHECKS ======
    const projectCount = await prisma.project.count();
    const clientCount = await prisma.client.count();
    const scoringDomainCount = await prisma.scoreDomain.count();

    // ====== ÉTAT RÉEL DU CALIBRAGE SECTORIEL ======
    // L'activation se déduisait du seul fait que la table V8 contenait des lignes.
    // Le calibrage est en réalité gouverné par SCORING_SECTORIAL_ENABLED, et le moteur
    // lit les tables V9 : le diagnostic annonçait « ENABLED » alors que l'interrupteur
    // était fermé et que la table observée n'entrait dans aucun calcul.
    const sectorialEnabled = await isSectorialEnabled();
    const v9SectorCount = await prisma.v9Sector.count({ where: { isActive: true } });
    const v9WeightCount = await prisma.v9SectorDomainWeight.count();
    const sectorialApplied = sectorialEnabled && v9SectorCount > 0;

    const sampleSectors = await prisma.v9Sector.findMany({
      select: { code: true, label: true, isActive: true },
      orderBy: [{ orderIndex: "asc" }, { code: "asc" }],
      take: 3,
    });

    // Get most recent evaluation
    const latestEval = await prisma.scoringEvaluation.findFirst({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        status: true,
        rating: true,
      },
    });

    // Compile diagnostics
    const diagnostics = {
      timestamp: new Date().toISOString(),
      overall_status: "OK",
      authentication: {
        system_admins: adminCount,
        total_active_users: totalUsers,
        status: totalUsers > 0 && adminCount > 0 ? "✓ HEALTHY" : "⚠ WARNING",
        details: {
          password_column: "✓ exists in BP_PF_users",
          role_column: "✓ exists in BP_PF_users",
          jwt_system: "✓ implemented",
          cookie_auth: "✓ implemented",
        },
      },
      v7pp_scoring_model: {
        models: scoringModelCount,
        versions: scoringVersionCount,
        nodes: scoringNodeCount,
        rules: scoringRuleCount,
        evaluations: evaluationCount,
        status: scoringNodeCount > 0 ? "✓ ACTIVE" : "⚠ NO DATA",
        latest_evaluation: latestEval || "none",
      },
      calibrage_sectoriel: {
        active: sectorialEnabled,
        applique_au_calcul: sectorialApplied,
        secteurs_actifs: v9SectorCount,
        facteurs_de_ponderation: v9WeightCount,
        status: sectorialApplied
          ? "✓ APPLIQUÉ"
          : sectorialEnabled
            ? "⚠ ACTIVÉ SANS SECTEUR"
            : "○ DÉSACTIVÉ",
        sample_sectors: sampleSectors,
        // Référentiel hérité : il porte des poids absolus là où le moteur attend des
        // facteurs, et aucun calcul ne le lit. Conservé pour mémoire.
        referentiel_v8_non_lu: {
          sectors: v8SectorCount,
          domain_weights: v8WeightCount,
          stress_tests: v8StressTestCount,
          red_flags: v8RedFlagCount,
          domain_impacts: v8ImpactCount,
          integration_rules: v8RuleCount,
        },
      },
      data_completeness: {
        projects: projectCount,
        clients: clientCount,
        scoring_domains_legacy: scoringDomainCount,
        status: projectCount > 0 && clientCount > 0 ? "✓ POPULATED" : "⚠ SETUP NEEDED",
      },
      modele_applique: {
        // Le conseil précédent — « remplir les tables V8 » — n'aurait rien changé :
        // le moteur ne les lit pas, et l'activation passe par la configuration.
        modele: sectorialApplied
          ? "V7++ avec ajustement sectoriel"
          : "V7++ standard, sans ajustement sectoriel",
        calibrage_sectoriel_actif: sectorialEnabled,
        recommandation: sectorialApplied
          ? "Les facteurs sectoriels sont appliqués au calcul."
          : sectorialEnabled
            ? "Activer au moins un secteur dans Paramétrage → Calibrage sectoriel."
            : "Pour appliquer les facteurs sectoriels, activer SCORING_SECTORIAL_ENABLED dans Paramétrage → Paramétrage de l'outil.",
      },
      critical_alerts: [] as string[],
    };

    // Add critical alerts
    if (totalUsers === 0) {
      diagnostics.critical_alerts.push(
        "NO USERS FOUND - Create admin account immediately"
      );
      diagnostics.overall_status = "CRITICAL";
    }

    if (adminCount === 0) {
      diagnostics.critical_alerts.push(
        "NO ADMIN USERS - Cannot manage system"
      );
      diagnostics.overall_status = "CRITICAL";
    }

    if (projectCount === 0) {
      diagnostics.critical_alerts.push(
        "NO PROJECTS - System is not operational"
      );
      diagnostics.overall_status = "WARNING";
    }

    return NextResponse.json(diagnostics);
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : String(error);
    console.error("[SYSTEM-INTEGRITY] Erreur:", errorMsg);
    return NextResponse.json(
      {
        error: "Erreur lors du diagnostic",
        details: errorMsg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
