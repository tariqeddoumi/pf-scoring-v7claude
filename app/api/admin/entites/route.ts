import { NextRequest, NextResponse } from "next/server";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { PERIMETRE_VIDE } from "@/lib/entites/perimetre";
import { creerEntite, entiteSchema, journaliser, listerEntites, reponseErreur } from "@/lib/entites/service";

/**
 * GET  /api/admin/entites — banques et filiales du périmètre (tout utilisateur
 *      connecté : sert aussi aux listes de choix des écrans clients et projets).
 * POST /api/admin/entites — créer une entité (administrateur système).
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, user) => {
    const entites = await listerEntites(user.perimetre ?? PERIMETRE_VIDE);
    return NextResponse.json({
      success: true,
      data: entites,
      perimetre: {
        tout: user.perimetre?.tout ?? false,
        entiteId: user.perimetre?.entiteId ?? null,
        ecriture: user.perimetre?.ecriture ?? [],
      },
    });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    if (!hasMinimumRole(user.role, "system_admin")) {
      return NextResponse.json({ success: false, error: "Réservé aux administrateurs système" }, { status: 403 });
    }
    const verifie = entiteSchema.safeParse(await req.json().catch(() => ({})));
    if (!verifie.success) {
      return NextResponse.json({ success: false, error: verifie.error.issues.map((i) => i.message).join(" ; ") }, { status: 400 });
    }
    try {
      const entite = await creerEntite(user.perimetre ?? PERIMETRE_VIDE, verifie.data);
      await journaliser(user, "ENTITE_CREATION", { id: entite.id, code: entite.code, nom: entite.nom, parentId: entite.parentId });
      return NextResponse.json({ success: true, data: entite }, { status: 201 });
    } catch (e) {
      return reponseErreur(e);
    }
  });
}
