import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { getErrorMessage } from "@/lib/error-handler";

/**
 * Endpoint pour initialiser les données de test
 * ⚠️ À utiliser une seule fois pour créer l'utilisateur admin de test
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

    // Créer l'utilisateur admin de test avec un INSERT/UPDATE plutôt que upsert
    const user = await prisma.$executeRawUnsafe(`
      INSERT INTO pf_scoring_users (id, email, nom, prenom, role, password, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        'admin@pf-scoring.ma',
        'Admin',
        'Test',
        'admin'::\"UserRole\",
        '',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (email) DO UPDATE SET
        role = 'admin'::\"UserRole\",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING id, email, nom, prenom, role;
    `);

    return NextResponse.json({
      success: true,
      message: "Utilisateur admin créé/mis à jour avec succès",
      user: {
        email: "admin@pf-scoring.ma",
        nom: "Admin",
        prenom: "Test",
        role: "admin",
      },
    });
  } catch (error: unknown) {
    console.error("Erreur lors de l'initialisation:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'initialisation",
        details: getErrorMessage(error),
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
