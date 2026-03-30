import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let where = {};
    if (projectId) {
      where = { projectId };
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { dateAction: "desc" },
      take: limit,
      skip: offset,
    });

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action, details, utilisateurId, projectId } = await request.json();

    const auditLog = await prisma.auditLog.create({
      data: {
        action,
        details,
        utilisateurId: utilisateurId || "system",
        projectId: projectId || null,
        dateAction: new Date(),
      },
    });

    return NextResponse.json(auditLog, { status: 201 });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du log" },
      { status: 500 }
    );
  }
}
