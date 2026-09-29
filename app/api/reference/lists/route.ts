import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import {
  REFERENTIELS_CLIENT,
  type CleReferentielClient,
  type OptionReferentiel,
} from "@/lib/referentiels";

/**
 * GET /api/reference/lists
 *
 * Référentiels de la signalétique client : type de client, forme juridique, segment,
 * statut bancaire, notation interne, KYC et conformité.
 *
 * Le schéma porte depuis l'origine les tables de paramétrage correspondantes
 * (BP_PF_client_types, BP_PF_legal_forms, BP_PF_client_segments, BP_PF_bank_statuses,
 * BP_PF_internal_ratings, BP_PF_kyc_statuses, BP_PF_compliance_statuses) mais aucune
 * n'était lue : chaque écran recopiait ses propres listes, avec des valeurs qui ne
 * correspondaient pas aux données. Cette route les sert dès qu'elles sont peuplées et
 * retombe sinon sur les listes de lib/referentiels.ts, afin que les formulaires
 * fonctionnent sur une base non paramétrée.
 *
 * La valeur retenue est le libellé, non le code : c'est ce que portent les clients
 * existants (« Grande Entreprise », « S.A. »). Le code est renvoyé à côté, pour une
 * bascule ultérieure sans casser les fiches déjà saisies.
 */

type LigneReferentiel = {
  code: string;
  label: string;
  description: string | null;
  orderIndex: number;
};

async function lire(
  lecture: () => Promise<LigneReferentiel[]>,
  repli: readonly OptionReferentiel[]
): Promise<{ options: OptionReferentiel[]; source: "base" | "defaut" }> {
  try {
    const lignes = await lecture();
    if (lignes.length === 0) return { options: [...repli], source: "defaut" };
    return {
      options: lignes.map((l) => ({
        valeur: l.label,
        libelle: l.label,
        aide: l.description ?? undefined,
        // Le caractère « à traiter » reste porté par le référentiel de référence :
        // les tables de paramétrage n'ont pas de colonne pour l'exprimer.
        aTraiter: repli.find((o) => o.valeur === l.label)?.aTraiter,
      })),
      source: "base",
    };
  } catch {
    // Table absente sur une base plus ancienne : le formulaire reste utilisable.
    return { options: [...repli], source: "defaut" };
  }
}

const SELECTION = {
  select: { code: true, label: true, description: true, orderIndex: true },
  orderBy: { orderIndex: "asc" as const },
  where: { isActive: true },
};

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const [
        typeClient,
        formeJuridique,
        segmentClientele,
        statutBancaire,
        ratingInterne,
        statusKYC,
        statusConformite,
      ] = await Promise.all([
        lire(() => prisma.clientType.findMany(SELECTION), REFERENTIELS_CLIENT.typeClient),
        lire(() => prisma.legalForm.findMany(SELECTION), REFERENTIELS_CLIENT.formeJuridique),
        lire(
          () => prisma.clientSegment.findMany(SELECTION),
          REFERENTIELS_CLIENT.segmentClientele
        ),
        lire(
          () => prisma.bankStatus.findMany(SELECTION),
          REFERENTIELS_CLIENT.statutBancaire
        ),
        lire(
          () => prisma.internalRating.findMany(SELECTION),
          REFERENTIELS_CLIENT.ratingInterne
        ),
        lire(() => prisma.kycStatus.findMany(SELECTION), REFERENTIELS_CLIENT.statusKYC),
        lire(
          () => prisma.complianceStatus.findMany(SELECTION),
          REFERENTIELS_CLIENT.statusConformite
        ),
      ]);

      const listes: Record<CleReferentielClient, OptionReferentiel[]> = {
        typeClient: typeClient.options,
        formeJuridique: formeJuridique.options,
        segmentClientele: segmentClientele.options,
        statutBancaire: statutBancaire.options,
        ratingInterne: ratingInterne.options,
        statusKYC: statusKYC.options,
        statusConformite: statusConformite.options,
        status: [...REFERENTIELS_CLIENT.status],
      };

      return NextResponse.json({
        success: true,
        data: listes,
        sources: {
          typeClient: typeClient.source,
          formeJuridique: formeJuridique.source,
          segmentClientele: segmentClientele.source,
          statutBancaire: statutBancaire.source,
          ratingInterne: ratingInterne.source,
          statusKYC: statusKYC.source,
          statusConformite: statusConformite.source,
          status: "defaut",
        },
      });
    } catch (error) {
      console.error("[REFERENCE LISTS GET]", error);
      // Les listes par défaut valent mieux qu'un formulaire sans options.
      return NextResponse.json({
        success: true,
        data: REFERENTIELS_CLIENT,
        sources: {},
      });
    }
  });
}
