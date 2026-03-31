import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * Endpoint de contournement temporaire pour tester la création de projets
 * À SUPPRIMER une fois l'authentification OAuth est en place
 */

// Utilisateur par défaut pour les tests
const DEFAULT_USER_EMAIL = "admin@pf-scoring.ma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, description, secteur, montant, countryCode } = body;

    if (!nom || !secteur || !montant) {
      return NextResponse.json(
        { error: "nom, secteur et montant sont requis" },
        { status: 400 }
      );
    }

    // Trouver ou créer l'utilisateur par défaut
    let user = await prisma.user.findUnique({
      where: { email: DEFAULT_USER_EMAIL },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: DEFAULT_USER_EMAIL,
          nom: "Admin",
          prenom: "Utilisateur",
          role: "admin",
          password: "", // Pas de mot de passe pour l'authentification de contournement
        },
      });
    }

    // Créer le projet
    const project = await prisma.project.create({
      data: {
        nom,
        description: description || "",
        secteur,
        montant: parseFloat(montant.toString()),
        countryCode: countryCode || "MA",
        userId: user.id,
        status: "draft",
      },
    });

    return NextResponse.json(
      {
        success: true,
        project: {
          id: project.id,
          nom: project.nom,
          description: project.description,
          secteur: project.secteur,
          montant: project.montant,
          countryCode: project.countryCode,
          status: project.status,
          createdAt: project.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur création projet bypass:", error?.message, error);
    return NextResponse.json(
      { error: "Erreur lors de la création du projet", details: error?.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: DEFAULT_USER_EMAIL },
    });

    const projects = await prisma.project.findMany({
      where: { userId: user?.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      projects: projects.map((p) => ({
        id: p.id,
        nom: p.nom,
        description: p.description,
        secteur: p.secteur,
        montant: p.montant,
        countryCode: p.countryCode,
        status: p.status,
        createdAt: p.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Erreur récupération projets:", error?.message);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets" },
      { status: 500 }
    );
  }
}
