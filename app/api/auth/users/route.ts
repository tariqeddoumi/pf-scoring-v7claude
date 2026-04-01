import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookie, verifyToken, hashPassword } from "@/lib/auth";
import { getErrorMessage } from "@/lib/error-handler";
import prisma from "@/lib/prisma-client";

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est authentifié
    const cookieHeader = request.headers.get("cookie");
    const token = getTokenFromCookie(cookieHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 401 }
      );
    }

    // Seuls les admins peuvent voir tous les utilisateurs
    const isAdmin = payload.role === "admin";

    let users;
    if (isAdmin) {
      users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Les non-admins ne voient que leurs propres infos
      users = await prisma.user.findMany({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error: unknown) {
    console.error("Erreur récupération utilisateurs:", error?.message);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

// Mettre à jour le profil utilisateur
export async function PUT(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const token = getTokenFromCookie(cookieHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 401 }
      );
    }

    const { id, nom, prenom, password, role } = await request.json();

    // Un utilisateur ne peut modifier que son propre compte, sauf les admins
    if (payload.userId !== id && payload.role !== "admin") {
      return NextResponse.json(
        { error: "Vous ne pouvez modifier que votre propre compte" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {};
    if (nom) updateData.nom = nom;
    if (prenom) updateData.prenom = prenom;
    if (password) updateData.password = await hashPassword(password);
    if (role && payload.role === "admin") updateData.role = role;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        avatar: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Erreur mise à jour profil:", error?.message);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}
