import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import {
  configT24,
  configurationIncompleteT24,
} from "@/lib/services/t24/connecteur";

/**
 * GET /api/t24/statut — le rapatriement depuis T24 est-il possible ?
 * Le formulaire client affiche ou non le bouton « Rapatrier depuis T24 » ;
 * sinon la saisie reste manuelle. Aucune adresse ni identifiant n'est renvoyé.
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    const c = await configT24();
    const manque = configurationIncompleteT24(c);
    return NextResponse.json({
      success: true,
      data: { actif: manque === null, mode: c.mode, message: manque },
    });
  });
}
