import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { successResponse, serverError, notFoundError, validationError } from '@/lib/api-response';
import prisma from '@/lib/prisma-client';
import { getAppConfigKey } from '@/lib/services/app-config-service';
import {
  DECISIONS_ADMISES,
  delegationSuffisante,
  lireMatriceDelegation,
  roleRequisPourMontant,
  estFavorable,
  motifRefusDelegation,
  motifsRefusDecisionFavorable,
  statutApresDecision,
} from '@/lib/services/scoring/decision-guard';

/**
 * POST /api/admin/scoring/workflows/[id]/approve — décision du circuit de validation.
 *
 * La route passait le circuit à APPROVED sur simple demande : règle rédhibitoire
 * déclenchée, analyste qui approuve son propre dossier ou approbation supérieure
 * demandée n'empêchaient rien. Les contrôles sont ceux de decision-guard ; un refus
 * est renvoyé en 409 avec ses motifs, sans enregistrer de décision.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (req, user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const {
        decisionType,
        riskRating,
        justification,
        recommendation,
        hasConditions,
        conditionsJson,
        requiresHigherApproval
      } = body;

      const errors = [];
      if (!decisionType) errors.push({ field: 'decisionType', message: 'Type de décision requis' });
      else if (!(DECISIONS_ADMISES as readonly string[]).includes(decisionType)) {
        errors.push({ field: 'decisionType', message: `Type de décision inconnu : ${decisionType}` });
      }
      if (!riskRating) errors.push({ field: 'riskRating', message: 'Note de risque requise' });
      if (!justification) errors.push({ field: 'justification', message: 'Justification requise' });
      if (errors.length > 0) {
        return validationError(errors);
      }

      const workflow = await prisma.scoringWorkflow.findUnique({
        where: { id },
        include: {
          evaluation: {
            select: { status: true, finalScore: true, summaryJson: true, analystId: true, project: { select: { montant: true } } },
          },
          decisions: {
            orderBy: { decidedAt: 'desc' },
            take: 1,
            select: { decidedBy: true, requiresHigherApproval: true, decidedByUser: { select: { role: true } } },
          },
        },
      });
      if (!workflow) {
        return notFoundError('Workflow');
      }

      const refus = (motifs: string[]) =>
        NextResponse.json(
          { success: false, error: motifs.join(' '), errors: motifs, errorCode: 'DECISION_REFUSEE' },
          { status: 409 }
        );

      if (workflow.status === 'APPROVED' || workflow.status === 'REJECTED') {
        return refus(['Le circuit est clos : la décision a déjà été rendue.']);
      }

      const derniere = workflow.decisions[0];
      const delegation = motifRefusDelegation(
        derniere
          ? { decidedBy: derniere.decidedBy, requiresHigherApproval: derniere.requiresHigherApproval, role: derniere.decidedByUser?.role }
          : null,
        user.userId,
        user.role
      );
      if (delegation) return refus([delegation]);

      if (estFavorable(decisionType)) {
        const motifs = motifsRefusDecisionFavorable({
          evaluation: {
            status: String(workflow.evaluation.status),
            finalScore: workflow.evaluation.finalScore,
            summaryJson: workflow.evaluation.summaryJson,
            analystId: workflow.evaluation.analystId,
          },
          decideurId: user.userId,
          soumisPar: workflow.submittedBy,
        });
        if (motifs.length > 0) return refus(motifs);
      }

      // Délégation par montant : un décideur sans délégation suffisante rend un avis
      // favorable, mais le dossier attend l'approbation d'un niveau supérieur.
      const roleRequis = roleRequisPourMontant(
        lireMatriceDelegation(await getAppConfigKey('delegation.matrice').catch(() => null)),
        workflow.evaluation.project?.montant
      );
      const horsDelegation = estFavorable(decisionType) && !delegationSuffisante(user.role, roleRequis);
      const exigeSuperieur = Boolean(requiresHigherApproval) || horsDelegation;
      const newStatus = statutApresDecision(decisionType, exigeSuperieur);

      const [decision] = await prisma.$transaction([
        prisma.scoringDecision.create({
          data: {
            workflowId: id,
            decisionType,
            riskRating,
            justification,
            recommendation,
            hasConditions: hasConditions || false,
            conditionsJson,
            decidedBy: user.userId,
            requiresHigherApproval: exigeSuperieur,
            escalatedTo: horsDelegation ? roleRequis : undefined,
            decidedAt: new Date()
          },
          include: {
            decidedByUser: {
              select: { id: true, email: true, nom: true, prenom: true }
            }
          }
        }),
        prisma.scoringWorkflow.update({
          where: { id },
          data: {
            status: newStatus,
            reviewCompletedAt: newStatus === 'REVIEWED' ? new Date() : undefined,
            approvedAt: newStatus === 'APPROVED' ? new Date() : undefined,
            approvedBy: newStatus === 'APPROVED' ? user.userId : undefined,
            rejectedAt: newStatus === 'REJECTED' ? new Date() : undefined,
            rejectedBy: newStatus === 'REJECTED' ? user.userId : undefined
          }
        }),
      ]);

      return successResponse({ ...decision, workflowStatus: newStatus }, { status: 201 });
    } catch (error: unknown) {
      console.error('[Workflow Approve]', error);
      return serverError('Erreur lors de la création de la décision');
    }
  });
}
