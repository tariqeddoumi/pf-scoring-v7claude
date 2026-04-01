import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * Endpoint de diagnostic pour tester la connexion à la base de données
 * Montre exactement quel problème se pose
 */
export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      DATABASE_URL: process.env.DATABASE_URL ? "✅ Défini" : "❌ Manquant",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Défini" : "❌ Manquant",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Défini" : "❌ Manquant",
      SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET ? "✅ Défini" : "❌ Manquant",
      JWT_SECRET: process.env.JWT_SECRET ? "✅ Défini" : "❌ Manquant",
    },
    tests: {} as Record<string, any>,
  };

  // Test 1: Vérifier les variables d'environnement critiques
  diagnostics.tests.environment_check = {
    status: "info",
    message: "Les variables d'environnement suivantes sont définies:",
    variables: diagnostics.environment,
  };

  // Test 2: Tester la connexion Prisma
  try {
    console.log("🔍 Test de connexion Prisma...");
    await prisma.$queryRaw`SELECT 1 as test`;
    diagnostics.tests.prisma_connection = {
      status: "✅ SUCCESS",
      message: "La connexion à la base de données fonctionne!",
    };
  } catch (error: unknown) {
    const err = error as Record<string, unknown>;
    diagnostics.tests.prisma_connection = {
      status: "❌ FAILED",
      message: "Impossible de se connecter à la base de données",
      error: (err.message as string) || String(error),
      code: err.code,
      details: "Vérifie DATABASE_URL et les identifiants Supabase",
    };
  }

  // Test 3: Tester la lecture des utilisateurs
  try {
    console.log("🔍 Test lecture des utilisateurs...");
    const userCount = await prisma.user.count();
    diagnostics.tests.user_table_read = {
      status: "✅ SUCCESS",
      message: "Lecture de la table users fonctionne",
      user_count: userCount,
    };
  } catch (error: unknown) {
    const err = error as Record<string, unknown>;
    diagnostics.tests.user_table_read = {
      status: "❌ FAILED",
      message: "Impossible de lire la table users",
      error: (err.message as string) || String(error),
      details: "Peut être une permission ou un schéma invalide",
    };
  }

  // Test 4: Tester la création d'un utilisateur
  try {
    console.log("🔍 Test création d'utilisateur...");
    const testUser = await prisma.user.upsert({
      where: { email: "test-diagnostic@pf-scoring.ma" },
      update: {},
      create: {
        email: "test-diagnostic@pf-scoring.ma",
        nom: "Test",
        prenom: "Diagnostic",
        role: "analyste",
      },
    });
    diagnostics.tests.user_creation = {
      status: "✅ SUCCESS",
      message: "Création/mise à jour d'utilisateur fonctionne",
      user_id: testUser.id,
    };
  } catch (error: unknown) {
    const err = error as Record<string, unknown>;
    diagnostics.tests.user_creation = {
      status: "❌ FAILED",
      message: "Impossible de créer/mettre à jour un utilisateur",
      error: (err.message as string) || String(error),
      details: "Peut être une permission ou un schéma invalide",
    };
  }

  // Résumé
  const failedTests = Object.entries(diagnostics.tests)
    .filter(([, test]) => typeof test === 'object' && test !== null && (test as Record<string, unknown>).status === "❌ FAILED")
    .map(([name]) => name);

  diagnostics.tests.summary = {
    total_tests: Object.keys(diagnostics.tests).length - 1,
    failed_tests: failedTests.length,
    recommendation: failedTests.length === 0
      ? "✅ Tout fonctionne! Le problème vient peut-être du Mode Test."
      : `❌ Corrige ces problèmes: ${failedTests.join(", ")}`,
  };

  return NextResponse.json(diagnostics, { status: 200 });
}
