import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { lirePagination } from "@/lib/validation-schemas";
import { messagePublic } from "@/lib/erreur-publique";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";
import prisma from "@/lib/prisma-client";
import { peutVoirScores } from "@/lib/score-visibility";
import { chargerParametres } from "@/lib/modele-pf/serveur";
import { fusionnerParametres, gradeDeLaNote } from "@/lib/modele-pf/parametres";

/**
 * GET /api/evaluations — liste des évaluations, c'est-à-dire des scorings Project Finance
 * (parcours en 13 blocs).
 *
 * La route lisait l'ancien moteur de questionnaire générique : les scorings PF, seuls
 * utilisés, n'apparaissaient ni dans la page Évaluations ni dans le tableau de bord, la
 * recherche ou les compteurs. Les champs gardent les noms attendus par ces écrans
 * (status, finalScore, rating, project, analyst) ; « lien » mène à l'écran de scoring.
 */
async function handleGET(request: NextRequest, user: AuthPayload) {
  try {
    // Tout rôle qui lit les évaluations : le comité (décideur), l'auditeur et la lecture
    // seule recevaient 403 alors que le détail d'une évaluation leur est ouvert. Les
    // notes restent masquées selon le rôle (withAuth).
    if (!hasPermission(user.role as UserRole, "evaluation", "read")) {
      return NextResponse.json(
        { error: "Vos droits ne permettent pas de consulter les évaluations" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    // Une limite hors bornes se borne au lieu de faire échouer la requête : la
    // liste répondait 400 et l'écran affichait « Chargement impossible ».
    const { page, limit } = lirePagination(searchParams, 50);
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");
    const where = { ...(status && { statut: status }), ...(projectId && { projectId }) };

    const [lignes, total, P] = await Promise.all([
      prisma.evaluationPF.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, projectId: true, titre: true, statut: true, scoreGlobal: true, noteCalculee: true,
          noteApprouvee: true, statutNote: true, parametres: true, regimeRetenu: true, soumisLe: true, createdAt: true, updatedAt: true,
          creePar: true,
          project: {
            select: { id: true, nom: true, montant: true, secteur: true, codeProjet: true, client: { select: { id: true, nom: true } } },
          },
        },
      }),
      prisma.evaluationPF.count({ where }),
      chargerParametres(),
    ]);
    // Pas de relation vers l'auteur dans le modèle : les noms sont lus en une requête.
    const auteurs = new Map(
      (await prisma.user.findMany({ where: { id: { in: [...new Set(lignes.map((e) => e.creePar))] } }, select: { id: true, nom: true, prenom: true } }))
        .map((u) => [u.id, { nom: u.nom, prenom: u.prenom }])
    );
    const voir = peutVoirScores(user.role);
    const data = lignes.map((e) => {
      const note = e.noteApprouvee === "—" ? "—" : e.noteApprouvee ? Number(e.noteApprouvee) : null;
      return {
        id: e.id,
        projectId: e.projectId,
        titre: e.titre,
        status: e.statut,
        finalScore: e.scoreGlobal,
        // Un dossier soumis ou décidé garde la correspondance des grades de sa soumission,
        // comme l'écran de scoring qui le relit avec ses paramètres figés.
        rating: gradeDeLaNote(note, e.statut !== "brouillon" && e.parametres ? fusionnerParametres(e.parametres as never) : P),
        ...(voir && { noteCalculee: e.noteCalculee, noteApprouvee: e.noteApprouvee }),
        // Le statut de note commence par « Hors périmètre » (exclusion) ou « Note provisoire »
        // (blocage) ; il ne contient pas la note et reste visible de tous les rôles.
        statutNote: e.statutNote,
        regimeRetenu: e.regimeRetenu,
        submittedAt: e.soumisLe,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        project: e.project,
        analyst: auteurs.get(e.creePar) ?? null,
        lien: `/scoring-pf/${e.id}`,
      };
    });
    return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error: unknown) {
    // La route répondait 400 à toute erreur, y compris une panne de base : l'écran
    // lisait « requête invalide » là où le serveur était en défaut, et le message
    // brut ne disait rien d'exploitable.
    const message = messagePublic(error, "Requête refusée");
    console.error("[LISTE] GET error:", message);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération de la liste" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handleGET(req, user));
}

/** L'ancienne création (moteur générique) est retirée : un scoring se crée sur le projet. */
export function POST() {
  return NextResponse.json({ error: "Route retirée : utilisez POST /api/projects/[id]/evaluations-pf." }, { status: 410 });
}
