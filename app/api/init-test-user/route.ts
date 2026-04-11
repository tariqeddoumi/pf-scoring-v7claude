import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { getErrorMessage } from "@/lib/error-handler";
import { hashPassword } from "@/lib/auth";

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
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Hash du mot de passe par défaut: Admin123!
    const hashedPassword = await hashPassword("Admin123!");

    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user
      .findUnique({
        where: { email: "admin@pf-scoring.ma" },
      })
      .catch(() => null);

    if (!user) {
      // Créer l'utilisateur avec Prisma
      user = await prisma.user.create({
        data: {
          email: "admin@pf-scoring.ma",
          nom: "Admin",
          prenom: "Test",
          role: "admin",
          password: hashedPassword,
        },
      });
    } else {
      // Mettre à jour le mot de passe de l'utilisateur existant
      user = await prisma.user.update({
        where: { email: "admin@pf-scoring.ma" },
        data: {
          password: hashedPassword,
          role: "admin",
        },
      });
    }

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
    console.error("[INIT] Erreur lors de l'initialisation:", error);
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
        Authorization: "Bearer your-init-token",
      },
      body: {},
    },
  });
}
