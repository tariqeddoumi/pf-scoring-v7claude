import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";

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
      const { nom, email, telephone, type, typeClient, segmentClientele,
              statusKYC, statusConformite, secteur, pays, description } = body;

      if (!nom) {
        return NextResponse.json(
          { success: false, error: "Le nom est requis" },
          { status: 400 }
        );
      }

      const client = await prisma.client.create({
        data: {
          nom,
          email: email || null,
          telephone: telephone || null,
          type: type || "Entreprise",
          typeClient: typeClient || "Entreprise",
          segmentClientele: segmentClientele || null,
          statusKYC: statusKYC || "En attente",
          statusConformite: statusConformite || "En attente",
          secteur: secteur || null,
          pays: pays || null,
          description: description || null,
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
