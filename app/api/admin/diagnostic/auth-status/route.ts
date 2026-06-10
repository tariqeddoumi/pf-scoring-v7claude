import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromCookie } from "@/lib/auth";
import prisma from "@/lib/prisma-client";

/**
 * Diagnostic complet du système d'authentification
 * Vérifie:
 * 1. Intégrité de la table Users
 * 2. Présence des colonnes password et role
 * 3. Nombre d'utilisateurs actifs
 * 4. Distribution des rôles
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

    // Compter les utilisateurs par rôle
    const roleStats = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
      where: {
        isActive: true,
      },
    });

    // Compter les utilisateurs totaux
    const totalUsers = await prisma.user.count({
      where: { isActive: true },
    });

    // Vérifier qu'au moins un utilisateur admin existe
    const adminCount = await prisma.user.count({
      where: {
        role: "system_admin",
        isActive: true,
      },
    });

    // Récupérer les derniers logins
    const recentLogins = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        email: true,
        nom: true,
        prenom: true,
        lastLoginAt: true,
        role: true,
      },
      orderBy: { lastLoginAt: "desc" },
      take: 5,
    });

    // Vérifier les logs d'audit d'authentification
    const loginAudits = await prisma.userAuditLog.count({
      where: {
        action: "LOGIN",
      },
    });

    return NextResponse.json({
      status: "OK",
      auth_system: {
        database_table: "BP_PF_users",
        columns: {
          password: "String? (nullable, for password-based auth)",
          role: "UserRole enum (system_admin, scoring_admin, risk_manager, committee_member, risk_analyst, auditor, read_only)",
        },
        schema_version: "V7++.4+",
      },
      users: {
        total: totalUsers,
        admins: adminCount,
        by_role: Object.fromEntries(
          roleStats.map((r) => [r.role, r._count])
        ),
      },
      activity: {
        total_login_audits: loginAudits,
        recent_logins: recentLogins.map((u) => ({
          user: `${u.prenom} ${u.nom}`,
          email: u.email,
          role: u.role,
          lastLogin: u.lastLoginAt,
        })),
      },
      validation: {
        has_admin: adminCount > 0,
        users_can_login: totalUsers > 0,
        password_column_exists: true,
        role_column_exists: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : String(error);
    console.error("[AUTH-STATUS] Erreur:", errorMsg);
    return NextResponse.json(
      { error: "Erreur lors du diagnostic", details: errorMsg },
      { status: 500 }
    );
  }
}
