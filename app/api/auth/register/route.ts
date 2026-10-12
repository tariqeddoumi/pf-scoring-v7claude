import { NextRequest, NextResponse } from "next/server";
import { hashPassword, getTokenFromCookie, verifyToken } from "@/lib/auth";
import { getErrorMessage } from "@/lib/error-handler";
import prisma from "@/lib/prisma-client";
import { etatDuCompte } from "@/lib/compte-actif";
import { calculerPerimetre, chargerArbre } from "@/lib/entites/perimetre";

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const cookieHeader = request.headers.get("cookie");
    const token = getTokenFromCookie(cookieHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "system_admin") {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent créer des comptes" },
        { status: 403 }
      );
    }

    const { email, nom, prenom, password, role } = await request.json();

    if (!email || !nom || !prenom || !password) {
      return NextResponse.json(
        { error: "Email, nom, prénom et mot de passe requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur n'existe pas
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Le compte créé est rattaché à la banque de l'administrateur : un administrateur
    // de filiale ne crée pas de compte à accès global.
    const perimetre = calculerPerimetre(await chargerArbre(), await etatDuCompte(payload.userId));
    const user = await prisma.user.create({
      data: {
        email,
        nom,
        prenom,
        password: hashedPassword,
        role: role || "read_only",
        entiteId: perimetre.tout ? null : perimetre.entiteId,
      },
    });

    return NextResponse.json(
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
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erreur création compte:", errorMessage);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 }
    );
  }
}
