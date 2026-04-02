import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { verifyToken, getTokenFromCookie } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Test simple: retourner un tableau vide pour tester
    const projects = await prisma.project.findMany({
      orderBy: { dateCreation: "desc" },
      take: 10,
    });

    // Sérialiser les dates en ISO strings
    const serialized = projects.map((p) => ({
      id: p.id,
      nom: p.nom,
      description: p.description,
      secteur: p.secteur,
      montant: p.montant,
      devise: p.devise,
      status: p.status,
      scoreGlobal: p.scoreGlobal,
      grade: p.grade,
      countryCode: p.countryCode,
      dateCreation: p.dateCreation.toISOString(),
      dateMiseAJour: p.dateMiseAJour.toISOString(),
      creePar: p.creePar,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Erreur complète:", error);
    // Retourner un tableau vide au lieu d'une erreur pour que la page charge
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("auth_token")?.value;
    const token = authCookie ? authCookie : null;

    if (!token) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const decoded = await verifyToken(token);
      if (!decoded) {
        return NextResponse.json(
          { error: "Token invalide" },
          { status: 401 }
        );
      }
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
