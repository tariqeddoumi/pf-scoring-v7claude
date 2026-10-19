/**
 * GET /api/analytics
 *
 * Analyses du portefeuille dérivées des évaluations (scorings Project Finance) : score
 * moyen, tendance mensuelle, distribution des grades et moyenne par domaine. Rien n'est
 * produit lorsqu'aucun scoring n'a de score.
 *
 * La route lisait l'ancien moteur de questionnaire : avec les seuls scorings PF, l'écran
 * annonçait « aucune évaluation calculée ». Les analyses ne parlent que de scores et de
 * notes : elles sont réservées aux rôles qui les voient (l'écran plantait pour les autres,
 * les clés masquées manquant à la réponse).
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { withAuth } from "@/lib/auth-middleware";
import { successResponse, serverError } from "@/lib/api-response";
import { peutVoirScores } from "@/lib/score-visibility";
import { chargerParametres, resultatCourant } from "@/lib/modele-pf/serveur";
import { DOMAINES_GRILLE, fusionnerParametres, gradeDeLaNote, type ParametresModele } from "@/lib/modele-pf/parametres";
import { deriverAnalyses, type ResultatDomaine } from "@/lib/services/analytics-derivation";

export async function GET(req: NextRequest) {
  return withAuth(req, async (_r, user) => {
    if (!peutVoirScores(user.role)) {
      return NextResponse.json({ error: "Les analyses de portefeuille sont réservées aux rôles qui voient les scores" }, { status: 403 });
    }
    try {
      const [evaluations, P] = await Promise.all([
        prisma.evaluationPF.findMany({
          select: {
            id: true, statut: true, scoreGlobal: true, noteApprouvee: true, updatedAt: true, projectId: true,
            resultat: true, parametres: true, saisie: true,
            project: { select: { nom: true, montant: true, codeProjet: true, client: { select: { codeClientT24: true, radical: true } } } },
          },
          orderBy: { updatedAt: "desc" },
        }),
        chargerParametres(),
      ]);

      const domaines: ResultatDomaine[] = [];
      const lignes = evaluations.map((e) => {
        // Un dossier soumis ou décidé se lit avec les paramètres de sa soumission.
        const Pe: ParametresModele = e.statut !== "brouillon" && e.parametres ? fusionnerParametres(e.parametres as never) : P;
        const r = resultatCourant(e, Pe) as { domaines?: Record<string, number | null>; d7?: number | null };
        for (const code of DOMAINES_GRILLE) {
          const v = r.domaines?.[code];
          if (typeof v === "number" && Number.isFinite(v)) {
            domaines.push({ evaluationId: e.id, domainCode: code, domainLabel: Pe.libellesDomaines[code], rawScore: v, weight: null });
          }
        }
        if (typeof r.d7 === "number" && Number.isFinite(r.d7)) {
          domaines.push({ evaluationId: e.id, domainCode: "D7", domainLabel: Pe.libellesDomaines.D7, rawScore: r.d7, weight: null });
        }
        const note = e.noteApprouvee === "—" ? "—" : e.noteApprouvee ? Number(e.noteApprouvee) : null;
        return {
          id: e.id,
          status: e.statut,
          finalScore: e.scoreGlobal,
          rating: gradeDeLaNote(note, Pe),
          updatedAt: e.updatedAt,
          projectId: e.projectId,
          projectName: e.project?.nom ?? null,
          montant: e.project?.montant ?? null,
        };
      });

      return successResponse(deriverAnalyses(lignes, domaines.sort((a, b) => a.domainCode.localeCompare(b.domainCode))));
    } catch (error) {
      console.error("[ANALYTICS] GET error:", error);
      return serverError("Erreur lors du calcul des analyses");
    }
  });
}
