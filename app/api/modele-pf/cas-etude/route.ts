import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import casEtude from "@/lib/modele-pf/cas-etude.json";

/** GET — catalogue des 18 cas d'étude fictifs (ceux de l'outil Excel). */
export async function GET(req: NextRequest) {
  return withAuth(req, async () =>
    NextResponse.json({
      cas: (casEtude as { dossier: { onglet: string; titre: string; secteur: string; regime: string; phase: string } }[])
        .map(({ dossier: d }) => ({ onglet: d.onglet, titre: d.titre, secteur: d.secteur, regime: d.regime, phase: d.phase })),
    })
  );
}
