import { NextResponse } from "next/server";
import { verifyPassword, createToken } from "@/lib/auth";
import { createErrorResponse, handleError, getErrorMessage } from "@/lib/error-handler";

import prisma from "@/lib/prisma-client";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis", errorCode: "ERR_VAL_001" },
        { status: 400 }
      );
    }

    // Trouver l'utilisateur
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } catch (dbError: unknown) {
      const dbErrorMsg = dbError instanceof Error ? dbError.message : String(dbError);
      console.error(`[LOGIN] Database error for ${email}:`, dbErrorMsg);
      return NextResponse.json(
        {
          error: "Impossible de se connecter à la base de données",
          errorCode: "ERR_DB_001",
          details: process.env.NODE_ENV === "development" ? dbErrorMsg : undefined
        },
        { status: 503 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect", errorCode: "ERR_AUTH_001" },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const hashedPassword = user.password || "";
    if (!hashedPassword) {
      console.error(`[LOGIN] User ${email} has no password set`);
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect", errorCode: "ERR_AUTH_001" },
        { status: 401 }
      );
    }

    let passwordValid = false;
    try {
      passwordValid = await verifyPassword(password, hashedPassword);
    } catch (pwError: unknown) {
      console.error(`[LOGIN] Password verification error for ${email}:`, pwError);
      return NextResponse.json(
        { error: "Erreur lors de la vérification du mot de passe", errorCode: "ERR_AUTH_002" },
        { status: 500 }
      );
    }

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect", errorCode: "ERR_AUTH_001" },
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

    console.log(`[LOGIN] Successful login for ${email}`);
    return response;
  } catch (error: unknown) {
    console.error("[LOGIN] Unexpected error:", error);
    const errorCode = handleError(error);
    const errorMessage = getErrorMessage(error) || "Erreur lors de la connexion";

    return NextResponse.json(
      { error: errorMessage, errorCode, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
