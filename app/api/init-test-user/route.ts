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

    // Créer l'utilisateur admin de test
    const user = await prisma.user.upsert({
      where: { email: "admin@pf-scoring.ma" },
      update: {
        role: "admin",
      },
      create: {
        email: "admin@pf-scoring.ma",
        nom: "Admin",
        prenom: "Test",
        role: "admin",
        password: "", // Sans mot de passe pour les tests
      },
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur admin créé/mis à jour avec succès",
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
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
