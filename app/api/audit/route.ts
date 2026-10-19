import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { hasPermission } from "@/lib/permissions";
import prisma from "@/lib/prisma-client";
import { HorsPerimetreError } from "@/lib/entites/filtre-prisma";

/**
 * Journal d'audit.
 *
 * La route était la seule de l'application à n'être protégée par aucun contrôle :
 * l'historique complet des actions — qui a modifié quel dossier, quand — se lisait
 * sans authentification, et le POST acceptait un `utilisateurId` arbitraire, ce qui
 * privait le journal de toute valeur probante. Le dispositif Bank Al-Maghrib exige
 * l'inverse : une trace imputable à une personne identifiée.
 */

async function handleGET(request: NextRequest, user: AuthPayload) {
  // Le journal (qui a fait quoi, sur quel dossier) est réservé aux rôles qui ont le droit
  // de le lire ; l'analyste ne l'a pas.
  if (!hasPermission(user.role, "audit:read")) {
    return NextResponse.json({ error: "Vos droits ne permettent pas de consulter le journal d'audit" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const utilisateurId = searchParams.get("utilisateurId");
    const action = searchParams.get("action");
    const depuis = searchParams.get("depuis");
    const jusqua = searchParams.get("jusqua");
    // Un paramètre non numérique faisait échouer la requête (NaN) : il prend sa valeur par défaut.
    const lu = (v: string | null, defaut: number) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Math.max(0, Math.floor(Number(v))) : defaut);
    const limit = Math.min(lu(searchParams.get("limit"), 100) || 100, 500);
    const offset = lu(searchParams.get("offset"), 0);

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

    // Une trace envoyée par le navigateur ne doit pas pouvoir imiter une action du serveur
    // (« SCORING_PF_VALIDER »…) : elle est préfixée et bornée.
    const actionEcran = `ECRAN_${String(action).toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 60)}`;
    const texte = typeof details === "string" ? details : JSON.stringify(details ?? {});

    const auditLog = await prisma.auditLog.create({
      data: {
        action: actionEcran,
        details: texte.slice(0, 10_000),
        // L'auteur est celui de la session, jamais celui que le corps de la requête
        // annonce : une trace que l'on peut signer d'un autre nom ne prouve rien.
        utilisateurId: user.userId,
        projectId: projectId || null,
      },
    });

    return NextResponse.json({ success: true, data: auditLog }, { status: 201 });
  } catch (error) {
    // Dossier d'une autre banque : refus 403, rendu par withAuth.
    if (error instanceof HorsPerimetreError) throw error;
    console.error("[AUDIT POST]", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'écriture du journal" },
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
