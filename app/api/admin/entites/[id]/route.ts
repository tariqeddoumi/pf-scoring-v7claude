import { NextRequest, NextResponse } from "next/server";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { PERIMETRE_VIDE } from "@/lib/entites/perimetre";
import { entiteSchema, journaliser, modifierEntite, reponseErreur, supprimerEntite } from "@/lib/entites/service";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH : renommer, déplacer, habiller, (dés)activer. DELETE : entité vide seulement. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  return withAuth(request, async (req, user) => {
    if (!hasMinimumRole(user.role, "system_admin")) {
      return NextResponse.json({ success: false, error: "Réservé aux administrateurs système" }, { status: 403 });
    }
    const { id } = await params;
    const verifie = entiteSchema.partial().safeParse(await req.json().catch(() => ({})));
    if (!verifie.success) {
      return NextResponse.json({ success: false, error: verifie.error.issues.map((i) => i.message).join(" ; ") }, { status: 400 });
    }
    try {
      const entite = await modifierEntite(user.perimetre ?? PERIMETRE_VIDE, id, verifie.data);
      await journaliser(user, "ENTITE_MODIFICATION", { id, changements: verifie.data });
      return NextResponse.json({ success: true, data: entite });
    } catch (e) {
      return reponseErreur(e);
    }
  });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  return withAuth(request, async (_req, user) => {
    if (!hasMinimumRole(user.role, "system_admin")) {
      return NextResponse.json({ success: false, error: "Réservé aux administrateurs système" }, { status: 403 });
    }
    const { id } = await params;
    try {
      await supprimerEntite(user.perimetre ?? PERIMETRE_VIDE, id);
      await journaliser(user, "ENTITE_SUPPRESSION", { id });
      return NextResponse.json({ success: true });
    } catch (e) {
      return reponseErreur(e);
    }
  });
}
