import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { updateClientSchema } from "@/lib/validation-schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req) => {
    const { id } = await params;
    try {
      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          // La fiche affiche l'encours demandé et la note de chaque dossier :
          // sans montant ni note, la liste des projets n'apprend rien.
          projects: {
            select: {
              id: true,
              nom: true,
              status: true,
              montant: true,
              grade: true,
              scoreGlobal: true,
            },
            orderBy: { dateCreation: "desc" },
          },
        },
      });

      if (!client) {
        return NextResponse.json(
          { success: false, error: "Client non trouvé" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: client });
    } catch (error: any) {
      console.error(`[Client ${id} GET]`, error);
      return NextResponse.json(
        { success: false, error: error.message || "Erreur serveur" },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req) => {
    const { id } = await params;
    try {
      const body = await req.json();

      // Quatorze champs étaient ignorés en silence — raison sociale, forme juridique,
      // capital, effectifs, adresse, ville, code postal, site, centre d'affaires,
      // gestionnaire, date de relation, exposition, nom commercial, chiffre
      // d'affaires. L'utilisateur voyait « enregistré » et retrouvait l'ancienne
      // valeur. Le schéma partiel décrit l'ensemble des champs modifiables.
      const validation = updateClientSchema.safeParse(body);
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

      const client = await prisma.client.update({
        where: { id },
        data: {
          ...champs,
          ...(dateRelation !== undefined && {
            dateRelation: dateRelation ? new Date(dateRelation) : null,
          }),
          ...(status !== undefined && status !== null && { status }),
        },
      });

      return NextResponse.json({ success: true, data: client });
    } catch (error: any) {
      console.error(`[Client ${id} PUT]`, error);
      return NextResponse.json(
        { success: false, error: error.message || "Erreur serveur" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req) => {
    const { id } = await params;
    try {
      await prisma.client.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Client supprimé" });
    } catch (error: any) {
      console.error(`[Client ${id} DELETE]`, error);
      return NextResponse.json(
        { success: false, error: error.message || "Erreur serveur" },
        { status: 500 }
      );
    }
  });
}
