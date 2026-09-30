import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";

/**
 * POST /api/scoring/evaluations/[id]/reopen
 * Corps : { motif: string }
 *
 * Remet en saisie une évaluation soumise ou rejetée.
 *
 * Une fois soumise, une évaluation ne pouvait plus être modifiée par aucun moyen :
 * les réponses et le calcul sont réservés aux brouillons, et aucune transition ne
 * ramenait un dossier soumis à l'état de brouillon. Une erreur de saisie découverte
 * après soumission obligeait à recréer l'évaluation de zéro.
 *
 * Le retour en saisie est tracé (auteur, date, motif) et interdit une fois la
 * décision rendue : une évaluation validée ne se corrige pas, elle se réévalue.
 * Le score n'est jamais corrigé directement : on corrige les réponses, puis on
 * relance le calcul.
 */
async function handlePOST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  user: AuthPayload
) {
  try {
    if (!hasPermission(user.role as UserRole, "evaluation", "update")) {
      return NextResponse.json(
        { success: false, error: "Vos droits ne permettent pas de modifier cette évaluation", errorCode: "ERR_FORBIDDEN" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const motif = typeof body.motif === "string" ? body.motif.trim() : "";
    if (motif.length < 5) {
      return NextResponse.json(
        { success: false, error: "Indiquez le motif du retour en saisie (5 caractères au moins).", errorCode: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id },
      select: { id: true, status: true, projectId: true, finalScore: true, rating: true, notes: true, workflow: { select: { id: true, status: true } } },
    });
    if (!evaluation) {
      return NextResponse.json({ success: false, error: "Évaluation introuvable", errorCode: "NOT_FOUND" }, { status: 404 });
    }

    const statut = String(evaluation.status);
    if (statut === "brouillon") {
      return NextResponse.json({ success: false, error: "L'évaluation est déjà en saisie.", errorCode: "INVALID_STATE" }, { status: 400 });
    }
    if (statut === "valide" || evaluation.workflow?.status === "APPROVED") {
      return NextResponse.json(
        {
          success: false,
          error: "Une évaluation validée ne se modifie plus : créez une nouvelle évaluation du projet (réévaluation).",
          errorCode: "INVALID_STATE",
        },
        { status: 409 }
      );
    }

    const horodatage = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Casablanca" });
    const trace = `[${horodatage}] Remise en saisie depuis « ${statut} » — motif : ${motif}`;

    const [maj] = await prisma.$transaction([
      prisma.scoringEvaluation.update({
        where: { id },
        data: {
          status: "brouillon",
          submittedAt: null,
          rejectedAt: null,
          rejectionReason: null,
          // Le motif est conservé dans les notes du dossier, à la suite des précédentes.
          notes: evaluation.notes ? `${evaluation.notes}\n${trace}` : trace,
        },
        select: { id: true, status: true },
      }),
      ...(evaluation.workflow && evaluation.workflow.status !== "DRAFT"
        ? [prisma.scoringWorkflow.update({ where: { id: evaluation.workflow.id }, data: { status: "DRAFT" } })]
        : []),
      prisma.auditLog.create({
        data: {
          action: "EVALUATION_REOPENED",
          projectId: evaluation.projectId,
          utilisateurId: user.userId,
          details: JSON.stringify({
            evaluationId: id,
            from: statut,
            to: "brouillon",
            score: evaluation.finalScore,
            rating: evaluation.rating,
            motif,
          }),
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: maj });
  } catch (error: unknown) {
    console.error("[EVALUATION REOPEN]", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: "Remise en saisie impossible" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return withAuth(req, (r, user) => handlePOST(r, ctx, user));
}
