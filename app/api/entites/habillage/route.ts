import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { chargerArbre, habillageHerite } from "@/lib/entites/perimetre";

/**
 * GET /api/entites/habillage — nom de l'outil, logo et couleur de l'utilisateur
 * connecté : ceux de sa banque, sinon de la plus proche entité mère qui les définit.
 * Ce qui reste vide vient du paramétrage général (APP_NAME, APP_LOGO_URL, PRIMARY_COLOR).
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, user) => {
    const habillage = habillageHerite(await chargerArbre(), user.perimetre?.entiteId ?? null);
    return NextResponse.json({ success: true, data: habillage });
  });
}
