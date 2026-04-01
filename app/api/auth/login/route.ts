import { NextResponse } from "next/server";
import { verifyPassword, createToken } from "@/lib/auth";

import prisma from "@/lib/prisma-client";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const hashedPassword = user.password || "";
    if (!hashedPassword) {
      console.error(`User ${email} has no password set`);
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(password, hashedPassword);

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Créer le token JWT
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Créer la réponse avec le cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Ajouter le cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400, // 24 heures
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("Erreur login:", error?.message, error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion", details: error?.message },
      { status: 500 }
    );
  }
}
