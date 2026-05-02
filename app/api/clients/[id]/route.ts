import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";

async function handler(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  // GET - Get client by ID
  if (request.method === "GET") {
    try {
      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          projects: { select: { id: true, nom: true, status: true } },
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
  }

  // PUT - Update client
  if (request.method === "PUT") {
    try {
      const body = await request.json();
      const client = await prisma.client.update({
        where: { id },
        data: {
          nom: body.nom,
          email: body.email,
          telephone: body.telephone,
          type: body.type,
          segment: body.segment,
          kycStatus: body.kycStatus,
          complianceStatus: body.complianceStatus,
          internalRating: body.internalRating,
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
  }

  // DELETE - Delete client
  if (request.method === "DELETE") {
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
  }

  return NextResponse.json(
    { success: false, error: "Méthode non autorisée" },
    { status: 405 }
  );
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, (req) => handler(req, { params }));
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, (req) => handler(req, { params }));
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, (req) => handler(req, { params }));
}
