import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";

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
