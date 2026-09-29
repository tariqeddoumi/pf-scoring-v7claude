import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";

/**
 * Journal d'audit.
 *
 * La route était la seule de l'application à n'être protégée par aucun contrôle :
 * l'historique complet des actions — qui a modifié quel dossier, quand — se lisait
 * sans authentification, et le POST acceptait un `utilisateurId` arbitraire, ce qui
 * privait le journal de toute valeur probante. Le dispositif Bank Al-Maghrib exige
 * l'inverse : une trace imputable à une personne identifiée.
 */

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const utilisateurId = searchParams.get("utilisateurId");
    const action = searchParams.get("action");
    const depuis = searchParams.get("depuis");
    const jusqua = searchParams.get("jusqua");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (utilisateurId) where.utilisateurId = utilisateurId;
    if (action) where.action = action;
    if (depuis || jusqua) {
      where.dateAction = {
        ...(depuis ? { gte: new Date(depuis) } : {}),
        ...(jusqua ? { lte: new Date(jusqua) } : {}),
      };
    }

    // L'écran affichait des identifiants techniques faute de jointure : le nom de
    // l'auteur et celui du dossier viennent désormais de la même requête.
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { dateAction: "desc" },
        take: limit,
        skip: offset,
        include: {
          user: { select: { id: true, nom: true, prenom: true, email: true } },
          project: { select: { id: true, nom: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: logs, total, limit, offset });
  } catch (error) {
    console.error("[AUDIT GET]", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du journal" },
      { status: 500 }
    );
  }
}

async function handlePOST(request: NextRequest, user: AuthPayload) {
  try {
    const { action, details, projectId } = await request.json();

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action requise" },
        { status: 400 }
      );
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        action,
        details: typeof details === "string" ? details : JSON.stringify(details ?? {}),
        // L'auteur est celui de la session, jamais celui que le corps de la requête
        // annonce : une trace que l'on peut signer d'un autre nom ne prouve rien.
        utilisateurId: user.userId,
        projectId: projectId || null,
      },
    });

    return NextResponse.json({ success: true, data: auditLog }, { status: 201 });
  } catch (error) {
    console.error("[AUDIT POST]", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'écriture du journal" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req) => handleGET(req));
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
