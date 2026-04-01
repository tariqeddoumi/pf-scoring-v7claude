import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/error-handler";
import prisma from "@/lib/prisma-client";

interface DiagnosticTest {
  name: string;
  status: "success" | "warning" | "error" | "pending";
  message: string;
  details?: Record<string, unknown>;
}

interface EnvironmentVar {
  name: string;
  defined: boolean;
  value?: string;
}

// List of environment variables to check
const ENV_VARS_TO_CHECK = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_JWT_SECRET",
  "JWT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "MICROSOFT_CLIENT_ID",
  "MICROSOFT_CLIENT_SECRET",
  "NEXT_PUBLIC_BASE_URL",
  "NODE_ENV",
];

async function testDatabaseConnection(): Promise<DiagnosticTest> {
  try {
    // Test Prisma connection with a simple query
    await prisma.user.count();
    return {
      name: "Connexion à la Base de Données",
      status: "success",
      message: "Connexion à la base de données établie avec succès",
    };
  } catch (error: unknown) {
    return {
      name: "Connexion à la Base de Données",
      status: "error",
      message: "Impossible de se connecter à la base de données",
      details: {
        error: getErrorMessage(error),
      },
    };
  }
}

async function testUserCount(): Promise<DiagnosticTest> {
  try {
    const count = await prisma.user.count();
    const admins = await prisma.user.count({ where: { role: "admin" } });
    const analysts = await prisma.user.count({ where: { role: "analyste" } });

    return {
      name: "Statistiques Utilisateurs",
      status: "success",
      message: `${count} utilisateur(s) trouvé(s) dans la base de données`,
      details: {
        total: count,
        admins,
        analysts,
      },
    };
  } catch (error: unknown) {
    return {
      name: "Statistiques Utilisateurs",
      status: "error",
      message: "Impossible de récupérer les statistiques des utilisateurs",
      details: {
        error: getErrorMessage(error),
      },
    };
  }
}

async function testProjectCount(): Promise<DiagnosticTest> {
  try {
    const count = await prisma.project.count();
    const byStatus = await prisma.project.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    return {
      name: "Statistiques Projets",
      status: "success",
      message: `${count} projet(s) trouvé(s) dans la base de données`,
      details: {
        total: count,
        byStatus: Object.fromEntries(
          byStatus.map((item) => [item.status, item._count.id])
        ),
      },
    };
  } catch (error: unknown) {
    return {
      name: "Statistiques Projets",
      status: "error",
      message: "Impossible de récupérer les statistiques des projets",
      details: {
        error: getErrorMessage(error),
      },
    };
  }
}

function testJWTSecret(): DiagnosticTest {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return {
      name: "JWT Secret",
      status: "error",
      message: "JWT_SECRET non défini",
    };
  }

  if (jwtSecret.length < 32) {
    return {
      name: "JWT Secret",
      status: "warning",
      message: `JWT_SECRET est défini mais court (${jwtSecret.length} caractères, recommandé: 32+)`,
    };
  }

  return {
    name: "JWT Secret",
    status: "success",
    message: `JWT_SECRET défini (${jwtSecret.length} caractères)`,
  };
}

function testOAuthConfiguration(): DiagnosticTest {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const microsoftClientId = process.env.MICROSOFT_CLIENT_ID;
  const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  const details: Record<string, unknown> = {
    googleConfigured: !!(googleClientId && googleClientSecret),
    microsoftConfigured: !!(microsoftClientId && microsoftClientSecret),
  };

  if (!googleClientId || !googleClientSecret) {
    details.googleWarning = "Configuration Google OAuth incomplète";
  }

  if (!microsoftClientId || !microsoftClientSecret) {
    details.microsoftWarning = "Configuration Microsoft OAuth incomplète";
  }

  const allConfigured =
    googleClientId &&
    googleClientSecret &&
    microsoftClientId &&
    microsoftClientSecret;

  return {
    name: "Configuration OAuth",
    status: allConfigured ? "success" : "warning",
    message: allConfigured
      ? "Configuration OAuth complète (Google et Microsoft)"
      : "Configuration OAuth partiellement complète",
    details,
  };
}

function testApplicationURL(): DiagnosticTest {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    return {
      name: "URL de l'Application",
      status: "warning",
      message: "NEXT_PUBLIC_BASE_URL non défini",
    };
  }

  try {
    new URL(baseUrl);
    return {
      name: "URL de l'Application",
      status: "success",
      message: `URL de l'application définie: ${baseUrl}`,
    };
  } catch {
    return {
      name: "URL de l'Application",
      status: "error",
      message: `URL de l'application invalide: ${baseUrl}`,
    };
  }
}

function testNodeEnvironment(): DiagnosticTest {
  const nodeEnv = process.env.NODE_ENV || "not set";

  const status =
    nodeEnv === "production" || nodeEnv === "development"
      ? "success"
      : "warning";

  return {
    name: "Environment Node",
    status: status as "success" | "warning",
    message: `NODE_ENV: ${nodeEnv}`,
  };
}

function getEnvironmentVariables(): EnvironmentVar[] {
  return ENV_VARS_TO_CHECK.map((varName) => {
    const value = process.env[varName];
    const defined = !!value;

    if (!defined) {
      return {
        name: varName,
        defined: false,
      };
    }

    // Hide sensitive values
    const sensitiveVars = [
      "DATABASE_URL",
      "SUPABASE_JWT_SECRET",
      "JWT_SECRET",
      "GOOGLE_CLIENT_SECRET",
      "MICROSOFT_CLIENT_SECRET",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ];

    if (sensitiveVars.includes(varName)) {
      return {
        name: varName,
        defined: true,
        value: `[REDACTED] (${value.length} caractères)`,
      };
    }

    // For non-sensitive vars, truncate if too long
    const displayValue =
      value.length > 50 ? `${value.substring(0, 50)}...` : value;

    return {
      name: varName,
      defined: true,
      value: displayValue,
    };
  });
}

export async function GET() {
  try {
    // Run all diagnostic tests in parallel
    const tests = await Promise.all([
      testDatabaseConnection(),
      testUserCount(),
      testProjectCount(),
      Promise.resolve(testJWTSecret()),
      Promise.resolve(testOAuthConfiguration()),
      Promise.resolve(testApplicationURL()),
      Promise.resolve(testNodeEnvironment()),
    ]);

    const environment = getEnvironmentVariables();

    return NextResponse.json({
      success: true,
      tests,
      environment,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Erreur diagnostique:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'exécution des diagnostiques",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
