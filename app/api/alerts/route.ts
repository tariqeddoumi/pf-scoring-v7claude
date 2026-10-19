/**
 * GET /api/alerts
 *
 * Alertes dérivées des évaluations réellement calculées : seuils rédhibitoires
 * déclenchés, scores sous le seuil de vigilance, règles que le moteur n'a pas pu
 * évaluer. Rien n'est stocké — une alerte est une lecture de l'état du moment, et non
 * un enregistrement susceptible de survivre au fait qui l'a provoquée.
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma-client";
import { withAuth } from "@/lib/auth-middleware";
import { successResponse, serverError } from "@/lib/api-response";
import { deriverAlertes, deriverAlertesPF } from "@/lib/services/alert-derivation";
import { chargerParametres, resultatCourant } from "@/lib/modele-pf/serveur";
import { fusionnerParametres, type ParametresModele } from "@/lib/modele-pf/parametres";
import { peutVoirScores } from "@/lib/score-visibility";

export async function GET(req: NextRequest) {
  return withAuth(req, async (_r, user) => {
    try {
      const evaluations = await prisma.scoringEvaluation.findMany({
        where: { isArchived: false },
        select: {
          id: true,
          projectId: true,
          status: true,
          finalScore: true,
          rating: true,
          updatedAt: true,
          summaryJson: true,
          project: { select: { nom: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 200,
      });

      // Scorings Project Finance : verrous et plafonds actifs de leur dernier calcul.
      const [scorings, P] = await Promise.all([
        prisma.evaluationPF.findMany({
          select: {
            id: true, projectId: true, statut: true, updatedAt: true, resultat: true, parametres: true, saisie: true,
            project: { select: { nom: true, codeProjet: true, client: { select: { codeClientT24: true, radical: true } } } },
          },
          orderBy: { updatedAt: "desc" },
          take: 200,
        }),
        chargerParametres(),
      ]);
      const alertesPF = deriverAlertesPF(
        scorings.map((s) => {
          const Ps: ParametresModele = s.statut !== "brouillon" && s.parametres ? fusionnerParametres(s.parametres as never) : P;
          const r = resultatCourant(s, Ps) as { verrousActifs?: unknown; plafondsActifs?: unknown };
          return {
            id: s.id,
            projectId: s.projectId,
            projectName: s.project?.nom ?? "Projet sans nom",
            statut: s.statut,
            updatedAt: s.updatedAt,
            verrousActifs: Array.isArray(r.verrousActifs) ? r.verrousActifs.map(String) : [],
            plafondsActifs: Array.isArray(r.plafondsActifs) ? r.plafondsActifs.map(String) : [],
            libellesVerrous: Ps.verrous,
            libellesPlafonds: Ps.plafonds,
          };
        })
      );

      const alertes = [...alertesPF, ...deriverAlertes(
        evaluations.map((ev) => ({
          id: ev.id,
          projectId: ev.projectId,
          projectName: ev.project?.nom ?? "Projet sans nom",
          status: String(ev.status),
          finalScore: ev.finalScore,
          rating: ev.rating,
          updatedAt: ev.updatedAt,
          summaryJson: ev.summaryJson,
        }))
      )];

      // Une alerte « score faible » révèle le score : réservée aux rôles qui le voient.
      const visibles = peutVoirScores(user.role) ? alertes : alertes.filter((a) => a.type !== "score_faible");
      return successResponse(visibles, { count: visibles.length });
    } catch (error) {
      console.error("[ALERTS] GET error:", error);
      return serverError("Erreur lors de la récupération des alertes");
    }
  });
}
