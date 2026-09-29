import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { createClientSchema } from "@/lib/validation-schemas";

async function handler(request: NextRequest) {
  // GET - List clients
  if (request.method === "GET") {
    try {
      const { searchParams } = new URL(request.url);
      const skip = parseInt(searchParams.get("skip") || "0");
      const take = parseInt(searchParams.get("take") || "10");
      const search = searchParams.get("search") || "";

      const where = search
        ? {
            OR: [
              { nom: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
            type: true,
            typeClient: true,
            segmentClientele: true,
            statusKYC: true,
            statusConformite: true,
            ratingInterne: true,
            statutBancaire: true,
            secteur: true,
            pays: true,
            status: true,
            createdAt: true,
            // La liste montre l'exposition, le gestionnaire et le nombre de projets :
            // ce sont les repères d'un chargé d'affaires, et ils n'étaient pas
            // sélectionnés.
            exposition: true,
            gestionnaire: true,
            raisonSociale: true,
            ville: true,
            projects: { select: { id: true } },
          },
        }),
        prisma.client.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: clients,
        total,
        page: Math.floor(skip / take),
        pageSize: take,
      });
    } catch (error: any) {
      console.error("[Clients GET]", error);
      return NextResponse.json(
        { success: false, error: error.message || "Erreur serveur" },
        { status: 500 }
      );
    }
  }

  // POST - Create client
  if (request.method === "POST") {
    try {
      const body = await request.json();

      // La route ne retenait que onze champs sur les vingt-neuf que le formulaire
      // envoie : raison sociale, forme juridique, rating interne, exposition, ville,
      // adresse, gestionnaire et le reste étaient perdus sans le moindre message.
      // Le schéma Zod les décrit tous ; c'est lui qui fait foi désormais.
      const validation = createClientSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Données invalides",
            errors: validation.error.issues.map((i) => ({
              field: i.path.join("."),
              message: i.message,
            })),
          },
          { status: 400 }
        );
      }

      const { dateRelation, status, ...champs } = validation.data;

      const client = await prisma.client.create({
        data: {
          ...champs,
          type: champs.type || "Entreprise",
          typeClient: champs.typeClient || "Entreprise",
          statusKYC: champs.statusKYC || "En attente",
          statusConformite: champs.statusConformite || "En attente",
          // status n'est pas nullable en base et vaut « Actif » par défaut.
          status: status || "Actif",
          // Le formulaire envoie une date au format AAAA-MM-JJ ; Prisma attend un
          // objet Date. Une valeur illisible vaut mieux absente qu'incorrecte.
          dateRelation: dateRelation ? new Date(dateRelation) : null,
        },
      });

      return NextResponse.json(
        { success: true, data: client },
        { status: 201 }
      );
    } catch (error: any) {
      console.error("[Clients POST]", error);
      return NextResponse.json(
        { success: false, error: error.message || "Erreur serveur" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { success: false, error: "Méthode non autorisée" },
    { status: 405 }
  );
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req) => handler(req));
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req) => handler(req));
}
