import { motifLogoInvalide } from "@/lib/logo";
import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth, hasMinimumRole, type AuthPayload } from "@/lib/auth-middleware";
import { CLE_PARAMETRES } from "@/lib/modele-pf/serveur";
import prisma from "@/lib/prisma-client";
import { setAppConfig } from "@/lib/services/app-config-service";

/**
 * GET /api/admin/configuration/[key]
 * Fetch specific configuration key
 */
async function handleGet(key: string) {
  try {
    const config = await prisma.appConfiguration.findUnique({
      where: { key },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuration key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("[CONFIG GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch configuration" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/configuration/[key]
 * Update configuration key (admin only)
 */
async function handlePut(request: NextRequest, key: string, user: AuthPayload) {
  try {
    // La configuration est commune à toutes les banques (adresse et clé de l'IA, matrice de
    // délégation, T24…) : un administrateur du modèle d'une filiale pouvait la réécrire, par
    // exemple rediriger l'IA vers un serveur tiers avec la clé d'API et les pièces des dossiers.
    if (!hasMinimumRole(user.role, "system_admin") || !user.perimetre?.tout) {
      return NextResponse.json(
        { error: "Seul un administrateur système du groupe modifie la configuration commune" },
        { status: 403 }
      );
    }
    // Les paramètres du modèle PF passent par leur écran, qui contrôle leur cohérence.
    if (key === CLE_PARAMETRES) {
      return NextResponse.json(
        { error: "Les paramètres du modèle se modifient dans l'administration du modèle PF" },
        { status: 400 }
      );
    }
    const body = await request.json();
    const { value } = body;

    if (value === undefined || value === null) {
      return NextResponse.json({ error: "Value is required" }, { status: 400 });
    }

    if (key === "IA_URL_BASE" && String(value).trim() && !/^https:\/\/[^\s]+$/.test(String(value).trim())) {
      return NextResponse.json({ error: "L'adresse de l'IA doit commencer par https://" }, { status: 400 });
    }

    if (key === "APP_LOGO_URL") {
      const motif = motifLogoInvalide(String(value));
      if (motif) return NextResponse.json({ error: motif }, { status: 400 });
    }

    // Persist via the shared service: upsert (no 404 on first save), record
    // history, and invalidate the 5-minute config cache so the new value takes
    // effect immediately for the scoring engine and screens.
    await setAppConfig(key, String(value), user.userId);

    const config = await prisma.appConfiguration.findUnique({ where: { key } });

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error: unknown) {
    console.error("[CONFIG PUT]", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  // La lecture était ouverte sans connexion : toute clé, même non publique (adresses
  // IA et T24, paramètres du modèle), se lisait anonymement.
  return withAdminAuth(request, () => handleGet(key));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  return withAdminAuth(request, (req, user) => handlePut(req, key, user));
}
