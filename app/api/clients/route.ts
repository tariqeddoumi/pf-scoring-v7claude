import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { createClientSchema } from "@/lib/validation-schemas";
import { ZodError } from "zod";

async function handleGET(request: NextRequest, user: any) {
  try {
    const clients = await prisma.client.findMany({
      include: {
        projects: {
          select: { id: true, nom: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: clients,
      count: clients.length,
    });
  } catch (error: any) {
    console.error("[CLIENTS] GET error:", error);

    // Handle Prisma-specific errors
    if (error.code === "P1001") {
      return NextResponse.json(
        {
          error: "Impossible de se connecter à la base de données",
          errorCode: "DB_CONNECTION_ERROR",
          details:
            "Vérifiez que les variables d'environnement DATABASE_URL sont correctement configurées",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || "Failed to fetch clients",
        errorCode: "ERR_API_001",
      },
      { status: 500 }
    );
  }
}

async function handlePOST(request: NextRequest, user: any) {
  try {
    const body = await request.json();
    console.log("[CLIENTS] POST request body:", JSON.stringify(body));

    // Validation avec Zod
    let validated;
    try {
      validated = createClientSchema.parse(body);
    } catch (validationError) {
      console.error("[CLIENTS] Validation error:", validationError);
      throw validationError;
    }

    // Vérifier si email existe déjà (si fourni)
    if (validated.email) {
      const existingClient = await prisma.client.findUnique({
        where: { email: validated.email },
      });

      if (existingClient) {
        return NextResponse.json(
          {
            error: "Un client avec cet email existe déjà",
            errorCode: "ERR_API_002",
            errors: [
              {
                field: "email",
                message: "Cet email est déjà utilisé (ERR_API_002)",
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    const client = await prisma.client.create({
      data: {
        nom: validated.nom,
        email: validated.email ?? null,
        telephone: validated.telephone ?? null,
        secteur: validated.secteur ?? null,
        pays: validated.pays ?? null,
        type: validated.type ?? "Entreprise",
        description: validated.description ?? null,
        status: validated.status ?? "Actif",
        // Extended fields
        raisonSociale: validated.raisonSociale ?? null,
        nomCommercial: validated.nomCommercial ?? null,
        typeClient: validated.typeClient ?? null,
        formeJuridique: validated.formeJuridique ?? null,
        segmentClientele: validated.segmentClientele ?? null,
        effectifs: (validated.effectifs as number | null) ?? null,
        capitalSocial: (validated.capitalSocial as number | null) ?? null,
        chiffreAffaires: (validated.chiffreAffaires as number | null) ?? null,
        ville: validated.ville ?? null,
        adresse: validated.adresse ?? null,
        codePostal: validated.codePostal ?? null,
        website: validated.website ?? null,
        centreAffaires: validated.centreAffaires ?? null,
        gestionnaire: validated.gestionnaire ?? null,
        ratingInterne: validated.ratingInterne ?? null,
        statutBancaire: validated.statutBancaire ?? null,
        dateRelation: validated.dateRelation ? new Date(validated.dateRelation) : null,
        exposition: (validated.exposition as number | null) ?? null,
        statusKYC: validated.statusKYC ?? null,
        statusConformite: validated.statusConformite ?? null,
      },
    });

    console.log("[CLIENTS] POST success:", client.id);

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error: any) {
    console.error("[CLIENTS] POST error:", error);
    console.error("[CLIENTS] Error stack:", error.stack);
    console.error("[CLIENTS] Error code:", error.code);
    console.error("[CLIENTS] Error message:", error.message);

    // Gestion des erreurs Zod
    if (error instanceof ZodError) {
      const errors = error.flatten().fieldErrors;
      const formattedErrors = Object.entries(errors).map(
        ([field, messages]) => ({
          field,
          message: Array.isArray(messages) ? messages[0] : messages,
        })
      );

      console.error("[CLIENTS] Zod validation errors:", formattedErrors);

      return NextResponse.json(
        {
          error: "Validation échouée",
          errorCode: "ERR_VALID_001",
          errors: formattedErrors,
        },
        { status: 400 }
      );
    }

    // Erreur Prisma - email unique constraint
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "Un client avec cet email existe déjà",
          errorCode: "ERR_API_002",
          errors: [
            {
              field: "email",
              message: "Cet email est déjà utilisé (ERR_API_002)",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Handle Prisma-specific errors
    if (error.code === "P1001") {
      return NextResponse.json(
        {
          error: "Impossible de se connecter à la base de données",
          errorCode: "DB_CONNECTION_ERROR",
          details:
            "Vérifiez que les variables d'environnement DATABASE_URL et DIRECT_URL sont correctement configurées",
        },
        { status: 500 }
      );
    }

    // Handle JSON parse error
    if (error instanceof SyntaxError && "body" in error) {
      return NextResponse.json(
        {
          error: "Erreur de format des données envoyées",
          errorCode: "ERR_VALID_001",
        },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: error.message || "Erreur lors de la création du client",
        errorCode: "ERR_API_001",
        debugInfo:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handleGET(req, user));
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
