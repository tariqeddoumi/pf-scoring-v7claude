/**
 * Calibrage sectoriel.
 *
 * GET  /api/admin/scoring/sectors          — secteurs, facteurs de pondération,
 *                                            points d'alerte et tests de résistance
 * PUT  /api/admin/scoring/sectors?id=…     — facteurs de pondération d'un secteur
 *
 * Les douze secteurs existaient en base sans qu'aucun écran ne permette de les
 * consulter ni de les modifier : le calibrage était en pratique figé au contenu du
 * script d'initialisation.
 */

import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, serverError, validationError } from "@/lib/api-response";
import prisma from "@/lib/prisma-client";
import { FACTEUR_MAX, FACTEUR_MIN, facteurValide } from "@/lib/sector-calibration";

/** Facteur tel qu'il arrive du client : les types ne sont pas garantis. */
interface PoidsEntrant {
  domainCode?: unknown;
  weightAdjusted?: unknown;
}

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const secteurs = await prisma.v9Sector.findMany({
        include: {
          domainWeights: { orderBy: { domainCode: "asc" } },
          redFlags: { orderBy: { orderIndex: "asc" } },
          stressTests: { orderBy: { orderIndex: "asc" } },
        },
        orderBy: [{ orderIndex: "asc" }, { code: "asc" }],
      });

      return successResponse(secteurs, { count: secteurs.length });
    } catch (error) {
      console.error("[ADMIN/SCORING/SECTORS] GET error:", error);
      return serverError("Erreur lors de la récupération des secteurs");
    }
  });
}

export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const sectorId = searchParams.get("id");
      if (!sectorId) {
        return validationError([{ field: "id", message: "Requis" }]);
      }

      const body = await req.json().catch(() => null);
      const poids = body?.domainWeights;
      if (!Array.isArray(poids)) {
        return validationError([
          { field: "domainWeights", message: "Corps attendu : { domainWeights: [...] }" },
        ]);
      }

      const secteur = await prisma.v9Sector.findUnique({ where: { id: sectorId } });
      if (!secteur) {
        return validationError([{ field: "id", message: "Secteur introuvable" }]);
      }

      const erreurs: { field: string; message: string }[] = [];
      const normalises = (poids as PoidsEntrant[]).map((p) => ({
        domainCode: String(p.domainCode ?? "").trim(),
        weightAdjusted: Number(p.weightAdjusted),
      }));

      for (const p of normalises) {
        if (!p.domainCode) {
          erreurs.push({ field: "domainCode", message: "Code de domaine manquant" });
        }
        if (!Number.isFinite(p.weightAdjusted)) {
          erreurs.push({
            field: p.domainCode,
            message: `Facteur non numérique pour ${p.domainCode}`,
          });
        } else if (!facteurValide(p.weightAdjusted)) {
          erreurs.push({
            field: p.domainCode,
            message:
              `Le facteur de ${p.domainCode} doit rester entre ${FACTEUR_MIN} et ` +
              `${FACTEUR_MAX} : au-delà, le calibrage ne corrige plus le modèle, il le remplace.`,
          });
        }
      }

      const doublons = normalises
        .map((p) => p.domainCode)
        .filter((c, i, tous) => c && tous.indexOf(c) !== i);
      if (doublons.length > 0) {
        erreurs.push({
          field: "domainWeights",
          message: `Domaine en double : ${Array.from(new Set(doublons)).join(", ")}`,
        });
      }

      if (erreurs.length > 0) return validationError(erreurs);

      // Remplacement total et transactionnel : un calibrage à moitié écrit
      // pondérerait le dossier avec un mélange de deux paramétrages.
      await prisma.$transaction([
        prisma.v9SectorDomainWeight.deleteMany({ where: { sectorId } }),
        prisma.v9SectorDomainWeight.createMany({
          data: normalises.map((p) => ({ ...p, sectorId })),
        }),
      ]);

      const misAJour = await prisma.v9Sector.findUnique({
        where: { id: sectorId },
        include: {
          domainWeights: { orderBy: { domainCode: "asc" } },
          redFlags: { orderBy: { orderIndex: "asc" } },
          stressTests: { orderBy: { orderIndex: "asc" } },
        },
      });

      return successResponse(misAJour);
    } catch (error) {
      console.error("[ADMIN/SCORING/SECTORS] PUT error:", error);
      return serverError("Erreur lors de l'enregistrement du calibrage");
    }
  });
}
