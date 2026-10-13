import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { lireClientT24 } from "@/lib/services/t24/connecteur";
import {
  signerAttestation,
  texteAtteste,
  type AttestationClient,
} from "@/lib/services/t24/attestation";
import {
  refusSansDroitDeSaisie,
  reponseErreurT24,
  tracer,
} from "@/lib/services/t24/route-commune";

/**
 * GET /api/t24/clients/{code} — signalétique d'un client lue dans T24, pour
 * pré-remplir la fiche. Rien n'est enregistré ici : le chargé de saisie relit,
 * complète et enregistre. Signale une fiche existante portant déjà ce code.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  return withAuth(request, async (_req, user) => {
    const refus = refusSansDroitDeSaisie(user);
    if (refus) return refus;
    const { code } = await params;
    try {
      const { fiche, simulation } = await lireClientT24(code.trim());
      const existant = await prisma.client.findFirst({
        where: { codeClientT24: fiche.codeClientT24 },
        select: { id: true, nom: true },
      });
      await tracer(
        user,
        "T24_RAPATRIEMENT_CLIENT",
        `Lecture du client T24 ${fiche.codeClientT24}${simulation ? " (simulation)" : ""}`
      );
      // Attestation signée des valeurs lues : elle seule établira la provenance T24
      // des champs à l'enregistrement.
      const attestation = signerAttestation<AttestationClient>({
        t: "client",
        u: user.userId,
        c: fiche.codeClientT24,
        v: Object.fromEntries(
          Object.entries(fiche.champs).map(([k, v]) => [k, texteAtteste(v)])
        ),
        g: fiche.groupe,
      });
      return NextResponse.json({
        success: true,
        data: fiche,
        simulation,
        existant,
        attestation,
      });
    } catch (e) {
      return reponseErreurT24(e, "T24 client");
    }
  });
}
