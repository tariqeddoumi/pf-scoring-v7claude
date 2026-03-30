import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { verifyToken, getTokenFromCookie } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { dateCreation: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification
    const cookieStore = await cookies();
    const token = getTokenFromCookie(cookieStore.get("auth_token")?.value || "");

    if (!token) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const decoded = await verifyToken(token);
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 401 }
      );
    }

    const { nom, description, secteur, montant, countryCode } = await request.json();

    // Valider les données
    if (!nom || !description || !secteur || !montant) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    // Créer le projet
    const project = await prisma.project.create({
      data: {
        nom,
        description,
        secteur,
        montant: parseFloat(montant),
        devise: "MAD",
        status: "brouillon",
        creePar: userId,
        countryCode: countryCode || null,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du projet" },
      { status: 500 }
    );
  }
}
