import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { successResponse, serverError, notFoundError } from '@/lib/api-response';
import prisma from '@/lib/prisma-client';
import { exigeRecalcul, motifRefusTransitionDerogation } from '@/lib/services/scoring/override-rules';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;

      const override = await prisma.scoringOverride.findUnique({
        where: { id },
        include: {
          evaluation: {
            select: { id: true, finalScore: true, project: true }
          },
          node: {
            select: { id: true, label: true, code: true }
          },
          overriddenByUser: {
            select: { id: true, email: true, nom: true, prenom: true }
          },
          approvedByUser: {
            select: { id: true, email: true, nom: true, prenom: true }
          }
        }
      });

      if (!override) {
        return notFoundError('Override');
      }

      return successResponse(override, { status: 200 });
    } catch (error: any) {
      console.error('[Override GET]', error);
      return serverError('Erreur lors de la récupération de la surcharge');
    }
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (req, user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { status, auditNotes } = body;

      const override = await prisma.scoringOverride.findUnique({
        where: { id },
        include: { evaluation: { select: { status: true } } },
      });
      if (!override) {
        return notFoundError('Override');
      }

      const motif = motifRefusTransitionDerogation({
        statutActuel: override.status,
        cible: status,
        proposePar: override.overriddenBy,
        utilisateur: user.userId,
      });
      if (motif) {
        return NextResponse.json({ success: false, error: motif, errorCode: 'INVALID_TRANSITION' }, { status: 409 });
      }
      // Une dérogation qui change la note ne s'applique qu'à un dossier en saisie :
      // un dossier soumis ou validé ne se modifie plus (il se remet en saisie, tracé).
      if (exigeRecalcul(status) && String(override.evaluation.status) !== 'brouillon') {
        return NextResponse.json(
          { success: false, error: 'Le dossier doit être en saisie pour appliquer ou annuler une dérogation.', errorCode: 'INVALID_STATE' },
          { status: 409 }
        );
      }

      const maintenant = new Date();
      const [updated] = await prisma.$transaction([
        prisma.scoringOverride.update({
          where: { id },
          data: {
            status,
            // l'approbateur est l'utilisateur connecté, jamais une valeur de la requête
            approvedBy: status === 'APPROVED' ? user.userId : undefined,
            approvedAt: status === 'APPROVED' ? maintenant : undefined,
            auditNotes: auditNotes ?? undefined,
            changeLog: `${override.changeLog ? override.changeLog + '\n' : ''}[${maintenant.toISOString()}] ${override.status} → ${status} par ${user.userId}`,
          },
          include: {
            evaluation: { select: { id: true, finalScore: true } },
            node: { select: { id: true, label: true } },
            overriddenByUser: { select: { id: true, email: true, nom: true, prenom: true } },
            approvedByUser: { select: { id: true, email: true, nom: true, prenom: true } }
          }
        }),
        // la note doit être recalculée avec (ou sans) la dérogation
        ...(exigeRecalcul(status)
          ? [
              prisma.scoringEvaluation.update({
                where: { id: override.evaluationId },
                data: { finalScore: null, rating: null, recommendation: null, summaryJson: null, triggeredRulesJson: null },
              }),
            ]
          : []),
        prisma.scoringChangeLog.create({
          data: {
            entityType: 'ScoringOverride',
            entityId: id,
            evaluationId: override.evaluationId,
            action: `OVERRIDE_${status}`,
            oldValueJson: JSON.stringify({ status: override.status }),
            newValueJson: JSON.stringify({ status, originalScore: override.originalScore, overriddenScore: override.overriddenScore }),
            changedBy: user.userId,
            comment: 'Dérogation',
          },
        }),
      ]);

      return successResponse(updated, { status: 200 });
    } catch (error: any) {
      console.error('[Override PATCH]', error);
      return serverError('Erreur lors de la mise à jour de la surcharge');
    }
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;

      const override = await prisma.scoringOverride.findUnique({
        where: { id }
      });

      if (!override) {
        return notFoundError('Override');
      }
      // Une dérogation approuvée ou annulée fait partie de la piste d'audit.
      if (!['PENDING', 'REJECTED'].includes(override.status)) {
        return NextResponse.json(
          { success: false, error: "Une dérogation approuvée ne se supprime pas : annulez-la (REVERTED).", errorCode: 'INVALID_STATE' },
          { status: 409 }
        );
      }

      await prisma.scoringOverride.delete({
        where: { id }
      });

      return successResponse({ id }, { status: 200 });
    } catch (error: any) {
      console.error('[Override DELETE]', error);
      return serverError('Erreur lors de la suppression de la surcharge');
    }
  });
}
