import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * Endpoint pour appliquer les migrations de schéma à la base de données
 * Crée les colonnes manquantes dans les tables
 */

export async function POST(request: Request) {
  try {
    // Vérifier le token de sécurité
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.INIT_TOKEN || "init-secret-token";

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const results: { [key: string]: string } = {};

    // Ajouter les colonnes manquantes à la table pf_scoring_users
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE pf_scoring_users
        ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
      `);
      results.users_columns = "Colonnes createdAt et updatedAt ajoutées/vérifiées";
    } catch (error) {
      results.users_columns_error = (error as Error).message;
    }

    // Ajouter les colonnes manquantes à la table pf_scoring_projects
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE pf_scoring_projects
        ADD COLUMN IF NOT EXISTS "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
      `);
      results.projects_columns = "Colonne dateMiseAJour ajoutée/vérifiée";
    } catch (error) {
      results.projects_columns_error = (error as Error).message;
    }

    // Ajouter les colonnes manquantes à d'autres tables si nécessaire
    const tables = [
      { name: "pf_scoring_domains", columns: ["createdAt", "updatedAt"] },
      { name: "pf_scoring_criteria", columns: ["createdAt", "updatedAt"] },
      { name: "pf_scoring_options", columns: ["createdAt", "updatedAt"] },
      { name: "pf_scoring_ranges", columns: ["createdAt", "updatedAt"] },
      { name: "pf_scoring_countries", columns: ["createdAt", "updatedAt"] },
      { name: "pf_scoring_evaluation_domain_scores", columns: ["createdAt"] },
      { name: "pf_scoring_evaluation_answers", columns: ["createdAt"] },
      { name: "pf_scoring_scorings", columns: ["dateCalcul"] },
    ];

    for (const table of tables) {
      try {
        const columnDefs = table.columns
          .map((col) => `ADD COLUMN IF NOT EXISTS "${col}" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`)
          .join(",");

        await prisma.$executeRawUnsafe(
          `ALTER TABLE ${table.name} ${columnDefs};`
        );
        results[`${table.name}_columns`] = `Colonnes ajoutées/vérifiées`;
      } catch (error) {
        results[`${table.name}_error`] = (error as Error).message;
      }
    }

    // Tester la connexion et vérifier les tables
    try {
      const userCount = await prisma.user.count();
      results.database_connection = `✓ Connexion OK - ${userCount} utilisateur(s) trouvé(s)`;
    } catch (error) {
      results.database_connection_error = (error as Error).message;
    }

    return NextResponse.json({
      success: true,
      message: "Schéma de base de données mis à jour",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Erreur lors de la migration:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la migration",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Utilisez POST avec le header Authorization: Bearer INIT_TOKEN",
    example: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer your-init-token",
      },
      body: {},
    },
  });
}
