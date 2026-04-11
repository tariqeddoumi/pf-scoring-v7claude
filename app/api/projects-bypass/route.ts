import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import {
  createErrorResponse,
  handleError,
  captureError,
  getErrorMessage,
} from "@/lib/error-handler";

/**
 * Endpoint de contournement temporaire pour tester la création de projets
 * À SUPPRIMER une fois l'authentification OAuth est en place
 */

// Utilisateur par défaut pour les tests
const DEFAULT_USER_EMAIL = "admin@pf-scoring.ma";

/**
 * Obtenir ou créer l'utilisateur par défaut pour les tests
 */
async function getOrCreateDefaultUser() {
  try {
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

    return user;
  } catch (error) {
    captureError(error, "getOrCreateDefaultUser");
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, description, secteur, montant, countryCode } = body;

    // Validation des champs obligatoires
    if (!nom || !secteur || !montant) {
      const { response } = createErrorResponse(
        "ERR_VAL_004",
        "Les champs nom, secteur et montant sont obligatoires"
      );
      return response;
    }

    // Obtenir ou créer l'utilisateur par défaut
    const user = await getOrCreateDefaultUser();

    // Créer le projet
    const project = await prisma.project.create({
      data: {
        nom,
        description: description || "",
        secteur,
        montant: parseFloat(montant.toString()),
        countryCode: countryCode || "MA",
        creePar: user.id,
        status: "brouillon",
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
          dateCreation: project.dateCreation,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    captureError(error, "POST /api/projects-bypass");

    const errorCode = handleError(error);
    const errorMessage =
      getErrorMessage(error) || "Erreur lors de la création du projet";
    const { response } = createErrorResponse(errorCode, errorMessage);
    return response;
  }
}

export async function GET() {
  try {
    // Obtenir ou créer l'utilisateur par défaut
    const user = await getOrCreateDefaultUser();

    // Récupérer tous les projets de cet utilisateur
    const projects = await prisma.project.findMany({
      where: { creePar: user.id },
      orderBy: { dateCreation: "desc" },
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
        dateCreation: p.dateCreation,
      })),
    });
  } catch (error: unknown) {
    captureError(error, "GET /api/projects-bypass");

    const errorCode = handleError(error);
    const errorMessage =
      getErrorMessage(error) || "Erreur lors de la récupération des projets";
    const { response } = createErrorResponse(errorCode, errorMessage);
    return response;
  }
}
