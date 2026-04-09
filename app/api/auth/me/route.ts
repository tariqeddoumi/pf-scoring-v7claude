import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromCookie } from "@/lib/auth";
import prisma from "@/lib/prisma-client";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookie(request.headers.get("cookie"));

    if (!token) {
      return NextResponse.json(
        { error: "Non authentifié", errorCode: "AUTH_003" },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "Token invalide", errorCode: "AUTH_001" },
        { status: 401 }
      );
    }

    // Récupérer les détails complets de l'utilisateur
    const userDetails = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        avatar: true,
        createdAt: true,
      }
    });

    if (!userDetails) {
      return NextResponse.json(
        { error: "Utilisateur introuvable", errorCode: "BIZ_002" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userDetails
    });
  } catch (error) {
    console.error("[AUTH/ME] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification", errorCode: "SRV_001" },
      { status: 500 }
    );
  }
}
