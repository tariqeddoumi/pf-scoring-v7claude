import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { lireGroupeT24 } from "@/lib/services/t24/connecteur";
import {
  refusSansDroitDeSaisie,
  reponseErreurT24,
  tracer,
} from "@/lib/services/t24/route-commune";

/** GET /api/t24/groupes/{code} — groupe d'affaires lu dans T24 (et groupe déjà connu de l'outil). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  return withAuth(request, async (_req, user) => {
    const refus = refusSansDroitDeSaisie(user);
    if (refus) return refus;
    const { code } = await params;
    try {
      const { fiche, simulation } = await lireGroupeT24(code.trim());
      const existant = await prisma.groupeAffaires.findFirst({
        where: { code: fiche.code },
        select: { id: true, nom: true },
      });
      await tracer(
        user,
        "T24_RAPATRIEMENT_GROUPE",
        `Lecture du groupe T24 ${fiche.code}${simulation ? " (simulation)" : ""}`
      );
      return NextResponse.json({
        success: true,
        data: fiche,
        simulation,
        existant,
      });
    } catch (e) {
      return reponseErreurT24(e, "T24 groupe");
    }
  });
}
