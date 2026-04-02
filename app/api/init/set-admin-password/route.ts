import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { getErrorMessage } from "@/lib/error-handler";
import prisma from "@/lib/prisma-client";

/**
 * Endpoint pour définir le mot de passe de l'admin
 * ⚠️ Requiert INIT_TOKEN pour la sécurité
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

    const { email = "admin@pf-scoring.ma", password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Le mot de passe est requis" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Trouver ou créer l'utilisateur
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Mettre à jour le mot de passe
      user = await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
    } else {
      // Créer l'utilisateur avec le mot de passe
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          nom: "Admin",
          prenom: "Test",
          role: "admin",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Mot de passe défini avec succès",
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error("Erreur lors de la définition du mot de passe:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la définition du mot de passe",
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
      body: {
        email: "admin@pf-scoring.ma",
        password: "Admin123!",
      },
    },
  });
}
