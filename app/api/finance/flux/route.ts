import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth-middleware";
import { calculerFlux, calculerLlcr, financementATerminaison } from "@/lib/services/finance/flux";

const nombre = z.number().finite();
const schema = z
  .object({
    seuilDscr: nombre.positive(),
    dsraInitiale: nombre.min(0).default(0),
    detteRestante: nombre.min(0).optional(),
    tauxActualisation: nombre.min(0).max(1).optional(),
    periodes: z
      .array(
        z
          .object({
            libelle: z.string().min(1).max(60),
            cfads: nombre,
            serviceMad: nombre.min(0),
            serviceDevise: nombre.min(0).optional(),
            couvertureDevise: nombre.min(0).max(1).optional(),
            ballon: nombre.min(0).optional(),
            dureeAnnees: nombre.positive().max(1).optional(),
          })
          .strict()
      )
      .min(1)
      .max(240),
    scenarios: z
      .array(
        z
          .object({
            nom: z.string().min(1).max(60),
            chocCfads: nombre.min(-1).max(1).optional(),
            chocChange: nombre.min(-1).max(5).optional(),
            decalageEncaissement: z.object({ periode: z.number().int().min(0), montant: nombre.min(0) }).optional(),
            ballonNonRefinance: z.boolean().optional(),
          })
          .strict()
      )
      .max(10)
      .default([]),
    construction: z
      .object({
        budget: nombre.positive(),
        depassements: z.array(nombre.min(0)).max(20).optional(),
        detteEngagee: nombre.min(0),
        fondsPropres: nombre.min(0),
        autresRessourcesEngagees: nombre.min(0).optional(),
      })
      .optional(),
  })
  .strict();

/**
 * POST /api/finance/flux — recalcul des indicateurs à partir des séries.
 * Aucun enregistrement : le résultat sert au rapprochement avec le modèle financier
 * de l'analyste et aux scénarios de stress (lib/services/finance/flux.ts).
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (r) => {
    const parsed = schema.safeParse(await r.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Données invalides", details: parsed.error.issues.slice(0, 10) },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const options = { seuilDscr: d.seuilDscr, dsraInitiale: d.dsraInitiale };
    const base = calculerFlux(d.periodes, options);
    const scenarios = d.scenarios.map((s) => calculerFlux(d.periodes, { ...options, scenario: s }));
    return NextResponse.json({
      success: true,
      data: {
        base,
        scenarios,
        llcr:
          d.detteRestante !== undefined && d.tauxActualisation !== undefined
            ? calculerLlcr(d.periodes, d.detteRestante, d.tauxActualisation)
            : null,
        construction: d.construction ? financementATerminaison(d.construction) : null,
      },
    });
  });
}
